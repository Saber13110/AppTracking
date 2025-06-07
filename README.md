# AppTracking

## Environment Variables

The backend requires several FedEx credentials to be provided via environment variables.
Create a `.env` file in the `backend` directory or export them in your shell:

```
FEDEX_AUTH_URL=<FedEx OAuth URL>
FEDEX_CLIENT_ID=<your FedEx client id>
FEDEX_CLIENT_SECRET=<your FedEx client secret>
FEDEX_ACCOUNT_NUMBER=<your FedEx account number>
```

Optionally set `FEDEX_BASE_URL` to override the default `https://apis-sandbox.fedex.com`.

