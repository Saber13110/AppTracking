from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base

class PasswordResetTokenDB(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime(timezone=True))
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("UserDB", backref="password_reset_tokens")
