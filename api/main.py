import asyncio
import logging
import os
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Bot token from environment
BOT_TOKEN = os.getenv("BOT_TOKEN")

# Create bot and dispatcher
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(Command("start"))
async def start_handler(message: types.Message):
    """Handle /start command - show Mini App button"""

    # Create inline keyboard with Mini App button
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🌸 Открыть магазин",
                    web_app=WebAppInfo(url="https://cadra.online/")
                )
            ]
        ]
    )

    await message.answer(
        text="Добро пожаловать в FanFanTulpan! 🌷\n\nНажмите кнопку ниже, чтобы открыть наш магазин цветов.",
        reply_markup=keyboard
    )


async def main():
    """Start the bot"""
    logger.info("Starting bot...")

    # Delete webhook to use polling
    await bot.delete_webhook(drop_pending_updates=True)

    # Start polling
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
