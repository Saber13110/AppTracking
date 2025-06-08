import json
from typing import Any, Dict, List

import requests

BASE_URL = "http://localhost:8000/api/v1"


def test_single_tracking(tracking_id: str) -> Dict[str, Any]:
    """Test le suivi d'un seul colis."""
    url = f"{BASE_URL}/track/{tracking_id}"
    response = requests.get(url)
    print(f"\n=== Test suivi colis {tracking_id} ===")
    print(f"Status Code: {response.status_code}")
    print("Response:", json.dumps(response.json(), indent=2, ensure_ascii=False))
    return response.json()


def test_batch_tracking(tracking_ids: List[str]) -> Dict[str, Any]:
    """Test le suivi de plusieurs colis."""
    url = f"{BASE_URL}/track/batch"
    data = {"tracking_numbers": tracking_ids}
    response = requests.post(url, json=data)
    print("\n=== Test suivi multiple colis ===")
    print(f"Status Code: {response.status_code}")
    print("Response:", json.dumps(response.json(), indent=2, ensure_ascii=False))
    return response.json()


def test_update_tracking(
    tracking_id: str, customer_name: str | None = None, note: str | None = None
) -> Dict[str, Any]:
    """Test la mise à jour des informations d'un colis via PATCH."""
    url = f"{BASE_URL}/track/{tracking_id}"
    data: Dict[str, str] = {}
    if customer_name:
        data["customer_name"] = customer_name
    if note:
        data["note"] = note

    response = requests.patch(url, json=data)
    print(f"\n=== Test mise à jour colis {tracking_id} ===")
    print(f"Status Code: {response.status_code}")
    print("Response:", json.dumps(response.json(), indent=2, ensure_ascii=False))
    return response.json()


def main() -> None:
    # Liste des IDs de tracking à tester
    tracking_ids = [
        "1234567890",  # Remplacez par vos IDs réels
        "0987654321",
    ]

    # Test 1: Suivi d'un seul colis
    test_single_tracking(tracking_ids[0])

    # Test 2: Suivi de plusieurs colis
    test_batch_tracking(tracking_ids)

    # Test 3: Mise à jour d'un colis (PATCH)
    test_update_tracking(
        tracking_ids[0],
        customer_name="John Doe",
        note="Fragile package",
    )


if __name__ == "__main__":
    main()
