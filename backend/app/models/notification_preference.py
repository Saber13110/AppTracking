from sqlalchemy import Column, Integer, Boolean, ForeignKey, String, JSON
from ..database import Base

class NotificationPreferenceDB(Base):
    __tablename__ = "notification_preferences"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    email_updates = Column(Boolean, default=True)
    addresses = Column(JSON, default=list)
    preferred_language = Column(String, default="en")
    event_settings = Column(JSON, default=dict)
    default_account = Column(String, nullable=True)
