import os
import sys
import asyncio
import httpx
from datetime import timedelta
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
