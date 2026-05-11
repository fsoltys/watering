from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TelemetryCreate(BaseModel):
    device_id: str
    water_lvl: int
    battery_lvl: int
    moisture_lvl: int
    uptime: int

class TelemetryStatusResponse(BaseModel):
    status: str

class TelemetryPoint(BaseModel):
    time: datetime
    moisture_lvl: int
    battery_lvl: int
    water_lvl: int

class DeviceResponse(BaseModel):
    device_id: str
    name: str
    water_duration_sec: int
    created_at: datetime
    moisture_lvl: Optional[int] = None
    battery_lvl: Optional[int] = None
    water_lvl: Optional[int] = None
    last_seen: Optional[datetime] = None
