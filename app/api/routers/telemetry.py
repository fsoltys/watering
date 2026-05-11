import logging
from fastapi import APIRouter, Depends, status, HTTPException, Query
from schemas.telemetry import TelemetryCreate, TelemetryStatusResponse, TelemetryPoint, DeviceResponse
from services.telemetry_service import TelemetryService
from api.dependencies import get_telemetry_service, verify_api_key
from core.security import get_current_user_id
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.post("", response_model=TelemetryStatusResponse, status_code=status.HTTP_201_CREATED)
async def post_telemetry(
    data: TelemetryCreate,
    telemetry_service: TelemetryService = Depends(get_telemetry_service),
    api_key: str = Depends(verify_api_key)
):
    logger.info(f"Odebrano dane telemetryczne z urządzenia '{data.device_id}'")
    return await telemetry_service.save_telemetry(data)


router_user = APIRouter(prefix="", tags=["Devices"])


@router_user.get("/devices", response_model=List[DeviceResponse])
async def get_devices(
    telemetry_service: TelemetryService = Depends(get_telemetry_service),
    current_user_id: int = Depends(get_current_user_id)
):
    logger.info(f"Pobieranie listy urządzeń dla usera {current_user_id}")
    devices = await telemetry_service.get_devices_for_user(current_user_id)
    logger.info(f"Zwrócono {len(devices)} urządzeń dla usera {current_user_id}")
    return devices


@router_user.get("/telemetry/{device_id}", response_model=List[TelemetryPoint])
async def get_telemetry_history(
    device_id: str,
    range: str = Query(default="24h", pattern="^(24h|7d|30d)$"),
    telemetry_service: TelemetryService = Depends(get_telemetry_service),
    current_user_id: int = Depends(get_current_user_id)
):
    logger.info(f"Pobieranie historii telemetrii: urządzenie '{device_id}', zakres={range} (user {current_user_id})")
    try:
        data = await telemetry_service.get_telemetry_history(device_id, current_user_id, range)
        logger.info(f"Zwrócono {len(data)} rekordów telemetrii dla urządzenia '{device_id}'")
        return data
    except PermissionError:
        logger.warning(f"Odmowa dostępu do telemetrii urządzenia '{device_id}' dla usera {current_user_id}")
        raise HTTPException(status_code=403, detail="Brak dostępu do urządzenia")
