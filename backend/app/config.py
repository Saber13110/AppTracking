try:
    from pydantic_settings import BaseSettings
except ImportError:  # Fallback for environments without pydantic-settings
    from pydantic import BaseSettings
from functools import lru_cache
from typing import Optional, List
import os


class Settings(BaseSettings):
    # Configuration de l'API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Tracking App"

    # Configuration du serveur
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Configuration CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:4200"]
    FRONTEND_URL: str = "http://localhost:4200"

    # Configuration de la base de données
    DATABASE_URL: str = os.environ.get(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost/tracking_app")
    REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

    # Security
    SECRET_KEY: Optional[str] = os.environ.get("SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError(
            "SECRET_KEY must be set (see README: Environment Variables)"
        )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth2 Configuration
    GOOGLE_CLIENT_ID: Optional[str] = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.environ.get(
        "GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: Optional[str] = os.environ.get("GOOGLE_REDIRECT_URI")

    # Email Configuration
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = os.environ.get(
        "SMTP_USERNAME", "")  # Votre adresse Gmail
    # Votre mot de passe d'application Gmail
    SMTP_PASSWORD: str = os.environ.get("SMTP_PASSWORD", "")

    # TrackingMore API
    TRACKINGMORE_API_KEY: Optional[str] = None

    # FedEx settings
    FEDEX_CLIENT_ID: str
    FEDEX_CLIENT_SECRET: str
    FEDEX_ACCOUNT_NUMBER: str
    FEDEX_WEBHOOK_SECRET: str | None = os.environ.get("FEDEX_WEBHOOK_SECRET")

    # How long to retain tracking history in days
    HISTORY_RETENTION_DAYS: int = int(
        os.environ.get("HISTORY_RETENTION_DAYS", 30))

    class Config:
        case_sensitive = True
        # Load environment variables from `.env.local` by default so local
        # credentials don't need to be exported in the shell.
        env_file = ".env.local"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
