import sys
import os

# Allow running as module from project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.config import settings
from app.database import SessionLocal
from app.services.tracking_history_service import TrackingHistoryService


def cleanup_history() -> int:
    """Remove history records older than the configured retention period."""
    with SessionLocal() as db:
        service = TrackingHistoryService(db)
        deleted = service.purge_older_than(settings.TRACKING_HISTORY_RETENTION_DAYS)
        return deleted


if __name__ == "__main__":
    removed = cleanup_history()
    print(
        f"Deleted {removed} tracked shipments older than {settings.TRACKING_HISTORY_RETENTION_DAYS} days"
    )
