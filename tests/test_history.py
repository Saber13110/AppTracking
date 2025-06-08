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
from backend.app.models.tracking_history import TrackedShipmentCreate
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


def test_export_history_csv(db_session):
    user = create_user(db_session)
    service = TrackingHistoryService(db_session)
    service.log_search(user.id, "999", status="DELIVERED", meta_data={
        "weight": "1kg",
        "dimensions": "10x10x10",
        "service_type": "GROUND",
        "sender": "A",
        "recipient": "B",
    })

    resp = asyncio.run(history_router.export_history("csv", None, None, user, db_session))

    async def consume(sr):
        data = b""
        async for chunk in sr.body_iterator:
            data += chunk
        return data

    body = asyncio.run(consume(resp))
    assert b"tracking_number" in body
