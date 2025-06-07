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


def parse_cookies(header_list):
    from http.cookies import SimpleCookie
    jar = SimpleCookie()
    for header in header_list:
        if header:
            jar.load(header)
    return {k: v.value for k, v in jar.items()}


@pytest.fixture
def patched_router(monkeypatch):
    from backend.app.routers import auth as auth_router
    from fastapi_limiter import FastAPILimiter
    import fastapi_limiter.depends as limiter_depends
    from backend.app.services import email

    # Disable rate limiting and redis usage
    async def dummy_call(self, request, response):
        return None

    monkeypatch.setattr(limiter_depends.RateLimiter, "__call__", dummy_call)
    monkeypatch.setattr(FastAPILimiter, "init", lambda *a, **k: None)
    monkeypatch.setattr(FastAPILimiter, "close", lambda *a, **k: None)

    # Prevent real emails from being sent
    monkeypatch.setattr(auth_router, "send_verification_email", lambda *a, **k: True)
    monkeypatch.setattr(email, "send_verification_email", lambda *a, **k: True)

    return auth_router


def test_register_and_verify_email(db_session, patched_router):
    user_data = UserCreate(email="new@example.com", full_name="New", password="pw")
    user = asyncio.run(patched_router.register(user_data, db_session))
    assert user.email == "new@example.com"
    assert user.is_verified is False

    token = user.verification_token
    result = asyncio.run(patched_router.verify_email(
        patched_router.EmailVerification(token=token), db_session
    ))
    assert result["message"] == "Email verified successfully"
    db_session.refresh(user)
    assert user.is_verified is True
    assert user.verification_token is None


def test_login_returns_tokens(db_session, patched_router):
    user_data = UserCreate(email="login@example.com", full_name="Login", password="pw")
    user = asyncio.run(patched_router.register(user_data, db_session))
    asyncio.run(patched_router.verify_email(patched_router.EmailVerification(token=user.verification_token), db_session))

    form = patched_router.OAuth2PasswordRequestForm(username=user.email, password="pw", scope="")
    response = patched_router.Response()
    token_model = asyncio.run(patched_router.login(response, form, db_session))

    cookies = parse_cookies(response.headers.getlist("set-cookie"))
    assert token_model.access_token
    assert "access_token" in cookies
    assert "refresh_token" in cookies


def test_refresh_token_flow(db_session, patched_router):
    user_data = UserCreate(email="ref@example.com", full_name="Ref", password="pw")
    user = asyncio.run(patched_router.register(user_data, db_session))
    asyncio.run(patched_router.verify_email(patched_router.EmailVerification(token=user.verification_token), db_session))

    form = patched_router.OAuth2PasswordRequestForm(username=user.email, password="pw", scope="")
    login_response = patched_router.Response()
    asyncio.run(patched_router.login(login_response, form, db_session))
    old_cookies = parse_cookies(login_response.headers.getlist("set-cookie"))

    req = Request({"type": "http", "headers": []})
    req._cookies = old_cookies
    refresh_response = patched_router.Response()
    asyncio.run(patched_router.refresh_token(req, refresh_response, db_session))
    new_cookies = parse_cookies(refresh_response.headers.getlist("set-cookie"))

    assert new_cookies.get("refresh_token") != old_cookies.get("refresh_token")
    assert "access_token" in new_cookies

    from backend.app.models.refresh_token import RefreshTokenDB
    tokens = {t.token: t.revoked for t in db_session.query(RefreshTokenDB).all()}
    assert tokens[old_cookies["refresh_token"]] is True
    assert tokens[new_cookies["refresh_token"]] is False


def test_logout_revokes_refresh(db_session, patched_router):
    user_data = UserCreate(email="out@example.com", full_name="Out", password="pw")
    user = asyncio.run(patched_router.register(user_data, db_session))
    asyncio.run(patched_router.verify_email(patched_router.EmailVerification(token=user.verification_token), db_session))

    form = patched_router.OAuth2PasswordRequestForm(username=user.email, password="pw", scope="")
    login_response = patched_router.Response()
    asyncio.run(patched_router.login(login_response, form, db_session))
    cookies = parse_cookies(login_response.headers.getlist("set-cookie"))

    req = Request({"type": "http", "headers": []})
    req._cookies = cookies
    logout_response = patched_router.Response()
    asyncio.run(patched_router.logout(req, logout_response, db_session))
    cleared = parse_cookies(logout_response.headers.getlist("set-cookie"))

    from backend.app.models.refresh_token import RefreshTokenDB
    token_db = db_session.query(RefreshTokenDB).filter_by(token=cookies["refresh_token"]).first()
    assert token_db.revoked is True
    assert cleared.get("refresh_token") == ""
    assert cleared.get("access_token") == ""
