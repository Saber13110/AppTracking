import logging
from ..database import SessionLocal
from ..services.tracking_history_service import TrackingHistoryService
from ..config import settings

logger = logging.getLogger(__name__)


def cleanup_tracked_shipments() -> None:
    """Remove TrackedShipment records older than the retention period."""
    db = SessionLocal()
    try:
        service = TrackingHistoryService(db)
        deleted = service.delete_older_than(settings.HISTORY_RETENTION_DAYS)
        if deleted:
            logger.info(
                "Deleted %s tracked shipment records older than %s days",
                deleted,
                settings.HISTORY_RETENTION_DAYS,
            )
    finally:
        db.close()
