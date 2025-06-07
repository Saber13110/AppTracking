# AppTracking

This project requires several environment variables to run. Copy `backend/.env.example` to `backend/.env` and fill in the values.

The most important variables for Google OAuth are:

```
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=<authorized-redirect-uri>
```

These values are used by the backend when initializing the OAuth client in `google_auth.py`.
