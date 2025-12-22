"""
Telegram notifications module for sending order notifications to managers
"""
import os
import logging
from datetime import datetime
from typing import Optional
from aiogram import Bot

from database import get_setting_by_type, get_user

logger = logging.getLogger(__name__)


async def send_order_notification_to_manager(order_data: dict) -> bool:
    """
    Send order notification to manager's Telegram chat
    
    Args:
        order_data: Dictionary containing order information with keys:
            - id: order ID
            - user_id: user ID who created the order
            - cart_items: list of cart items with good_name, count, price
            - delivery_type: delivery type (PICK_UP or COURIER)
            - delivery_address: delivery address
            - createstamp: order creation timestamp
    
    Returns:
        bool: True if notification was sent successfully, False otherwise
    """
    try:
        # Get MANAGER_CHAT_ID from settings
        manager_setting = await get_setting_by_type('MANAGER_CHAT_ID')
        
        if not manager_setting or not manager_setting.get('value'):
            logger.warning("MANAGER_CHAT_ID setting not found or empty. Skipping notification.")
            return False
        
        manager_chat_id = manager_setting['value']
        
        # Get user information
        user = await get_user(order_data['user_id'])
        username = user.get('username', 'не указан') if user else 'не указан'
        phone = user.get('phone', 'не указан') if user else 'не указан'

        # Format delivery type
        delivery_type_text = "Самовывоз" if order_data['delivery_type'] == 'PICK_UP' else "Курьером"
        
        # Calculate total price
        total_price = sum(item['price'] * item['count'] for item in order_data['cart_items'])
        
        # Format order items
        items_text = ""
        for idx, item in enumerate(order_data['cart_items'], 1):
            item_total = item['price'] * item['count']
            items_text += f"{idx}. {item['good_name']} x{item['count']} - {item_total}₽\n"
        
        # Format creation timestamp
        try:
            created_at = datetime.fromisoformat(order_data['createstamp'])
            time_text = created_at.strftime("%d.%m.%Y %H:%M")
        except (ValueError, KeyError):
            time_text = "не указано"
        
        # Build notification message
        message = (
            f"🆕 <b>НОВЫЙ ЗАКАЗ #{order_data['id']}</b>\n\n"
            f"👤 <b>Клиент:</b>\n"
            f"Username: @{username}\n"
            f"Номер телефона: @{phone}\n\n"
            f"📦 <b>Товары:</b>\n"
            f"{items_text}\n"
            f"💰 <b>Итого: {total_price}₽</b>\n\n"
            f"🚚 <b>Доставка:</b> {delivery_type_text}\n"
            f"📍 <b>Адрес:</b> {order_data['delivery_address']}\n\n"
            f"🕐 <b>Время заказа:</b> {time_text}"
        )
        
        # Get bot token and create bot instance
        bot_token = os.getenv("BOT_TOKEN")
        if not bot_token:
            logger.error("BOT_TOKEN not found in environment variables")
            return False
        logger.info(f"Try sent order notification for order #{order_data['id']} to manager chat {manager_chat_id}")
        # Send notification
        bot = Bot(token=bot_token)
        try:
            await bot.send_message(
                chat_id=manager_chat_id,
                text=message,
                parse_mode="HTML"
            )
            logger.info(f"Successfully sent order notification for order #{order_data['id']} to manager chat {manager_chat_id}")
            return True
        finally:
            # Close bot session
            await bot.session.close()
            
    except Exception as e:
        logger.error(f"Failed to send order notification: {str(e)}", exc_info=True)
        return False

