import os
import sys
import asyncio
import pytest
from starlette.requests import Request

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


def setup_colis(db, monkeypatch, colis_id="123456789012"):
    # Avoid actual barcode generation
    monkeypatch.setattr(ColisService, "generate_codebar_image", lambda self, val: "dummy.png")
    service = ColisService(db)
    service.create_colis(ColisCreate(id=colis_id, description="test"))
    return colis_id


class DummyFedExService:
    def __init__(self, *a, **k):
        pass

    async def track_package(self, tracking_number: str) -> TrackingResponse:
        return TrackingResponse(success=True, data=None, error=None, metadata={})


def test_track_package_by_id(db_session, monkeypatch):
    colis_id = setup_colis(db_session, monkeypatch)
    monkeypatch.setattr(tracking_router, "FedExService", DummyFedExService)

    scope = {
        "type": "http",
        "headers": [],
        "query_string": b"",
        "path": "/",
        "scheme": "http",
        "server": ("testserver", 80),
    }
    req = Request(scope)
    resp = asyncio.run(tracking_router.track_package(colis_id, req, db_session))
    assert resp.success is True
    assert resp.metadata["identifier"] == colis_id


def test_update_tracking(db_session, monkeypatch):
    colis_id = setup_colis(db_session, monkeypatch)
    import backend.app.services.tracking_service as ts_mod
    monkeypatch.setattr(ts_mod, "FedExService", DummyFedExService)

    update_req = tracking_router.UpdateTrackingRequest(customer_name="Bob", note="hi")
    resp = asyncio.run(
        tracking_router.update_tracking(colis_id, update_req, db_session)
    )
    assert resp.success is True


def test_get_proof_of_delivery_success(db_session, monkeypatch):
    colis_id = setup_colis(db_session, monkeypatch)
    sample_pdf = b"%PDF-1.4 test"

    async def dummy_get_pod(self, tracking_number: str):
        assert tracking_number == colis_id
        return sample_pdf

    monkeypatch.setattr(tracking_router.FedExService, "get_proof_of_delivery", dummy_get_pod)

    resp = asyncio.run(tracking_router.get_proof_of_delivery(colis_id, db_session))

    assert resp.status_code == 200
    assert resp.headers["Content-Disposition"] == f"attachment; filename=proof_{colis_id}.pdf"

    async def collect(response):
        data = b""
        async for chunk in response.body_iterator:
            data += chunk
        return data

    content = asyncio.run(collect(resp))
    assert content == sample_pdf


def test_get_proof_of_delivery_not_found(db_session, monkeypatch):
    colis_id = setup_colis(db_session, monkeypatch)

    async def dummy_not_found(self, tracking_number: str):
        raise FileNotFoundError()

    monkeypatch.setattr(tracking_router.FedExService, "get_proof_of_delivery", dummy_not_found)

    with pytest.raises(tracking_router.HTTPException) as exc:
        asyncio.run(tracking_router.get_proof_of_delivery(colis_id, db_session))

    assert exc.value.status_code == 404
