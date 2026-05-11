import logging
from datetime import datetime, timezone, timedelta
import asyncpg
from schemas.telemetry import TelemetryCreate

logger = logging.getLogger(__name__)

RANGE_MAP = {
    "24h": timedelta(hours=24),
    "7d":  timedelta(days=7),
    "30d": timedelta(days=30),
}

class TelemetryService:
    def __init__(self, db_session: asyncpg.Connection = None):
        self.db = db_session

    async def save_telemetry(self, telemetry: TelemetryCreate) -> dict:
        if not self.db:
            raise RuntimeError("Brak połączenia z bazą danych")
            
        current_time = datetime.now(timezone.utc)
        
        query = """
            INSERT INTO telemetry (time, device_id, water_lvl, battery_lvl, moisture_lvl, uptime)
            VALUES ($1, $2, $3, $4, $5, $6)
        """
        
        try:
            await self.db.execute(
                query,
                current_time,
                telemetry.device_id,
                telemetry.water_lvl,
                telemetry.battery_lvl,
                telemetry.moisture_lvl,
                telemetry.uptime
            )
            logger.info(f"Zapisano telemetrię z urządzenia {telemetry.device_id} do TimescaleDB.")
        except asyncpg.exceptions.ForeignKeyViolationError:
            logger.warning(f"Odrzucono telemetrię: urządzenie {telemetry.device_id} nie istnieje w bazie.")
            raise ValueError(f"Urządzenie o ID {telemetry.device_id} nie jest zarejestrowane.")
        except Exception as e:
            logger.error(f"Błąd DB podczas zapisu telemetrii: {e}")
            raise e

        return {"status": "ok"}

    async def get_devices_for_user(self, user_id: int) -> list[dict]:
        """Returns devices owned by user, enriched with the latest telemetry reading."""
        query = """
            SELECT
                d.device_id,
                d.name,
                d.water_duration_sec,
                d.created_at,
                t.moisture_lvl,
                t.battery_lvl,
                t.water_lvl,
                t.time AS last_seen
            FROM devices d
            LEFT JOIN LATERAL (
                SELECT moisture_lvl, battery_lvl, water_lvl, time
                FROM telemetry
                WHERE device_id = d.device_id
                ORDER BY time DESC
                LIMIT 1
            ) t ON true
            WHERE d.user_id = $1
            ORDER BY d.created_at DESC
        """
        rows = await self.db.fetch(query, user_id)
        return [dict(r) for r in rows]

    async def get_telemetry_history(self, device_id: str, user_id: int, range_key: str) -> list[dict]:
        """Returns time-series telemetry for one device, scoped to the authenticated user."""
        delta = RANGE_MAP.get(range_key, timedelta(hours=24))
        since = datetime.now(timezone.utc) - delta

        ownership = await self.db.fetchval(
            "SELECT 1 FROM devices WHERE device_id = $1 AND user_id = $2",
            device_id, user_id
        )
        if not ownership:
            raise PermissionError("Brak dostępu do urządzenia")

        query = """
            SELECT time, moisture_lvl, battery_lvl, water_lvl
            FROM telemetry
            WHERE device_id = $1 AND time >= $2
            ORDER BY time ASC
        """
        rows = await self.db.fetch(query, device_id, since)
        return [dict(r) for r in rows]

