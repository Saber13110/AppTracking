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
from backend.app.services import auth
from backend.app.models.user import UserCreate
from backend.app.services.tracking_history_service import TrackingHistoryService
from backend.app.api.v1.endpoints import history as history_router
from fastapi.responses import StreamingResponse

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


def create_user(db):
    return auth.create_user(db, UserCreate(email='h@example.com', full_name='H', password='Password1'))


def setup_history(db, user):
    service = TrackingHistoryService(db)
    service.log_search(user.id, 'ONE')
    service.log_search(user.id, 'TWO')


def test_export_history_csv(db_session):
    user = create_user(db_session)
    setup_history(db_session, user)
    resp = asyncio.run(history_router.export_history('csv', user, db_session))
    assert isinstance(resp, StreamingResponse)
    assert resp.headers['Content-Disposition'].endswith('.csv')


def test_clear_history(db_session):
    user = create_user(db_session)
    setup_history(db_session, user)
    asyncio.run(history_router.clear_history(user, db_session))
    records = asyncio.run(history_router.get_history(user, db_session))
    assert records == []
