import aiosqlite
import logging
import os
import stat
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# Use /app/data for Docker volume, fallback to current directory for local dev
if os.path.exists("/app/data"):
    DB_PATH = "/app/data/flower_shop.db"
    logger.info(f"Using Docker volume path for database: {DB_PATH}")
else:
    DB_PATH = "flower_shop.db"
    logger.info(f"Using local path for database: {DB_PATH}")

# Ensure directory exists and has write permissions
db_dir = os.path.dirname(os.path.abspath(DB_PATH))
try:
    os.makedirs(db_dir, exist_ok=True)
    # Make sure directory is writable
    os.chmod(db_dir, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
    logger.info(f"Database directory: {db_dir}")
    logger.info(f"Directory exists: {os.path.exists(db_dir)}")
    logger.info(f"Directory writable: {os.access(db_dir, os.W_OK)}")
except Exception as e:
    logger.error(f"Failed to prepare database directory: {e}")


async def init_db():
    """Initialize database and create tables if they don't exist"""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_info (
                id INTEGER PRIMARY KEY,
                status TEXT DEFAULT 'NEW',
                createstamp TIMESTAMP,
                changestamp TIMESTAMP,
                role TEXT DEFAULT 'USER',
                mode TEXT DEFAULT 'USER'
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS goods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                createstamp TIMESTAMP,
                changestamp TIMESTAMP,
                status TEXT DEFAULT 'NEW',
                name TEXT NOT NULL,
                category TEXT,
                price INTEGER NOT NULL,
                description TEXT,
                image_url TEXT
            )
        """)
        await db.commit()
        logger.info("Database initialized successfully")


async def add_or_update_user(user_id: int) -> None:
    """Add new user or update existing user's changestamp"""
    async with aiosqlite.connect(DB_PATH) as db:
        current_time = datetime.now().isoformat()

        cursor = await db.execute(
            "SELECT id FROM user_info WHERE id = ?",
            (user_id,)
        )
        user = await cursor.fetchone()

        if user:
            await db.execute(
                "UPDATE user_info SET changestamp = ? WHERE id = ?",
                (current_time, user_id)
            )
            logger.info(f"Updated user {user_id}")
        else:
            await db.execute(
                """INSERT INTO user_info (id, status, createstamp, changestamp, role, mode)
                   VALUES (?, 'NEW', ?, ?, 'USER', 'USER')""",
                (user_id, current_time, current_time)
            )
            logger.info(f"Created new user {user_id}")

        await db.commit()


async def get_user(user_id: int) -> Optional[dict]:
    """Get user information by user_id"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM user_info WHERE id = ?",
            (user_id,)
        )
        row = await cursor.fetchone()

        if row:
            return dict(row)
        return None


async def update_user_mode(user_id: int, mode: str) -> None:
    """Update user mode (ADMIN or USER)"""
    async with aiosqlite.connect(DB_PATH) as db:
        current_time = datetime.now().isoformat()
        await db.execute(
            "UPDATE user_info SET mode = ?, changestamp = ? WHERE id = ?",
            (mode, current_time, user_id)
        )
        await db.commit()
        logger.info(f"Updated mode for user {user_id} to {mode}")


async def create_good_card(
    name: str,
    category: str,
    price: int,
    description: str,
    image_url: Optional[str] = None
) -> dict:
    """Create a new good card"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        current_time = datetime.now().isoformat()

        cursor = await db.execute(
            """INSERT INTO goods (createstamp, changestamp, status, name, category, price, description, image_url)
               VALUES (?, ?, 'NEW', ?, ?, ?, ?, ?)""",
            (current_time, current_time, name, category, price, description, image_url)
        )
        await db.commit()

        # Get the created good card
        good_id = cursor.lastrowid
        cursor = await db.execute(
            "SELECT * FROM goods WHERE id = ?",
            (good_id,)
        )
        row = await cursor.fetchone()

        logger.info(f"Created new good card with id={good_id}")
        return dict(row)
