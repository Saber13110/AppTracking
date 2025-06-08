import os
import sys
import io
import asyncio
import httpx
from PIL import Image
import barcode
from barcode.writer import ImageWriter
import pytest
import types

# Set required env vars before importing the app modules
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
os.environ.setdefault('FEDEX_CLIENT_ID', 'dummy')
os.environ.setdefault('FEDEX_CLIENT_SECRET', 'dummy')
os.environ.setdefault('FEDEX_ACCOUNT_NUMBER', 'dummy')
os.environ.setdefault('SECRET_KEY', 'testsecret')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.main import app


@pytest.fixture(autouse=True)
def disable_rate_limit(monkeypatch):
    from fastapi_limiter import FastAPILimiter
    monkeypatch.setattr(FastAPILimiter, "init", lambda *a, **k: None)
    monkeypatch.setattr(FastAPILimiter, "close", lambda *a, **k: None)
    if "pyzbar" not in sys.modules:
        parent = types.ModuleType("pyzbar")
        child = types.ModuleType("pyzbar.pyzbar")
        child.decode = lambda img: []
        parent.pyzbar = child
        sys.modules["pyzbar"] = parent
        sys.modules["pyzbar.pyzbar"] = child


async def _post_image(client: httpx.AsyncClient, img_bytes: bytes):
    files = {"file": ("barcode.png", img_bytes, "image/png")}
    return await client.post("/api/v1/track/barcode/decode", files=files)


def test_decode_barcode_success(monkeypatch):
    buf = io.BytesIO()
    barcode.get('code128', '123456789012', writer=ImageWriter()).write(buf)
    buf.seek(0)
    class Dummy:
        data = b"123456789012"

    monkeypatch.setattr("pyzbar.pyzbar.decode", lambda img: [Dummy()])

    async def run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as ac:
            return await _post_image(ac, buf.getvalue())

    resp = asyncio.run(run())
    assert resp.status_code == 200
    assert resp.json().get("barcode") == "123456789012"


def test_decode_barcode_unreadable(monkeypatch):
    buf = io.BytesIO()
    Image.new('RGB', (100, 100), color='white').save(buf, format='PNG')
    buf.seek(0)

    monkeypatch.setattr("pyzbar.pyzbar.decode", lambda img: [])

    async def run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as ac:
            return await _post_image(ac, buf.getvalue())

    resp = asyncio.run(run())
    assert resp.status_code == 400

