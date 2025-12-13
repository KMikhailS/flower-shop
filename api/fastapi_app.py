import logging
import uuid
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from auth import verify_telegram_init_data
from models import UserInfoDTO, GoodCardRequest, GoodCardResponse, GoodDTO
from database import get_user, create_good_card, get_goods_by_status, save_good_images, update_good_card

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="FanFanTulpan API", version="1.0.0")

# Upload configuration
# Use /app/data/uploads to leverage the Docker volume mount
UPLOAD_DIR = Path("/app/data/uploads")
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

# Mount static files directory for serving uploaded images
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")


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


@app.get("/goods", response_model=list[GoodDTO])
async def get_goods():
    """
    Get all goods with status NEW (public endpoint)

    No authentication required
    """
    logger.info("Fetching all goods with status NEW")

    try:
        # Get goods from database
        goods = await get_goods_by_status('NEW')

        # Convert to DTOs
        return [
            GoodDTO(
                id=good["id"],
                name=good["name"],
                category=good["category"],
                price=good["price"],
                description=good["description"],
                image_urls=good["image_urls"]
            )
            for good in goods
        ]
    except Exception as e:
        logger.error(f"Failed to fetch goods: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch goods"
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
            description=good_card.description
        )

        # Return response
        return GoodCardResponse(**created_good)
    except Exception as e:
        logger.error(f"Failed to create good card: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create good card"
        )


@app.put("/goods/{good_id}", response_model=GoodCardResponse)
async def update_good_card_endpoint(
    good_id: int,
    good_card: GoodCardRequest,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Update existing good card (ADMIN only)

    Requires valid Telegram WebApp initData in Authorization header
    User must be in ADMIN mode
    """
    logger.info(f"User {user_id} updating good card {good_id}: {good_card.name}")

    try:
        # Update good card in database
        updated_good = await update_good_card(
            good_id=good_id,
            name=good_card.name,
            category=good_card.category,
            price=good_card.price,
            description=good_card.description
        )

        # Return response
        return GoodCardResponse(**updated_good)
    except ValueError as e:
        logger.error(f"Good not found: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Good with id {good_id} not found"
        )
    except Exception as e:
        logger.error(f"Failed to update good card: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update good card"
        )


@app.post("/shop/upload")
async def upload_images(images: list[UploadFile] = File(...)):
    """
    Upload multiple product images

    Accepts list of image files (jpg, jpeg, png, webp) up to 5MB each
    Returns list of image URLs for use in product cards
    """
    logger.info(f"Uploading {len(images)} images")

    uploaded_urls = []

    for image in images:
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
                detail=f"File {image.filename} size exceeds 5MB limit"
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
                detail=f"Failed to save image {image.filename}"
            )

        # Add URL to list (including /api prefix for nginx proxy routing)
        image_url = f"/api/static/{filename}"
        uploaded_urls.append(image_url)

    return {
        "success": True,
        "imageUrls": uploaded_urls
    }


@app.post("/goods/{good_id}/images")
async def add_good_images(
    good_id: int,
    images: list[UploadFile] = File(...),
    user_id: int = Depends(verify_admin_mode)
):
    """
    Add images to existing good (ADMIN only)

    Uploads images and associates them with the specified good
    Returns list of uploaded image URLs
    """
    logger.info(f"User {user_id} adding {len(images)} images to good {good_id}")

    uploaded_urls = []

    # Upload all images first
    for image in images:
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
                detail=f"File {image.filename} size exceeds 5MB limit"
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
                detail=f"Failed to save image {image.filename}"
            )

        # Add URL to list
        image_url = f"/api/static/{filename}"
        uploaded_urls.append(image_url)

    # Save image URLs to database
    try:
        await save_good_images(good_id, uploaded_urls)
    except Exception as e:
        logger.error(f"Failed to save image URLs to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to associate images with good"
        )

    return {
        "success": True,
        "goodId": good_id,
        "imageUrls": uploaded_urls
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
