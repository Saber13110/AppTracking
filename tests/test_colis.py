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
from backend.app.models.database import Base as ModelsBase
from backend.app.models.colis import ColisCreate, ColisUpdate
from backend.app.services.colis_service import ColisService
from backend.app.api.v1.endpoints import colis as colis_router

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


def setup_colis(db, monkeypatch, colis_id="TESTDEL"):
    def dummy_image(self, value):
        path = os.path.join(self.barcode_folder, f"{value}.png")
        with open(path, "w") as f:
            f.write("img")
        return path
    monkeypatch.setattr(ColisService, "generate_codebar_image", dummy_image)
    service = ColisService(db)
    service.create_colis(ColisCreate(id=colis_id, description="d"))
    return service.get_colis_by_id, colis_id


def test_create_colis(db_session, monkeypatch):
    monkeypatch.setattr(ColisService, "generate_codebar_image", lambda self, v: "dummy.png")
    create = ColisCreate(id="NEWID", description="hello")
    resp = asyncio.run(colis_router.create_colis(create, db_session))
    assert resp.id == "NEWID"
    service = ColisService(db_session)
    assert service.get_colis_by_id("NEWID") is not None


def test_update_colis(db_session, monkeypatch):
    get_colis, colis_id = setup_colis(db_session, monkeypatch)
    update = ColisUpdate(description="updated")
    resp = asyncio.run(colis_router.update_colis(colis_id, update, db_session))
    assert resp.description == "updated"
    assert get_colis(colis_id).description == "updated"


def test_delete_colis_success(db_session, monkeypatch):
    get_colis, colis_id = setup_colis(db_session, monkeypatch)
    service = ColisService(db_session)
    colis = get_colis(colis_id)
    image_path = os.path.join(service.barcode_folder, f"{colis.code_barre}.png")
    assert os.path.exists(image_path)

    resp = asyncio.run(colis_router.delete_colis(colis_id, db_session))
    assert resp["success"] is True
    assert service.get_colis_by_id(colis_id) is None
    assert not os.path.exists(image_path)


def test_delete_colis_not_found(db_session):
    with pytest.raises(colis_router.HTTPException) as exc:
        asyncio.run(colis_router.delete_colis("UNKNOWN", db_session))
    assert exc.value.status_code == 404

