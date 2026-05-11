import logging
from core.config import settings

class AccessLogToDebugFilter(logging.Filter):
    """Zmienia poziom logów uvicorn.access z INFO na DEBUG"""
    def filter(self, record):
        if record.levelno == logging.INFO:
            record.levelno = logging.DEBUG
            record.levelname = "DEBUG"
        return True

def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    log_format = "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        force=True 
    )
    
    for logger_name in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        logger = logging.getLogger(logger_name)
        logger.handlers.clear()
        logger.propagate = True
        
        if logger_name == "uvicorn.access":
            logger.addFilter(AccessLogToDebugFilter())
    
    logger = logging.getLogger(__name__)
    logger.info(f"System logowania zainicjowany. Aktualny poziom: {settings.LOG_LEVEL.upper()}")
