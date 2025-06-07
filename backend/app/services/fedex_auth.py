import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

class FedExAuth:
   def __init__(self):
    #    self.client_id = os.getenv('FEDEX_CLIENT_ID', 'l7a3be758bf3b24fe487c2c2fcbf63800a')
     #   self.client_secret = os.getenv('FEDEX_CLIENT_SECRET', '0f50edb9d00b4076baefbce8eddc93a1')
     #   self.account_number = os.getenv('FEDEX_ACCOUNT_NUMBER', '740561073')
        # Forcer l'utilisation de l'environnement sandbox pour le développement
        self.base_url = "https://apis-sandbox.fedex.com"
        self._access_token = None
        self._token_expiry = None
        # Clés FedEx (à déplacer dans .env)
        # FEDEX_CLIENT_ID=l7a3be758bf3b24fe487c2c2fcbf63800a
        # FEDEX_CLIENT_SECRET=0f50edb9d00b4076baefbce8eddc93a1
        
        self.client_id = os.getenv('FEDEX_CLIENT_ID')
        self.client_secret = os.getenv('FEDEX_CLIENT_SECRET')

    def get_access_token(self):
        """Get a new access token or return existing valid token"""
        if self._access_token and self._token_expiry and datetime.now() < self._token_expiry:
            return self._access_token

        url = f"{self.base_url}/oauth/token"
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }

        try:
            response = requests.post(url, headers=headers, data=data)
            response.raise_for_status()
            token_data = response.json()
            
            self._access_token = token_data['access_token']
            # Set token expiry to 30 minutes from now (FedEx tokens typically last 30 minutes)
            self._token_expiry = datetime.now() + timedelta(minutes=30)
            
            return self._access_token
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to get FedEx access token: {str(e)}")

    def get_headers(self):
        """Get headers with authentication token for API requests"""
        return {
            'Authorization': f'Bearer {self.get_access_token()}',
            'Content-Type': 'application/json',
            'X-locale': 'en_US'
        } 