import os
import sys
import asyncio
from starlette.requests import Request
from starlette.datastructures import Headers
import pytest

# Set required env vars before importing the app modules
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
os.environ.setdefault('FEDEX_CLIENT_ID', 'dummy')
os.environ.setdefault('FEDEX_CLIENT_SECRET', 'dummy')
os.environ.setdefault('FEDEX_ACCOUNT_NUMBER', 'dummy')
os.environ.setdefault('SECRET_KEY', 'testsecret')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.database import Base, engine, SessionLocal
from backend.app.models.user import UserCreate
from backend.app.services import auth

@pytest.fixture
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def setup_user(db):
    return auth.create_user(db, UserCreate(email='u@example.com', full_name='U', password='pw'))

async def call_get_current_user(request, db, token=None):
    return await auth.get_current_user(request=request, db=db, token=token)

def test_get_current_user_from_header(db_session):
    user = setup_user(db_session)
    token = auth.create_access_token({'sub': user.email})
    headers = Headers({'authorization': f'Bearer {token}'})
    request = Request({'type': 'http', 'headers': headers.raw})
    fetched = asyncio.run(call_get_current_user(request, db_session, token))
    assert fetched.email == user.email

def test_get_current_user_from_cookie(db_session):
    user = setup_user(db_session)
    token = auth.create_access_token({'sub': user.email})
    headers = Headers({'cookie': f'access_token={token}'})
    request = Request({'type': 'http', 'headers': headers.raw})
    fetched = asyncio.run(call_get_current_user(request, db_session, None))
    assert fetched.email == user.email
