import os
import sys
import asyncio
import json
import hmac
import hashlib
import pytest
from starlette.requests import Request

# Set required env vars before importing the app modules
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
os.environ.setdefault('FEDEX_CLIENT_ID', 'dummy')
os.environ.setdefault('FEDEX_CLIENT_SECRET', 'dummy')
os.environ.setdefault('FEDEX_ACCOUNT_NUMBER', 'dummy')
os.environ.setdefault('SECRET_KEY', 'testsecret')
os.environ.setdefault('FEDEX_WEBHOOK_SECRET', 'hooksecret')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.models.database import Base as ModelsBase
from backend.app.routers import webhook as webhook_router




def make_request(payload: bytes, signature: str | None = None) -> Request:
    headers = []
    if signature:
        headers.append((b"x-fedex-signature", signature.encode()))
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/webhook/fedex",
        "headers": headers,
        "query_string": b"",
    }

    async def receive():
        return {"type": "http.request", "body": payload, "more_body": False}

    return Request(scope, receive)


def test_webhook_valid_signature_calls_service(db_session, monkeypatch):
    monkeypatch.setattr(webhook_router.settings, "FEDEX_WEBHOOK_SECRET", "hooksecret")
    body = json.dumps({"tracking_number": "123456789012"}).encode()
    secret = os.environ["FEDEX_WEBHOOK_SECRET"]
    signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    called = {}

    class DummyService:
        def __init__(self, db):
            pass

        async def track_single_package(self, number):
            called["number"] = number

    monkeypatch.setattr(webhook_router, "TrackingService", DummyService)

    req = make_request(body, signature)
    resp = asyncio.run(webhook_router.fedex_webhook(req, db_session))
    assert resp["success"] is True
    assert called["number"] == "123456789012"


def test_webhook_invalid_signature_returns_400(db_session, monkeypatch):
    monkeypatch.setattr(webhook_router.settings, "FEDEX_WEBHOOK_SECRET", "hooksecret")
    body = json.dumps({"tracking_number": "123456789012"}).encode()
    req = make_request(body, "bad")
    with pytest.raises(webhook_router.HTTPException) as exc:
        asyncio.run(webhook_router.fedex_webhook(req, db_session))
    assert exc.value.status_code == 400


def test_webhook_no_signature_allowed(db_session, monkeypatch):
    monkeypatch.setattr(webhook_router.settings, "FEDEX_WEBHOOK_SECRET", "hooksecret")
    body = json.dumps({"tracking_number": "123456789012"}).encode()
    called = {}

    class DummyService:
        def __init__(self, db):
            pass

        async def track_single_package(self, number):
            called["number"] = number

    monkeypatch.setattr(webhook_router, "TrackingService", DummyService)

    req = make_request(body)
    resp = asyncio.run(webhook_router.fedex_webhook(req, db_session))
    assert resp["success"] is True
    assert called["number"] == "123456789012"


def test_webhook_invalid_json_returns_400(db_session, monkeypatch):
    monkeypatch.setattr(webhook_router.settings, "FEDEX_WEBHOOK_SECRET", "hooksecret")
    body = b"{bad json"
    secret = os.environ["FEDEX_WEBHOOK_SECRET"]
    signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    req = make_request(body, signature)
    with pytest.raises(webhook_router.HTTPException) as exc:
        asyncio.run(webhook_router.fedex_webhook(req, db_session))
    assert exc.value.status_code == 400
