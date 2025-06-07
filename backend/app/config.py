from pydantic_settings import BaseSettings
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
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost/tracking_app")
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"  # Change this in production!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Google OAuth2 Configuration

    
    # Email Configuration
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""  # Votre adresse Gmail
    SMTP_PASSWORD: str = ""  # Votre mot de passe d'application Gmail
    
    # TrackingMore API
    TRACKINGMORE_API_KEY: Optional[str] = None
    
    # FedEx settings
    FEDEX_CLIENT_ID: str
    FEDEX_CLIENT_SECRET: str
    FEDEX_ACCOUNT_NUMBER: str
    
    class Config:
        case_sensitive = True
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings() 