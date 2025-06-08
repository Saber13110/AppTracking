# AppTracking

## Environment Variables

The backend requires several FedEx credentials to be provided via environment variables.
Copy `backend/.env.example` to `.env.local` in the same directory or export the variables in your shell:

```
FEDEX_AUTH_URL=<FedEx OAuth URL>
FEDEX_CLIENT_ID=<your FedEx client id>
FEDEX_CLIENT_SECRET=<your FedEx client secret>
FEDEX_ACCOUNT_NUMBER=<your FedEx account number>
```

The `.env.local` file should include values for `FEDEX_CLIENT_ID`,
`FEDEX_CLIENT_SECRET`, `FEDEX_ACCOUNT_NUMBER`, `SECRET_KEY` and any other
required secrets.

Optionally set `FEDEX_BASE_URL` to override the default `https://apis-sandbox.fedex.com`.

Both `backend/.env` and `backend/.env.local` are ignored by Git. Store your secrets in `backend/.env.local` so they are not committed and are automatically loaded by the backend.

`SECRET_KEY` must be provided in production. Define it in `backend/.env.local` or set the environment variable before starting the backend.

`REDIS_URL` controls the Redis connection used for rate limiting. If omitted, the API defaults to `redis://localhost:6379/0`.

