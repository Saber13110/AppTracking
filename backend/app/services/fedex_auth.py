import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()


class FedExAuth:
    def __init__(self):
        # Force use of the sandbox environment for development
        self.base_url = "https://apis-sandbox.fedex.com"
        self._access_token: str | None = None
        self._token_expiry: datetime | None = None

        # Credentials are read from environment variables
        self.client_id = os.getenv("FEDEX_CLIENT_ID")
        self.client_secret = os.getenv("FEDEX_CLIENT_SECRET")

    def get_access_token(self) -> str:
        """Return a valid FedEx access token."""
        if (
            self._access_token
            and self._token_expiry
            and datetime.now() < self._token_expiry
        ):
            return self._access_token

        url = f"{self.base_url}/oauth/token"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        try:
            response = requests.post(url, headers=headers, data=data)
            response.raise_for_status()
            token_data = response.json()

            self._access_token = token_data["access_token"]
            # FedEx tokens typically last 30 minutes
            self._token_expiry = datetime.now() + timedelta(minutes=30)

            return self._access_token
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to get FedEx access token: {e}") from e

    def get_headers(self) -> dict[str, str]:
        """Return headers including the authentication token."""
        return {
            "Authorization": f"Bearer {self.get_access_token()}",
            "Content-Type": "application/json",
            "X-locale": "en_US",
        }
