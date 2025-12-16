import logging
from fastapi import APIRouter

from models import PromoBannerDTO
from database import get_promo_banners

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/promo", tags=["promo"])


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
