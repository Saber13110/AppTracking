from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base

class TrackedShipmentDB(Base):
    __tablename__ = "tracked_shipments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    tracking_number = Column(String, index=True, nullable=False)
    searched_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("UserDB")
