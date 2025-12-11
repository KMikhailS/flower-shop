import logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from auth import verify_telegram_init_data
from models import UserInfoDTO
from database import get_user

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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
