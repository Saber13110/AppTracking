from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from enum import Enum
from ..database import Base

# Modèle SQLAlchemy pour la base de données


class UserRole(str, Enum):
    admin = "admin"
    driver = "driver"
    client = "client"
    support = "support"


class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    # Nullable car les utilisateurs Google n'ont pas de mot de passe
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    # Indique si l'utilisateur s'est connecté via Google
    is_google_user = Column(Boolean, default=False)
    google_id = Column(String, nullable=True)  # ID Google de l'utilisateur
    verification_token = Column(String, nullable=True)
    verification_token_expires_at = Column(
        DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    role = Column(SQLEnum(UserRole), default=UserRole.client, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    twofa_secret = Column(String, nullable=True)
    is_twofa_enabled = Column(Boolean, default=False)

# Modèles Pydantic pour l'API


class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str):
        if (
            len(v) < 8
            or not any(c.isupper() for c in v)
            or not any(c.isdigit() for c in v)
        ):
            raise ValueError("Weak password")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: int
    is_active: bool = True
    is_verified: bool = False
    is_google_user: bool = False
    created_at: datetime
    role: UserRole = UserRole.client
    last_login_at: Optional[datetime] = None
    is_twofa_enabled: bool = False

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class EmailVerification(BaseModel):
    token: str
