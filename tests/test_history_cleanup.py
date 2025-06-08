import os
import sys
from datetime import datetime, timedelta

# Set required env vars before importing the app modules
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("FEDEX_CLIENT_ID", "dummy")
os.environ.setdefault("FEDEX_CLIENT_SECRET", "dummy")
os.environ.setdefault("FEDEX_ACCOUNT_NUMBER", "dummy")
os.environ.setdefault("SECRET_KEY", "testsecret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app.database import Base, engine, SessionLocal
from backend.app.models.database import Base as ModelsBase, TrackedShipmentDB
from backend.app.services.tracking_history_service import TrackingHistoryService

import pytest


@pytest.fixture
def db_session():
    Base.metadata.drop_all(bind=engine)
    ModelsBase.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    ModelsBase.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_purge_older_than(db_session):
    service = TrackingHistoryService(db_session)
    old = TrackedShipmentDB(
        user_id=1,
        tracking_number="old",
        created_at=datetime.utcnow() - timedelta(days=40),
    )
    new = TrackedShipmentDB(
        user_id=1,
        tracking_number="new",
        created_at=datetime.utcnow(),
    )
    db_session.add_all([old, new])
    db_session.commit()

    deleted = service.purge_older_than(30)
    assert deleted == 1
    remaining = db_session.query(TrackedShipmentDB).all()
    assert len(remaining) == 1
    assert remaining[0].tracking_number == "new"
