import json
import logging
import asyncpg
from redis.asyncio import Redis
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class CommandService:
    def __init__(self, redis_client: Redis, db_session: asyncpg.Connection = None):
        self.redis = redis_client
        self.db = db_session

    async def send_water_command(self, user_id: str, device_id: str, duration_sec: int) -> dict:
        if not self.db:
            raise RuntimeError("Brak połączenia z bazą danych")
            
        # Weryfikacja autoryzacji w bazie: czy device_id przypisane jest do tego user_id
        try:
            user_id_int = int(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Nieprawidłowy format user_id (oczekiwano liczby).")
            
        query = "SELECT 1 FROM devices WHERE device_id = $1 AND user_id = $2"
        record = await self.db.fetchrow(query, device_id, user_id_int)
        
        if not record:
            logger.warning(f"Odrzucono komendę: urządzenie {device_id} nie należy do usera {user_id_int}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Urządzenie nie istnieje lub nie masz do niego dostępu."
            )
            
        payload = {
            "device_id": device_id,
            "cmd": "WATER",
            "duration_sec": duration_sec
        }
        
        await self.redis.publish("commands_channel", json.dumps(payload))
        logger.info(f"Opublikowano komendę z backendu do urządzenia {device_id}: {payload}")
        
        return payload
