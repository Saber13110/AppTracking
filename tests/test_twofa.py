import os
import sys
import asyncio
import pytest
import pyotp

# Set required env vars before importing the app modules
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
os.environ.setdefault('FEDEX_CLIENT_ID', 'dummy')
os.environ.setdefault('FEDEX_CLIENT_SECRET', 'dummy')
os.environ.setdefault('FEDEX_ACCOUNT_NUMBER', 'dummy')
os.environ.setdefault('SECRET_KEY', 'testsecret')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.database import Base, engine, SessionLocal
from backend.app.models.user import UserCreate

@pytest.fixture
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Copied from tests.test_auth to avoid external dependencies
@pytest.fixture
def patched_router(monkeypatch):
    from backend.app.routers import auth as auth_router
    from fastapi_limiter import FastAPILimiter
    import fastapi_limiter.depends as limiter_depends
    from backend.app.services import email

    async def dummy_call(self, request, response):
        return None

    monkeypatch.setattr(limiter_depends.RateLimiter, "__call__", dummy_call)
    monkeypatch.setattr(FastAPILimiter, "init", lambda *a, **k: None)
    monkeypatch.setattr(FastAPILimiter, "close", lambda *a, **k: None)

    monkeypatch.setattr(auth_router, "send_verification_email", lambda *a, **k: True)
    monkeypatch.setattr(email, "send_verification_email", lambda *a, **k: True)
    monkeypatch.setattr(auth_router, "send_password_reset_email", lambda *a, **k: True)
    monkeypatch.setattr(email, "send_password_reset_email", lambda *a, **k: True)

    return auth_router


def setup_verified_user(router, db, email="twofa@example.com"):
    user = asyncio.run(router.register(UserCreate(email=email, full_name="T", password="Password1"), db))
    asyncio.run(router.verify_email(router.EmailVerification(token=user.verification_token), db))
    return user


def test_setup_2fa_returns_secret(db_session, patched_router):
    user = setup_verified_user(patched_router, db_session)
    resp = asyncio.run(patched_router.setup_2fa(current_user=user, db=db_session))
    assert resp["secret"]
    assert resp["otpauth_url"]
    assert user.twofa_secret == resp["secret"]
    assert user.is_twofa_enabled is False


def test_verify_2fa_enables_account(db_session, patched_router):
    user = setup_verified_user(patched_router, db_session, email="verify@example.com")
    resp = asyncio.run(patched_router.setup_2fa(current_user=user, db=db_session))
    code = pyotp.TOTP(resp["secret"]).now()
    result = asyncio.run(patched_router.verify_2fa(patched_router.TwoFACode(code=code), current_user=user, db=db_session))
    assert result["message"] == "2FA enabled"
    db_session.refresh(user)
    assert user.is_twofa_enabled is True


def test_login_requires_totp_when_enabled(db_session, patched_router):
    user = setup_verified_user(patched_router, db_session, email="login@example.com")
    resp = asyncio.run(patched_router.setup_2fa(current_user=user, db=db_session))
    secret = resp["secret"]
    code = pyotp.TOTP(secret).now()
    asyncio.run(patched_router.verify_2fa(patched_router.TwoFACode(code=code), current_user=user, db=db_session))
    db_session.refresh(user)

    form = patched_router.OAuth2PasswordRequestForm(username=user.email, password="Password1", scope="")
    response = patched_router.Response()
    with pytest.raises(patched_router.HTTPException):
        asyncio.run(patched_router.login(response, form, db_session))

    form2 = patched_router.OAuth2PasswordRequestForm(username=user.email, password="Password1", scope="", totp_code=pyotp.TOTP(secret).now())
    response2 = patched_router.Response()
    token_model = asyncio.run(patched_router.login(response2, form2, db_session))
    assert token_model.access_token
