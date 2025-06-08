import logging
from sqlalchemy.orm import Session
from ..models.tracked_shipment import TrackedShipmentDB

logger = logging.getLogger(__name__)

class TrackingHistoryService:
    def __init__(self, db: Session):
        self.db = db

    async def log_search(self, user_id: int | None, tracking_number: str) -> None:
        try:
            record = TrackedShipmentDB(user_id=user_id, tracking_number=tracking_number)
            self.db.add(record)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to log search {tracking_number}: {e}")
