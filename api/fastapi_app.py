import logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from auth import verify_telegram_init_data
from models import UserInfoDTO, GoodCardRequest, GoodCardResponse
from database import get_user, create_good_card

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="FanFanTulpan API", version="1.0.0")

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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
