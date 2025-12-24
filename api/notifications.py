"""
Notifications module for sending order notifications via Telegram and email
"""
import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
        username = (user.get('username') or 'не указан') if user else 'не указан'
        phone = (user.get('phone') or 'не указан') if user else 'не указан'

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
            f"Username: {'@' + username if username != 'не указан' else 'не указан'}\n"
            f"Номер телефона: {phone}\n\n"
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


async def send_order_notification_to_email(order_data: dict) -> bool:
    """
    Send order notification via email

    Args:
        order_data: Dictionary containing order information with keys:
            - id: order ID
            - user_id: user ID who created the order
            - cart_items: list of cart items with good_name, count, price
            - delivery_type: delivery type (PICK_UP or COURIER)
            - delivery_address: delivery address
            - createstamp: order creation timestamp

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        # Get email settings from database
        email_setting = await get_setting_by_type('ORDER_EMAIL')
        password_setting = await get_setting_by_type('ORDER_EMAIL_PASSWORD')
        smtp_host_setting = await get_setting_by_type('SMTP_HOST')
        smtp_port_setting = await get_setting_by_type('SMTP_PORT')

        # Check if all required settings exist
        if not email_setting or not email_setting.get('value'):
            logger.warning("ORDER_EMAIL setting not found or empty. Skipping email notification.")
            return False

        if not password_setting or not password_setting.get('value'):
            logger.warning("ORDER_EMAIL_PASSWORD setting not found or empty. Skipping email notification.")
            return False

        if not smtp_host_setting or not smtp_host_setting.get('value'):
            logger.warning("SMTP_HOST setting not found or empty. Skipping email notification.")
            return False

        if not smtp_port_setting or not smtp_port_setting.get('value'):
            logger.warning("SMTP_PORT setting not found or empty. Skipping email notification.")
            return False

        order_email = email_setting['value']
        order_password = password_setting['value']
        smtp_host = smtp_host_setting['value']
        smtp_port = int(smtp_port_setting['value'])

        # Get user information
        user = await get_user(order_data['user_id'])
        username = (user.get('username') or 'не указан') if user else 'не указан'
        phone = (user.get('phone') or 'не указан') if user else 'не указан'

        # Format delivery type
        delivery_type_text = "Самовывоз" if order_data['delivery_type'] == 'PICK_UP' else "Курьером"

        # Calculate total price
        total_price = sum(item['price'] * item['count'] for item in order_data['cart_items'])

        # Format order items
        items_text = ""
        for idx, item in enumerate(order_data['cart_items'], 1):
            item_total = item['price'] * item['count']
            items_text += f"{idx}. {item['good_name']} x{item['count']} - {item_total} руб.\n"

        # Format creation timestamp
        try:
            created_at = datetime.fromisoformat(order_data['createstamp'])
            time_text = created_at.strftime("%d.%m.%Y %H:%M")
        except (ValueError, KeyError):
            time_text = "не указано"

        # Build email subject and body
        subject = f"Новый заказ #{order_data['id']} - FanFanTulpan"

        body = f"""
НОВЫЙ ЗАКАЗ #{order_data['id']}

КЛИЕНТ:
Username: {'@' + username if username != 'не указан' else 'не указан'}
Телефон: {phone}

ТОВАРЫ:
{items_text}
ИТОГО: {total_price} руб.

ДОСТАВКА: {delivery_type_text}
АДРЕС: {order_data['delivery_address']}

ВРЕМЯ ЗАКАЗА: {time_text}
"""

        # Create email message
        msg = MIMEMultipart()
        msg['From'] = order_email
        msg['To'] = order_email  # Send to the same email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        # Send email
        logger.info(f"Sending email notification for order #{order_data['id']} via {smtp_host}:{smtp_port}")

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(order_email, order_password)
            server.send_message(msg)

        logger.info(f"Successfully sent email notification for order #{order_data['id']}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email notification: {str(e)}", exc_info=True)
        return False

