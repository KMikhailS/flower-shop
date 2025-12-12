import aiosqlite
import logging
# import os
# import stat
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


DB_PATH = "/app/data/flower_shop.db"

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


async def get_goods_by_status(status: str = 'NEW') -> list[dict]:
    """Get all goods with specified status"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM goods WHERE status = ? ORDER BY id DESC",
            (status,)
        )
        rows = await cursor.fetchall()

        logger.info(f"Retrieved {len(rows)} goods with status={status}")
        return [dict(row) for row in rows]
