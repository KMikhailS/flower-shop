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
                description TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS goods_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                good_id INTEGER NOT NULL,
                image_url TEXT NOT NULL,
                display_order INTEGER DEFAULT 0,
                FOREIGN KEY (good_id) REFERENCES goods(id) ON DELETE CASCADE
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
    description: str
) -> dict:
    """Create a new good card"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        current_time = datetime.now().isoformat()

        cursor = await db.execute(
            """INSERT INTO goods (createstamp, changestamp, status, name, category, price, description)
               VALUES (?, ?, 'NEW', ?, ?, ?, ?)""",
            (current_time, current_time, name, category, price, description)
        )
        await db.commit()

        # Get the created good card
        good_id = cursor.lastrowid
        cursor = await db.execute(
            "SELECT * FROM goods WHERE id = ?",
            (good_id,)
        )
        row = await cursor.fetchone()

        # Add empty image_urls list to match new schema
        result = dict(row)
        result['image_urls'] = []

        logger.info(f"Created new good card with id={good_id}")
        return result


async def update_good_card(
    good_id: int,
    name: str,
    category: str,
    price: int,
    description: str
) -> dict:
    """Update existing good card"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        current_time = datetime.now().isoformat()

        # Update the good
        await db.execute(
            """UPDATE goods
               SET name = ?, category = ?, price = ?, description = ?, changestamp = ?
               WHERE id = ?""",
            (name, category, price, description, current_time, good_id)
        )
        await db.commit()

        # Get the updated good with images
        cursor = await db.execute(
            """SELECT g.*, gi.image_url, gi.display_order
               FROM goods g
               LEFT JOIN goods_images gi ON g.id = gi.good_id
               WHERE g.id = ?
               ORDER BY gi.display_order ASC""",
            (good_id,)
        )
        rows = await cursor.fetchall()

        if not rows:
            logger.error(f"Good with id={good_id} not found")
            raise ValueError(f"Good with id={good_id} not found")

        # Build result with images
        first_row = rows[0]
        result = {
            'id': first_row['id'],
            'createstamp': first_row['createstamp'],
            'changestamp': first_row['changestamp'],
            'status': first_row['status'],
            'name': first_row['name'],
            'category': first_row['category'],
            'price': first_row['price'],
            'description': first_row['description'],
            'image_urls': []
        }

        # Add all image URLs
        for row in rows:
            if row['image_url']:
                result['image_urls'].append(row['image_url'])

        logger.info(f"Updated good card with id={good_id}")
        return result


async def save_good_images(good_id: int, image_urls: list[str]) -> None:
    """Save list of image URLs for a good"""
    async with aiosqlite.connect(DB_PATH) as db:
        for index, image_url in enumerate(image_urls):
            await db.execute(
                """INSERT INTO goods_images (good_id, image_url, display_order)
                   VALUES (?, ?, ?)""",
                (good_id, image_url, index)
            )
        await db.commit()
        logger.info(f"Saved {len(image_urls)} images for good_id={good_id}")


async def get_goods_by_status(status: str = 'NEW') -> list[dict]:
    """Get all goods with specified status along with their images"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # Get goods with their images via LEFT JOIN
        cursor = await db.execute(
            """SELECT g.*, gi.image_url, gi.display_order
               FROM goods g
               LEFT JOIN goods_images gi ON g.id = gi.good_id
               WHERE g.status = ?
               ORDER BY g.id DESC, gi.display_order ASC""",
            (status,)
        )
        rows = await cursor.fetchall()

        # Group images by good_id
        goods_dict = {}
        for row in rows:
            good_id = row['id']
            if good_id not in goods_dict:
                goods_dict[good_id] = {
                    'id': row['id'],
                    'createstamp': row['createstamp'],
                    'changestamp': row['changestamp'],
                    'status': row['status'],
                    'name': row['name'],
                    'category': row['category'],
                    'price': row['price'],
                    'description': row['description'],
                    'image_urls': []
                }

            # Add image_url if exists (LEFT JOIN may return NULL)
            if row['image_url']:
                goods_dict[good_id]['image_urls'].append(row['image_url'])

        result = list(goods_dict.values())
        logger.info(f"Retrieved {len(result)} goods with status={status}")
        return result


async def get_all_goods() -> list[dict]:
    """Get all goods regardless of status along with their images (for ADMIN)"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # Get all goods with their images via LEFT JOIN
        cursor = await db.execute(
            """SELECT g.*, gi.image_url, gi.display_order
               FROM goods g
               LEFT JOIN goods_images gi ON g.id = gi.good_id
               ORDER BY g.id DESC, gi.display_order ASC"""
        )
        rows = await cursor.fetchall()

        # Group images by good_id
        goods_dict = {}
        for row in rows:
            good_id = row['id']
            if good_id not in goods_dict:
                goods_dict[good_id] = {
                    'id': row['id'],
                    'createstamp': row['createstamp'],
                    'changestamp': row['changestamp'],
                    'status': row['status'],
                    'name': row['name'],
                    'category': row['category'],
                    'price': row['price'],
                    'description': row['description'],
                    'image_urls': []
                }

            # Add image_url if exists (LEFT JOIN may return NULL)
            if row['image_url']:
                goods_dict[good_id]['image_urls'].append(row['image_url'])

        result = list(goods_dict.values())
        logger.info(f"Retrieved {len(result)} goods (all statuses)")
        return result


async def delete_good(good_id: int) -> None:
    """Delete good and its images (CASCADE)"""
    async with aiosqlite.connect(DB_PATH) as db:
        # Check if good exists
        cursor = await db.execute(
            "SELECT id FROM goods WHERE id = ?",
            (good_id,)
        )
        row = await cursor.fetchone()

        if not row:
            logger.error(f"Good with id={good_id} not found")
            raise ValueError(f"Good with id={good_id} not found")

        # Delete good (images will be deleted automatically due to CASCADE)
        await db.execute(
            "DELETE FROM goods WHERE id = ?",
            (good_id,)
        )
        await db.commit()
        logger.info(f"Deleted good with id={good_id}")


async def update_good_status(good_id: int, new_status: str) -> dict:
    """Update good status (NEW or BLOCKED)"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        current_time = datetime.now().isoformat()

        # Update the status
        await db.execute(
            """UPDATE goods
               SET status = ?, changestamp = ?
               WHERE id = ?""",
            (new_status, current_time, good_id)
        )
        await db.commit()

        # Get the updated good with images
        cursor = await db.execute(
            """SELECT g.*, gi.image_url, gi.display_order
               FROM goods g
               LEFT JOIN goods_images gi ON g.id = gi.good_id
               WHERE g.id = ?
               ORDER BY gi.display_order ASC""",
            (good_id,)
        )
        rows = await cursor.fetchall()

        if not rows:
            logger.error(f"Good with id={good_id} not found")
            raise ValueError(f"Good with id={good_id} not found")

        # Build result with images
        first_row = rows[0]
        result = {
            'id': first_row['id'],
            'createstamp': first_row['createstamp'],
            'changestamp': first_row['changestamp'],
            'status': first_row['status'],
            'name': first_row['name'],
            'category': first_row['category'],
            'price': first_row['price'],
            'description': first_row['description'],
            'image_urls': []
        }

        # Add all image URLs
        for row in rows:
            if row['image_url']:
                result['image_urls'].append(row['image_url'])

        logger.info(f"Updated status for good_id={good_id} to {new_status}")
        return result
