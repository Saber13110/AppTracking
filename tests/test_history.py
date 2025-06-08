import os
import sys
import asyncio
from datetime import datetime, timedelta
from io import BytesIO
import csv

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pdfminer.high_level import extract_text

# Set required env vars before importing the app modules
os.environ["DATABASE_URL"] = "sqlite:///./test.db?check_same_thread=False"
os.environ.setdefault("FEDEX_CLIENT_ID", "dummy")
os.environ.setdefault("FEDEX_CLIENT_SECRET", "dummy")
os.environ.setdefault("FEDEX_ACCOUNT_NUMBER", "dummy")
os.environ.setdefault("SECRET_KEY", "testsecret")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app.database import Base, engine, SessionLocal, get_db
from backend.app.models.database import Base as ModelsBase, TrackedShipmentDB
from backend.app.services.tracking_history_service import TrackingHistoryService
from backend.app.api.v1.endpoints import history as history_router
from backend.app.models.tracking_history import TrackedShipmentCreate, TrackedShipmentUpdate
from backend.app.services import auth
from backend.app.models.user import UserCreate

import pytest


@pytest.fixture
def db_session(monkeypatch):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    monkeypatch.setattr("backend.app.database.engine", test_engine, raising=False)
    monkeypatch.setattr("backend.app.database.SessionLocal", TestingSessionLocal, raising=False)

    Base.metadata.drop_all(bind=test_engine)
    ModelsBase.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    ModelsBase.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_user(db, email="user@example.com"):
    return auth.create_user(
        db, UserCreate(email=email, full_name="U", password="Password1")
    )


@pytest.fixture
def authenticated_user_with_history(db_session):
    """Create a user with an access token and some history records."""
    user = create_user(db_session, email="history@example.com")
    service = TrackingHistoryService(db_session)
    rec1 = service.log_search(user.id, "T1", status="S1", note="n1")
    rec2 = service.log_search(user.id, "T2", status="S2", note="n2")
    token = auth.create_access_token({"sub": user.email})
    return user, token, [rec1, rec2]


@pytest.fixture
def history_client(db_session):
    """FastAPI TestClient with dependency overrides for DB."""
    app = FastAPI()
    app.include_router(history_router.router, prefix="/history")

    from backend.app.database import SessionLocal as DBSessionLocal

    async def override_get_db():
        db = DBSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


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


def test_delete_older_than(db_session):
    service = TrackingHistoryService(db_session)
    now = datetime.utcnow()
    old = TrackedShipmentDB(
        user_id=1,
        tracking_number="old",
        created_at=now - timedelta(days=40),
    )
    new = TrackedShipmentDB(
        user_id=1,
        tracking_number="new",
        created_at=now - timedelta(days=5),
    )
    db_session.add_all([old, new])
    db_session.commit()

    deleted = service.delete_older_than(30)
    assert deleted == 1
    remaining = [r.tracking_number for r in db_session.query(TrackedShipmentDB).all()]
    assert remaining == ["new"]


def test_get_history_authenticated(history_client, authenticated_user_with_history):
    user, token, records = authenticated_user_with_history
    resp = history_client.get("/history/", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == len(records)
    returned = {d["tracking_number"] for d in data}
    assert returned == {r.tracking_number for r in records}


def test_get_history_unauthenticated(history_client):
    resp = history_client.get("/history/")
    assert resp.status_code == 401


def test_export_history_csv(history_client, authenticated_user_with_history):
    user, token, records = authenticated_user_with_history
    resp = history_client.get(
        "/history/export?format=csv", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert (
        resp.headers.get("Content-Disposition") == "attachment; filename=history.csv"
    )
    content = resp.content.decode()
    rows = list(csv.reader(content.splitlines()))
    numbers = {row[1] for row in rows[1:]}  # skip header
    assert numbers == {r.tracking_number for r in records}


def test_export_history_pdf(history_client, authenticated_user_with_history):
    user, token, records = authenticated_user_with_history
    resp = history_client.get(
        "/history/export?format=pdf", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert (
        resp.headers.get("Content-Disposition") == "attachment; filename=history.pdf"
    )
    text = extract_text(BytesIO(resp.content))
    for r in records:
        assert r.tracking_number in text
