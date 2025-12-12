import logging
import uuid
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from auth import verify_telegram_init_data
from models import UserInfoDTO, GoodCardRequest, GoodCardResponse
from database import get_user, create_good_card

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="FanFanTulpan API", version="1.0.0")

# Upload configuration
UPLOAD_DIR = Path("/home/mikhail/brobrocode/flower-shop/api/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Configure CORS
# Note: In production behind nginx proxy, requests come from same origin
# CORS is only needed for direct API access during testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Vite dev server
        "http://localhost:5173",  # Alternative Vite port
        "https://cadra.online",   # Production domain
        "https://www.cadra.online"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.get("/users/me", response_model=UserInfoDTO)
async def get_current_user(user_id: int = Depends(verify_telegram_init_data)):
    """
    Get current user information

    Requires valid Telegram WebApp initData in Authorization header
    """
    logger.info(f"Fetching user info for user_id={user_id}")

    # Get user from database
    user = await get_user(user_id)

    if not user:
        logger.warning(f"User {user_id} not found in database")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Return user info as DTO
    return UserInfoDTO(
        id=user["id"],
        role=user["role"],
        mode=user["mode"],
        status=user["status"]
    )


async def verify_admin_mode(user_id: int = Depends(verify_telegram_init_data)) -> int:
    """
    Verify that the user is in ADMIN mode

    Requires valid Telegram WebApp initData in Authorization header
    Returns user_id if user is in ADMIN mode, raises 403 otherwise
    """
    user = await get_user(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.get("mode") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin mode required"
        )

    return user_id


@app.post("/goods/card", response_model=GoodCardResponse)
async def create_good_card_endpoint(
    good_card: GoodCardRequest,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Create a new good card (ADMIN only)

    Requires valid Telegram WebApp initData in Authorization header
    User must be in ADMIN mode
    """
    logger.info(f"User {user_id} creating new good card: {good_card.name}")

    try:
        # Create good card in database
        created_good = await create_good_card(
            name=good_card.name,
            category=good_card.category,
            price=good_card.price,
            description=good_card.description,
            image_url=good_card.image_url
        )

        # Return response
        return GoodCardResponse(**created_good)
    except Exception as e:
        logger.error(f"Failed to create good card: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create good card"
        )


@app.post("/shop/upload")
async def upload_image(image: UploadFile = File(...)):
    """
    Upload product image

    Accepts image file (jpg, jpeg, png, webp) up to 5MB
    Returns image URL for use in product cards
    """
    logger.info(f"Uploading image: {image.filename}")

    # Validate file extension
    file_ext = Path(image.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only images are allowed ({', '.join(ALLOWED_EXTENSIONS)})"
        )

    # Validate content type
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )

    # Read file content
    contents = await image.read()

    # Validate file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 5MB limit"
        )

    # Generate unique filename
    timestamp = int(datetime.now().timestamp())
    unique_id = uuid.uuid4().hex[:8]
    filename = f"{timestamp}-{unique_id}{file_ext}"
    file_path = UPLOAD_DIR / filename

    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
        logger.info(f"Image saved: {filename}")
    except Exception as e:
        logger.error(f"Failed to save image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save image"
        )

    # Return URL
    image_url = f"/static/{filename}"
    return {
        "success": True,
        "imageUrl": image_url,
        "filename": filename
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
