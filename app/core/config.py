from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    REDIS_URL: str = "rediss://localhost:6380/0"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/watering"
    API_KEY: str
    LOG_LEVEL: str = "INFO"
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
