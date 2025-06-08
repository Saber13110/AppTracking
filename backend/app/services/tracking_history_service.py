import logging
from sqlalchemy.orm import Session
from ..models.database import TrackedShipmentDB

logger = logging.getLogger(__name__)

class TrackingHistoryService:
    def __init__(self, db: Session):
        self.db = db

    def log_search(self, user_id: int, tracking_number: str) -> None:
        try:
            record = TrackedShipmentDB(user_id=user_id, tracking_number=tracking_number)
            self.db.add(record)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to log tracking search: {e}")

    def get_history(self, user_id: int):
        return (
            self.db.query(TrackedShipmentDB)
            .filter(TrackedShipmentDB.user_id == user_id)
            .order_by(TrackedShipmentDB.created_at.desc())
            .all()
        )

    def update_record(self, record_id: str, user_id: int, pinned: bool | None = None, note: str | None = None):
        record = (
            self.db.query(TrackedShipmentDB)
            .filter(TrackedShipmentDB.id == record_id, TrackedShipmentDB.user_id == user_id)
            .first()
        )
        if not record:
            return None
        if pinned is not None:
            record.pinned = pinned
        if note is not None:
            record.note = note
        self.db.commit()
        self.db.refresh(record)
        return record

    def delete_all(self, user_id: int) -> int:
        deleted = (
            self.db.query(TrackedShipmentDB)
            .filter(TrackedShipmentDB.user_id == user_id)
            .delete()
        )
        self.db.commit()
        return deleted
