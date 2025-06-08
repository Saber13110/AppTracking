from sqlalchemy import Column, Integer, Boolean, ForeignKey
from ..database import Base

class NotificationPreferenceDB(Base):
    __tablename__ = "notification_preferences"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    email_updates = Column(Boolean, default=True)
