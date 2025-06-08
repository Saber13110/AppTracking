import os
import sys
import asyncio
import pytest

# Set required env vars before importing the app modules
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
os.environ.setdefault('FEDEX_CLIENT_ID', 'dummy')
os.environ.setdefault('FEDEX_CLIENT_SECRET', 'dummy')
os.environ.setdefault('FEDEX_ACCOUNT_NUMBER', 'dummy')
os.environ.setdefault('SECRET_KEY', 'testsecret')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.database import Base, engine, SessionLocal
from backend.app.models.database import Base as ModelsBase, ColisDB
from backend.app.services.colis_service import ColisService
from backend.app.models.colis import ColisCreate
from backend.app.models.tracking import TrackingResponse
from backend.app.api.v1.endpoints import tracking as tracking_router

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


def setup_colis(db, monkeypatch, colis_id="TEST123"):
    # Avoid actual barcode generation
    monkeypatch.setattr(ColisService, "generate_codebar_image", lambda self, val: "dummy.png")
    service = ColisService(db)
    asyncio.run(service.create_colis(ColisCreate(id=colis_id, description="test")))
    return colis_id


class DummyFedExService:
    def __init__(self, *a, **k):
        pass

    async def track_package(self, tracking_number: str) -> TrackingResponse:
        return TrackingResponse(success=True, data=None, error=None, metadata={})


def test_track_package_by_id(db_session, monkeypatch):
    colis_id = setup_colis(db_session, monkeypatch)
    monkeypatch.setattr(tracking_router, "FedExService", DummyFedExService)

    resp = asyncio.run(tracking_router.track_package(colis_id, db_session))
    assert resp.success is True
    assert resp.metadata["identifier"] == colis_id
