import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from dependencies import verify_admin_mode
from auth import verify_telegram_init_data
from models import OrderRequest, OrderDTO, CartItemDTO
from database import (
    create_order,
    update_order,
    get_order_by_id,
    get_orders,
    delete_order,
    get_user
)
from notifications import send_order_notification_to_manager, send_order_notification_to_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderDTO)
async def create_order_endpoint(
    order: OrderRequest,
    user_id: int = Depends(verify_telegram_init_data)
):
    """
    Create a new order

    Requires valid Telegram WebApp initData in Authorization header
    Any authenticated user can create an order
    """
    logger.info(f"User {user_id} creating new order for user_id={order.user_id}")

    try:
        # Convert cart items to dict format for database function
        cart_items_dict = [
            {'good_id': item.good_id, 'count': item.count}
            for item in order.cart_items
        ]

        # Create order in database
        created_order = await create_order(
            status=order.status,
            user_id=order.user_id,
            delivery_type=order.delivery_type,
            delivery_address=order.delivery_address,
            cart_items=cart_items_dict,
            createuser=user_id
        )

        # Send notification to manager (non-blocking - don't fail if notification fails)
        try:
            notification_sent = await send_order_notification_to_manager(created_order)
            if notification_sent:
                logger.info(f"Order notification sent successfully for order #{created_order['id']}")
            else:
                logger.warning(f"Order notification was not sent for order #{created_order['id']}")
        except Exception as e:
            logger.error(f"Error sending order notification for order #{created_order['id']}: {str(e)}")

        # Send email notification (non-blocking - don't fail if notification fails)
        try:
            email_sent = await send_order_notification_to_email(created_order)
            if email_sent:
                logger.info(f"Email notification sent successfully for order #{created_order['id']}")
            else:
                logger.warning(f"Email notification was not sent for order #{created_order['id']}")
        except Exception as e:
            logger.error(f"Error sending email notification for order #{created_order['id']}: {str(e)}")

        # Get user phone
        user = await get_user(created_order["user_id"])
        user_phone = user.get("phone") if user else None

        # Return response
        return OrderDTO(
            id=created_order["id"],
            status=created_order["status"],
            user_id=created_order["user_id"],
            user_phone=user_phone,
            createstamp=created_order["createstamp"],
            changestamp=created_order["changestamp"],
            createuser=created_order.get("createuser"),
            changeuser=created_order.get("changeuser"),
            delivery_type=created_order["delivery_type"],
            delivery_address=created_order["delivery_address"],
            cart_items=[CartItemDTO(**item) for item in created_order["cart_items"]]
        )
    except Exception as e:
        logger.error(f"Failed to create order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order"
        )


@router.put("/{order_id}", response_model=OrderDTO)
async def update_order_endpoint(
    order_id: int,
    order: OrderRequest,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Update existing order (ADMIN only)

    Requires valid Telegram WebApp initData in Authorization header
    User must be in ADMIN mode
    """
    logger.info(f"User {user_id} updating order {order_id}")

    try:
        # Convert cart items to dict format for database function
        cart_items_dict = [
            {'good_id': item.good_id, 'count': item.count}
            for item in order.cart_items
        ]

        # Update order in database
        updated_order = await update_order(
            order_id=order_id,
            status=order.status,
            delivery_type=order.delivery_type,
            delivery_address=order.delivery_address,
            cart_items=cart_items_dict,
            changeuser=user_id
        )

        # Get user phone
        user = await get_user(updated_order["user_id"])
        user_phone = user.get("phone") if user else None

        # Return response
        return OrderDTO(
            id=updated_order["id"],
            status=updated_order["status"],
            user_id=updated_order["user_id"],
            user_phone=user_phone,
            createstamp=updated_order["createstamp"],
            changestamp=updated_order["changestamp"],
            createuser=updated_order.get("createuser"),
            changeuser=updated_order.get("changeuser"),
            delivery_type=updated_order["delivery_type"],
            delivery_address=updated_order["delivery_address"],
            cart_items=[CartItemDTO(**item) for item in updated_order["cart_items"]]
        )
    except ValueError as e:
        logger.error(f"Order not found: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found"
        )
    except Exception as e:
        logger.error(f"Failed to update order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update order"
        )


@router.get("/my", response_model=list[OrderDTO])
async def get_my_orders_endpoint(
    user_id: int = Depends(verify_telegram_init_data)
):
    """
    Get orders for current user

    Requires valid Telegram WebApp initData in Authorization header
    Returns only orders belonging to the authenticated user
    """
    logger.info(f"User {user_id} fetching their orders")

    try:
        orders = await get_orders(user_id_filter=user_id)

        # Get user phone
        user = await get_user(user_id)
        user_phone = user.get("phone") if user else None

        return [
            OrderDTO(
                id=order["id"],
                status=order["status"],
                user_id=order["user_id"],
                user_phone=user_phone,
                createstamp=order["createstamp"],
                changestamp=order["changestamp"],
                createuser=order.get("createuser"),
                changeuser=order.get("changeuser"),
                delivery_type=order["delivery_type"],
                delivery_address=order["delivery_address"],
                cart_items=[CartItemDTO(**item) for item in order["cart_items"]]
            )
            for order in orders
        ]
    except Exception as e:
        logger.error(f"Failed to fetch user orders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch orders"
        )


@router.get("/{order_id}", response_model=OrderDTO)
async def get_order_endpoint(
    order_id: int,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Get order by ID (ADMIN only)

    Requires valid Telegram WebApp initData in Authorization header
    User must be in ADMIN mode
    """
    logger.info(f"User {user_id} fetching order {order_id}")

    try:
        order = await get_order_by_id(order_id)

        # Get user phone
        user = await get_user(order["user_id"])
        user_phone = user.get("phone") if user else None

        return OrderDTO(
            id=order["id"],
            status=order["status"],
            user_id=order["user_id"],
            user_phone=user_phone,
            createstamp=order["createstamp"],
            changestamp=order["changestamp"],
            createuser=order.get("createuser"),
            changeuser=order.get("changeuser"),
            delivery_type=order["delivery_type"],
            delivery_address=order["delivery_address"],
            cart_items=[CartItemDTO(**item) for item in order["cart_items"]]
        )
    except ValueError as e:
        logger.error(f"Order not found: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found"
        )
    except Exception as e:
        logger.error(f"Failed to fetch order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch order"
        )


@router.get("", response_model=list[OrderDTO])
async def get_orders_endpoint(
    order_id: Optional[int] = Query(None, description="Filter by order ID"),
    status: Optional[str] = Query(None, description="Filter by order status"),
    user_id: int = Depends(verify_admin_mode)
):
    """
    Get all orders with optional filters (ADMIN only)

    Query parameters:
    - order_id: Filter by specific order ID
    - status: Filter by order status

    Requires valid Telegram WebApp initData in Authorization header
    User must be in ADMIN mode
    """
    logger.info(f"User {user_id} fetching orders with filters: order_id={order_id}, status={status}")

    try:
        orders = await get_orders(order_id_filter=order_id, status_filter=status)

        # Build list with user phones
        result = []
        for order in orders:
            user = await get_user(order["user_id"])
            user_phone = user.get("phone") if user else None
            result.append(OrderDTO(
                id=order["id"],
                status=order["status"],
                user_id=order["user_id"],
                user_phone=user_phone,
                createstamp=order["createstamp"],
                changestamp=order["changestamp"],
                createuser=order.get("createuser"),
                changeuser=order.get("changeuser"),
                delivery_type=order["delivery_type"],
                delivery_address=order["delivery_address"],
                cart_items=[CartItemDTO(**item) for item in order["cart_items"]]
            ))

        return result
    except Exception as e:
        logger.error(f"Failed to fetch orders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch orders"
        )


@router.delete("/{order_id}")
async def delete_order_endpoint(
    order_id: int,
    user_id: int = Depends(verify_admin_mode)
):
    """
    Delete order (ADMIN only)

    Requires valid Telegram WebApp initData in Authorization header
    User must be in ADMIN mode
    """
    logger.info(f"User {user_id} deleting order {order_id}")

    try:
        await delete_order(order_id)
        return {"success": True, "message": f"Order {order_id} deleted"}
    except ValueError as e:
        logger.error(f"Order not found: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found"
        )
    except Exception as e:
        logger.error(f"Failed to delete order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete order"
        )
