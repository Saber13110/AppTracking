# AppTracking

## Environment Variables

The backend requires several FedEx credentials to be provided via environment variables.
Create an **untracked** file named `.env.local` in the `backend` directory or export them in your shell:

```
FEDEX_AUTH_URL=<FedEx OAuth URL>
FEDEX_CLIENT_ID=<your FedEx client id>
FEDEX_CLIENT_SECRET=<your FedEx client secret>
FEDEX_ACCOUNT_NUMBER=<your FedEx account number>
```

Optionally set `FEDEX_BASE_URL` to override the default `https://apis-sandbox.fedex.com`.

The repository excludes `backend/.env` from version control. Store your secrets in `backend/.env.local` or set them as environment variables when running the application.

`SECRET_KEY` must be provided in production. Define it in `backend/.env.local` or set the environment variable before starting the backend.

`REDIS_URL` controls the Redis connection used for rate limiting. If omitted, the API defaults to `redis://localhost:6379/0`.

The frontend needs a Google Maps API key. Set `GOOGLE_MAPS_API_KEY` in a `.env` file at the project root or export it in your shell before running the Angular app.

