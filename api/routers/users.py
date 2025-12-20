import logging
from fastapi import APIRouter, Depends, HTTPException, status

from auth import verify_telegram_init_data, verify_admin_mode
from models import UserInfoDTO, UserModeUpdateRequest, SettingDTO, SettingRequest
from database import get_user, update_user_mode, get_all_settings, upsert_setting, delete_setting

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserInfoDTO)
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


@router.put("/me/mode", response_model=UserInfoDTO)
async def update_current_user_mode(
    request: UserModeUpdateRequest,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Update current user mode (ADMIN only)

    Requires valid Telegram WebApp initData in Authorization header and ADMIN mode
    """
    logger.info(f"Updating mode for user_id={user_id} to {request.mode}")

    # Validate mode value
    if request.mode not in ['ADMIN', 'USER']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mode must be either 'ADMIN' or 'USER'"
        )

    # Update user mode
    await update_user_mode(user_id, request.mode)

    # Get updated user info
    user = await get_user(user_id)

    if not user:
        logger.error(f"User {user_id} not found after mode update")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Return updated user info
    return UserInfoDTO(
        id=user["id"],
        role=user["role"],
        mode=user["mode"],
        status=user["status"]
    )


@router.get("/settings", response_model=list[SettingDTO])
async def get_settings(user_id: int = Depends(verify_admin_mode)):
    """
    Get all active settings (ADMIN only)

    Requires valid Telegram WebApp initData in Authorization header and ADMIN mode
    """
    logger.info(f"Fetching all settings for user_id={user_id}")

    # Get all active settings
    settings = await get_all_settings()

    # Convert to DTOs
    return [
        SettingDTO(
            id=setting["id"],
            type=setting["type"],
            value=setting["value"],
            createstamp=setting["createstamp"],
            changestamp=setting["changestamp"],
            createuser=setting["createuser"],
            changeuser=setting["changeuser"],
            status=setting["status"]
        )
        for setting in settings
    ]


@router.post("/settings", response_model=SettingDTO)
async def create_or_update_setting(
    request: SettingRequest,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Create or update a setting (upsert) (ADMIN only)

    Requires valid Telegram WebApp initData in Authorization header and ADMIN mode
    """
    logger.info(f"Upserting setting type={request.type} for user_id={user_id}")

    # Upsert setting
    setting = await upsert_setting(request.type, request.value, user_id)

    # Return setting as DTO
    return SettingDTO(
        id=setting["id"],
        type=setting["type"],
        value=setting["value"],
        createstamp=setting["createstamp"],
        changestamp=setting["changestamp"],
        createuser=setting["createuser"],
        changeuser=setting["changeuser"],
        status=setting["status"]
    )


@router.delete("/settings/{setting_type}")
async def delete_setting_by_type(
    setting_type: str,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Delete a setting by type (ADMIN only)

    Requires valid Telegram WebApp initData in Authorization header and ADMIN mode
    """
    logger.info(f"Deleting setting type={setting_type} by user_id={user_id}")

    try:
        await delete_setting(setting_type)
        return {"message": f"Setting {setting_type} deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
