import logging
from sqlalchemy.orm import Session
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
        nickname: str | None = None,
        favorite: bool | None = False,
    ) -> TrackedShipmentDB | None:
        """Persist a search in the user's tracking history."""
        try:
            record = TrackedShipmentDB(
                user_id=user_id,
                tracking_number=tracking_number,
                status=status,
                meta_data=meta_data or {},
                note=note,
                nickname=nickname,
                favorite=favorite or False,
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

    def update_entry(self, entry_id: str, **fields) -> TrackedShipmentDB | None:
        try:
            record = (
                self.db.query(TrackedShipmentDB)
                .filter(TrackedShipmentDB.id == entry_id)
                .first()
            )
            if not record:
                return None

            for key, value in fields.items():
                setattr(record, key, value)

            self.db.commit()
            self.db.refresh(record)
            return record
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update history entry: {e}")
            return None
