import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..models.database import TrackedShipmentDB

logger = logging.getLogger(__name__)


class TrackingHistoryService:
    def __init__(self, db: Session):
        self.db = db

    def log_search(
        self,
        user_id: int,
        tracking_number: str,
        *,
        status: str | None = None,
        meta_data: dict | None = None,
        note: str | None = None,
        pinned: bool | None = False,
    ) -> TrackedShipmentDB | None:
        """Persist a search in the user's tracking history."""
        try:
            record = TrackedShipmentDB(
                user_id=user_id,
                tracking_number=tracking_number,
                status=status,
                meta_data=meta_data or {},
                note=note,
                pinned=pinned or False,
            )
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
            return record
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to log tracking search: {e}")
            return None

    def get_history(self, user_id: int):
        return (
            self.db.query(TrackedShipmentDB)
            .filter(TrackedShipmentDB.user_id == user_id)
            .order_by(TrackedShipmentDB.created_at.desc())
            .all()
        )

    def clear_history(self, user_id: int) -> int:
        """Delete all history records for the given user."""
        count = (
            self.db.query(TrackedShipmentDB)
            .filter(TrackedShipmentDB.user_id == user_id)
            .delete()
        )
        self.db.commit()
        return count

    def update_history_item(
        self,
        user_id: int,
        record_id: str,
        *,
        note: str | None = None,
        pinned: bool | None = None,
    ) -> TrackedShipmentDB | None:
        try:
            record = (
                self.db.query(TrackedShipmentDB)
                .filter(
                    TrackedShipmentDB.user_id == user_id,
                    TrackedShipmentDB.id == record_id,
                )
                .first()
            )
            if not record:
                return None
            if note is not None:
                record.note = note
            if pinned is not None:
                record.pinned = pinned
            self.db.commit()
            self.db.refresh(record)
            return record
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update history item: {e}")
            return None

    def delete_history_item(self, user_id: int, record_id: str) -> bool:
        """Delete a single history item for the given user."""
        try:
            count = (
                self.db.query(TrackedShipmentDB)
                .filter(
                    TrackedShipmentDB.user_id == user_id,
                    TrackedShipmentDB.id == record_id,
                )
                .delete()
            )
            self.db.commit()
            return count > 0
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to delete history item: {e}")
            return False

    def delete_older_than(self, days: int) -> int:
        """Remove history records older than the provided number of days."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        count = (
            self.db.query(TrackedShipmentDB)
            .filter(TrackedShipmentDB.created_at < cutoff)
            .delete()
        )
        self.db.commit()
        return count
