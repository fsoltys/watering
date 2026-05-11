import logging
from core.database import db_manager
from schemas.user import UserCreate
from core.security import get_password_hash

logger = logging.getLogger(__name__)

class UserService:
    async def get_user_by_email(self, email: str):
        query = "SELECT * FROM users WHERE email = $1"
        try:
            async with db_manager.pool.acquire() as conn:
                user = await conn.fetchrow(query, email)
                return dict(user) if user else None
        except Exception as e:
            logger.error(f"Error fetching user by email: {e}")
            raise e

    async def get_user_by_id(self, user_id: int):
        query = "SELECT * FROM users WHERE id = $1"
        try:
            async with db_manager.pool.acquire() as conn:
                user = await conn.fetchrow(query, user_id)
                return dict(user) if user else None
        except Exception as e:
            logger.error(f"Error fetching user by id: {e}")
            raise e

    async def create_user(self, user_in: UserCreate):
        query = """
            INSERT INTO users (email, password_hash)
            VALUES ($1, $2)
            RETURNING id, email, created_at
        """
        try:
            async with db_manager.pool.acquire() as conn:
                hashed_password = get_password_hash(user_in.password)
                new_user = await conn.fetchrow(query, user_in.email, hashed_password)
                return dict(new_user) if new_user else None
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise e

# Helper for dependency injection
def get_user_service() -> UserService:
    return UserService()
