import os
import sys
import asyncio
from starlette.requests import Request
from starlette.datastructures import Headers
import pytest
from fastapi import HTTPException

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
    monkeypatch.setattr(auth_router, "send_password_reset_email", lambda *a, **k: True)
    monkeypatch.setattr(email, "send_password_reset_email", lambda *a, **k: True)

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

def test_register_verify_login_logout_flow(db_session, patched_router):
    user_data = UserCreate(email="flow@example.com", full_name="Flow", password="pw")
    user = asyncio.run(patched_router.register(user_data, db_session))
    asyncio.run(patched_router.verify_email(patched_router.EmailVerification(token=user.verification_token), db_session))

    form = patched_router.OAuth2PasswordRequestForm(username=user.email, password="pw", scope="")
    login_resp = patched_router.Response()
    asyncio.run(patched_router.login(login_resp, form, db_session))
    cookies = parse_cookies(login_resp.headers.getlist("set-cookie"))
    assert "access_token" in cookies
    assert "refresh_token" in cookies

    req = Request({"type": "http", "headers": []})
    req._cookies = cookies
    logout_resp = patched_router.Response()
    asyncio.run(patched_router.logout(req, logout_resp, db_session))
    cleared = parse_cookies(logout_resp.headers.getlist("set-cookie"))
    assert cleared.get("access_token") == ""
    assert cleared.get("refresh_token") == ""

    from backend.app.models.refresh_token import RefreshTokenDB
    token_db = db_session.query(RefreshTokenDB).filter_by(token=cookies["refresh_token"]).first()
    assert token_db.revoked is True



def test_google_callback_sets_cookies(db_session, monkeypatch):
    os.environ.setdefault('GOOGLE_CLIENT_ID', 'dummy')
    os.environ.setdefault('GOOGLE_CLIENT_SECRET', 'dummy')
    os.environ.setdefault('GOOGLE_REDIRECT_URI', 'http://localhost')

    from backend.app.routers import google_auth

    async def fake_authorize_access_token(request):
        return {"access_token": "tok", "id_token": "id"}

    async def fake_parse_id_token(request, token):
        return {"email": "g@example.com", "sub": "1", "name": "G"}

    monkeypatch.setattr(google_auth.oauth.google, "authorize_access_token", fake_authorize_access_token)
    monkeypatch.setattr(google_auth.oauth.google, "parse_id_token", fake_parse_id_token)

    req = Request({"type": "http", "headers": [], "query_string": b""})
    response = asyncio.run(google_auth.google_auth_callback(req, db_session))
    cookies = parse_cookies(response.headers.getlist("set-cookie"))
    assert cookies.get("access_token")
    assert cookies.get("refresh_token")


def test_password_reset_flow(db_session, patched_router):
    user_data = UserCreate(email="reset@example.com", full_name="Res", password="pw")
    user = asyncio.run(patched_router.register(user_data, db_session))
    asyncio.run(patched_router.verify_email(patched_router.EmailVerification(token=user.verification_token), db_session))

    resp = asyncio.run(patched_router.request_password_reset(patched_router.PasswordResetRequest(email=user.email), db_session))
    assert "reset link" in resp["message"]

    from backend.app.models.password_reset import PasswordResetTokenDB
    token_db = db_session.query(PasswordResetTokenDB).filter_by(user_id=user.id).first()
    assert token_db is not None

    asyncio.run(patched_router.reset_password(patched_router.PasswordReset(token=token_db.token, new_password="newpw"), db_session))
    db_session.refresh(user)
    assert auth.verify_password("newpw", user.hashed_password)
    assert token_db.revoked is True


def test_twofa_flow(db_session, patched_router):
    user_data = UserCreate(email="2fa@example.com", full_name="Two", password="pw")
    user = asyncio.run(patched_router.register(user_data, db_session))
    asyncio.run(patched_router.verify_email(patched_router.EmailVerification(token=user.verification_token), db_session))

    # Setup 2FA
    resp = asyncio.run(patched_router.setup_2fa(current_user=user, db=db_session))
    secret = resp["secret"]
    import pyotp
    code = pyotp.TOTP(secret).now()
    verify = asyncio.run(patched_router.verify_2fa(patched_router.TwoFACode(code=code), current_user=user, db=db_session))
    assert verify["message"] == "2FA enabled"
    db_session.refresh(user)
    assert user.is_twofa_enabled is True

    # Login requires totp
    form_fail = patched_router.OAuth2PasswordRequestForm(username=user.email, password="pw", scope="")
    resp_fail = patched_router.Response()
    with pytest.raises(HTTPException):
        asyncio.run(patched_router.login(resp_fail, form_fail, db_session))

    form_ok = patched_router.OAuth2PasswordRequestForm(username=user.email, password="pw", scope="", totp_code=pyotp.TOTP(secret).now())
    resp_ok = patched_router.Response()
    token_model = asyncio.run(patched_router.login(resp_ok, form_ok, db_session))
    assert token_model.access_token

