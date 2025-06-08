import os
import sys
import asyncio

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
from backend.app.api.v1.endpoints import history as history_router
from backend.app.models.tracking_history import TrackedShipmentCreate, TrackedShipmentUpdate
from backend.app.services import auth
from backend.app.models.user import UserCreate

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


def create_user(db, email="user@example.com"):
    return auth.create_user(
        db, UserCreate(email=email, full_name="U", password="Password1")
    )


def test_log_search_stores_fields(db_session):
    service = TrackingHistoryService(db_session)
    service.log_search(1, "123", status="IN_TRANSIT", meta_data={"a": 1}, note="n")

    record = db_session.query(TrackedShipmentDB).first()
    assert record.tracking_number == "123"
    assert record.status == "IN_TRANSIT"
    assert record.meta_data["a"] == 1
    assert record.note == "n"


def test_post_history_endpoint(db_session):
    user = create_user(db_session)
    payload = TrackedShipmentCreate(tracking_number="ABC", status="OK")
    result = asyncio.run(history_router.add_history(payload, user, db_session))
    assert result.tracking_number == "ABC"
    assert result.status == "OK"


def test_delete_history_endpoint(db_session):
    user = create_user(db_session)
    service = TrackingHistoryService(db_session)
    service.log_search(user.id, "1")
    service.log_search(user.id, "2")

    asyncio.run(history_router.delete_history(user, db_session))
    remaining = service.get_history(user.id)
    assert remaining == []


def test_delete_single_history_item(db_session):
    user = create_user(db_session)
    service = TrackingHistoryService(db_session)
    rec1 = service.log_search(user.id, "1")
    service.log_search(user.id, "2")

    asyncio.run(history_router.delete_history_item(rec1.id, user, db_session))
    remaining = [r.tracking_number for r in service.get_history(user.id)]
    assert remaining == ["2"]


def test_update_history_endpoint(db_session):
    user = create_user(db_session)
    payload = TrackedShipmentCreate(tracking_number="UPD", status="X")
    created = asyncio.run(history_router.add_history(payload, user, db_session))

    update = TrackedShipmentUpdate(note="new note", pinned=True)
    updated = asyncio.run(
        history_router.update_history(created.id, update, user, db_session)
    )

    assert updated.note == "new note"
    assert updated.pinned is True
