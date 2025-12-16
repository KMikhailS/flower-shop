import logging
from pathlib import Path
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File

from dependencies import verify_admin_mode
from models import PromoBannerDTO
from database import get_promo_banners, create_promo_banner

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/promo", tags=["promo"])

# Upload configuration
UPLOAD_DIR = Path("/app/data/uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.get("", response_model=list[PromoBannerDTO])
async def get_promo():
    """
    Get all promo banners with status NEW (public endpoint)

    No authentication required
    """
    logger.info("Fetching all promo banners with status NEW")

    try:
        # Get promo banners from database
        banners = await get_promo_banners()

        # Convert to DTOs
        return [
            PromoBannerDTO(
                id=banner["id"],
                status=banner["status"],
                display_order=banner["display_order"],
                image_url=banner["image_url"]
            )
            for banner in banners
        ]
    except Exception as e:
        logger.error(f"Error fetching promo banners: {e}")
        raise


@router.post("", response_model=PromoBannerDTO)
async def create_promo_banner_endpoint(
    image: UploadFile = File(...),
    user_id: int = Depends(verify_admin_mode)
):
    """
    Create a new promo banner by uploading an image (ADMIN only)

    Uploads image and creates a new promo banner record
    Returns created PromoBannerDTO
    """
    logger.info(f"User {user_id} creating new promo banner")

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
            detail=f"File size exceeds 5MB limit"
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
        logger.info(f"Promo banner image saved: {filename}")
    except Exception as e:
        logger.error(f"Failed to save promo banner image: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image"
        )

    # Create promo banner record in database
    image_url = f"/api/static/{filename}"
    try:
        banner = await create_promo_banner(image_url)
        logger.info(f"Created promo banner with id={banner['id']}")

        # Return as DTO
        return PromoBannerDTO(
            id=banner["id"],
            status=banner["status"],
            display_order=banner["display_order"],
            image_url=banner["image_url"]
        )
    except Exception as e:
        logger.error(f"Failed to create promo banner in database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create promo banner"
        )
