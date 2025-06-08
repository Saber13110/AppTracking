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


async def _collect_stream(response):
    data = b""
    async for chunk in response.body_iterator:
        if isinstance(chunk, str):
            chunk = chunk.encode()
        data += chunk
    return data


def test_get_history_endpoint(db_session):
    """Authenticated users should receive their history records."""
    user = create_user(db_session)
    service = TrackingHistoryService(db_session)
    service.log_search(user.id, "TN1")
    service.log_search(user.id, "TN2")

    records = asyncio.run(history_router.get_history(user, db_session))
    numbers = [r.tracking_number for r in records]
    assert set(numbers) == {"TN1", "TN2"}


def test_get_history_unauthenticated(db_session):
    """Calling the endpoint without a user should fail."""
    with pytest.raises(Exception):
        asyncio.run(history_router.get_history(None, db_session))


def test_export_history_csv(db_session):
    user = create_user(db_session)
    service = TrackingHistoryService(db_session)
    service.log_search(user.id, "EX1", status="OK")
    resp = asyncio.run(history_router.export_history("csv", user, db_session))

    body = asyncio.run(_collect_stream(resp)).decode()
    assert "created_at,tracking_number,status,note,pinned" in body.splitlines()[0]
    assert resp.headers["Content-Disposition"] == "attachment; filename=history.csv"


def test_export_history_pdf(db_session):
    user = create_user(db_session)
    service = TrackingHistoryService(db_session)
    service.log_search(user.id, "EX2", status="OK")
    resp = asyncio.run(history_router.export_history("pdf", user, db_session))

    body = asyncio.run(_collect_stream(resp))
    assert body.startswith(b"%PDF")
    assert resp.headers["Content-Disposition"] == "attachment; filename=history.pdf"
