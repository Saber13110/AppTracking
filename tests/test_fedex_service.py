import os
import sys
import asyncio
import httpx
from datetime import datetime, timedelta
import pytest

# Ensure env vars so FedExService loads config without errors
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
os.environ.setdefault('FEDEX_CLIENT_ID', 'dummy')
os.environ.setdefault('FEDEX_CLIENT_SECRET', 'dummy')
os.environ.setdefault('FEDEX_ACCOUNT_NUMBER', 'dummy')
os.environ.setdefault('FEDEX_AUTH_URL', 'https://auth.example.com')
os.environ.setdefault('FEDEX_BASE_URL', 'https://api.example.com')
os.environ.setdefault('SECRET_KEY', 'testsecret')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.services.fedex_service import FedExService
import backend.app.services.fedex_service as fs


class FakeRedis:
    """Simple in-memory stand-in for redis.Redis used in tests."""

    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ex=None):
        self.store[key] = value


def test_track_package_success(monkeypatch):
    service = FedExService()

    sample_data = {
        "output": {
            "completeTrackResults": [
                {
                    "trackResults": [
                        {
                            "trackingNumberInfo": {
                                "trackingNumber": "123",
                                "trackingNumberUniqueId": "abc",
                            },
                            "latestStatusDetail": {"code": "IN_TRANSIT"},
                            "serviceDetail": {"type": "GROUND", "description": "FedEx Ground"},
                            "shipperInformation": {
                                "address": {
                                    "city": "OrigCity",
                                    "stateOrProvinceCode": "OS",
                                    "countryCode": "US",
                                    "postalCode": "12345",
                                }
                            },
                            "recipientInformation": {
                                "address": {
                                    "city": "DestCity",
                                    "stateOrProvinceCode": "DS",
                                    "countryCode": "US",
                                    "postalCode": "67890",
                                }
                            },
                            "packageDetails": {
                                "count": 1,
                                "packagingDescription": {"description": "BOX"},
                                "weightAndDimensions": {
                                    "weight": [{"unit": "KG", "value": 2}],
                                    "dimensions": [{
                                        "units": "CM",
                                        "length": 10,
                                        "width": 20,
                                        "height": 30,
                                    }],
                                },
                            },
                            "deliveryDetails": {
                                "deliveryAttempts": 1,
                                "actualDeliveryAddress": {
                                    "city": "DestCity",
                                    "stateOrProvinceCode": "DS",
                                    "countryCode": "US",
                                    "postalCode": "67890",
                                },
                                "receivedByName": "John",
                                "deliveryOptionEligibilityDetails": [],
                            },
                            "scanEvents": [
                                {
                                    "eventType": "DELIVERED",
                                    "eventDescription": "Delivered",
                                    "date": "2021-01-02T10:00:00Z",
                                    "scanLocation": {
                                        "city": "DestCity",
                                        "stateOrProvinceCode": "DS",
                                        "countryCode": "US",
                                        "postalCode": "67890",
                                    },
                                }
                            ],
                            "dateAndTimes": [
                                {"type": "ACTUAL_DELIVERY", "dateTime": "2021-01-02T10:00:00Z"},
                                {"type": "SHIP", "dateTime": "2021-01-01T08:00:00Z"},
                            ],
                            "additionalTrackingInfo": {
                                "packageIdentifiers": [{"type": "FOO", "values": ["VAL"]}]
                            },
                            "availableNotifications": ["EMAIL"],
                        }
                    ]
                }
            ]
        }
    }

    async def dummy_token(self):
        return "token"

    monkeypatch.setattr(FedExService, "_get_auth_token", dummy_token)

    def handler(request: httpx.Request):
        response = httpx.Response(200, json=sample_data, request=request)
        response.read()
        response._elapsed = timedelta(seconds=0)
        return response

    transport = httpx.MockTransport(handler)
    original_client = httpx.AsyncClient

    class PatchedAsyncClient(original_client):
        def __init__(self, *a, **kw):
            super().__init__(*a, transport=transport, **kw)

    monkeypatch.setattr(httpx, "AsyncClient", PatchedAsyncClient)

    resp = asyncio.run(service.track_package("123"))

    assert resp.success is True
    assert resp.data.tracking_number == "123"
    assert resp.data.status == "IN_TRANSIT"
    assert resp.data.origin.city == "OrigCity"
    assert resp.data.destination.postal_code == "67890"
    assert resp.data.delivery_details.delivery_attempts == 1
    assert resp.data.key_dates.actual_delivery == "2021-01-02T10:00:00Z"


def test_track_package_http_error(monkeypatch):
    service = FedExService()

    async def dummy_token(self):
        return "token"

    monkeypatch.setattr(FedExService, "_get_auth_token", dummy_token)

    def handler(request: httpx.Request):
        response = httpx.Response(500, json={"error": "server"}, request=request)
        response.read()
        response._elapsed = timedelta(seconds=0)
        return response

    transport = httpx.MockTransport(handler)
    original_client = httpx.AsyncClient

    class PatchedAsyncClient(original_client):
        def __init__(self, *a, **kw):
            super().__init__(*a, transport=transport, **kw)

    monkeypatch.setattr(httpx, "AsyncClient", PatchedAsyncClient)

    resp = asyncio.run(service.track_package("123"))

    assert resp.success is False
    assert "FedEx API returned an error" in resp.error


def test_token_cached_between_instances(monkeypatch):
    fs._redis_client = FakeRedis()

    call_count = 0

    class DummyClient:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            pass

        def post(self, url, data=None, headers=None):
            nonlocal call_count
            call_count += 1
            request = httpx.Request("POST", url)
            return httpx.Response(200, json={"access_token": "abc", "expires_in": 3600}, request=request)

    monkeypatch.setattr(httpx, "Client", lambda: DummyClient())

    service1 = FedExService()
    token1 = service1._get_auth_token()
    service2 = FedExService()
    token2 = service2._get_auth_token()

    assert token1 == "abc" and token2 == "abc"
    assert call_count == 1


def test_single_authentication_with_concurrency(monkeypatch):
    """Ensure only one authentication occurs when instances run in parallel."""
    fs._redis_client = FakeRedis()

    call_count = 0

    class DummyClient:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            pass

        def post(self, url, data=None, headers=None):
            nonlocal call_count
            call_count += 1
            request = httpx.Request("POST", url)
            return httpx.Response(200, json={"access_token": "abc", "expires_in": 3600}, request=request)

    monkeypatch.setattr(httpx, "Client", lambda: DummyClient())

    service1 = FedExService()
    service2 = FedExService()

    from concurrent.futures import ThreadPoolExecutor

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(lambda s: s._get_auth_token(), [service1, service2]))

    assert results[0] == results[1] == "abc"
    assert call_count == 1


def test_token_refresh_after_expiry(monkeypatch):
    fs._redis_client = FakeRedis()

    tokens = ["t1", "t2"]

    class DummyClient:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            pass

        def post(self, url, data=None, headers=None):
            token = tokens.pop(0)
            request = httpx.Request("POST", url)
            return httpx.Response(200, json={"access_token": token, "expires_in": 1}, request=request)

    monkeypatch.setattr(httpx, "Client", lambda: DummyClient())

    service = FedExService()
    tok1 = service._get_auth_token()
    assert tok1 == "t1"
    tok2 = service._get_auth_token()
    assert tok2 == "t1"

    fs._redis_client.set(
        "fedex_expiry",
        (datetime.utcnow() - timedelta(seconds=1)).isoformat(),
    )

    tok3 = service._get_auth_token()
    assert tok3 == "t2"
