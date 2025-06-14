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
Set `FEDEX_WEBHOOK_SECRET` if you enable signed webhooks in your FedEx account.

Both `backend/.env` and `backend/.env.local` are ignored by Git. Store your secrets in `backend/.env.local` so they are not committed and are automatically loaded by the backend.

`SECRET_KEY` must be provided in production. Define it in `backend/.env.local` or set the environment variable before starting the backend.

`REDIS_URL` controls the Redis connection used for rate limiting. If omitted, the API defaults to `redis://localhost:6379/0`.
`HISTORY_RETENTION_DAYS` sets how many days of tracking history to keep. Old records older than this value are purged automatically (default: `30`).

The frontend needs a Google Maps API key. Set `GOOGLE_MAPS_API_KEY` in a `.env` file at the project root or export it in your shell before running the Angular app.

## Required variables

Set the following variables in `backend/.env.local` or export them in your shell for development and tests:

- `FEDEX_CLIENT_ID`
- `FEDEX_CLIENT_SECRET`
- `FEDEX_ACCOUNT_NUMBER`
- `SECRET_KEY`

If any of these values are missing, the backend will fail to start.

## Quickstart

Follow these steps to run the project locally:

1. **Clone the repository** and move into the project root.
2. **Create the environment files** from the examples and add your secrets:

   ```bash
   cp backend/.env.example backend/.env.local
   cp .env.example .env
   ```

   Update `backend/.env.local` with your FedEx credentials and a `SECRET_KEY`.
   Set `GOOGLE_MAPS_API_KEY` in `.env` for the frontend.
3. **Install backend dependencies and start the API**:

   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
4. **Install frontend dependencies and start Angular** in another terminal:

   ```bash
   cd Frontend
   npm install
   npm start
   ```
5. *(Optional)* **Initialize the database and run the tests**:

   ```bash
   python backend/app/init_db.py
   pip install -r requirements-test.txt
   pytest
   ```
6. *(Optional)* **Run everything with Docker Compose**:

   ```bash
   docker-compose up
   ```

## Running the Backend

Install the Python dependencies and start the API server:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Running the Frontend

Install the Node modules, ensure `GOOGLE_MAPS_API_KEY` is defined, and start Angular:

```bash
cd Frontend
npm install
npm start
```

## Supported browsers

The application is tested with Playwright on the following browsers:

- Google Chrome (Chromium)
- Mozilla Firefox
- Apple Safari (WebKit)

Other browsers may work but are not officially supported.

## Setup

After cloning the repository, copy the example environment files:

```bash
cp backend/.env.example backend/.env.local
cp .env.example .env
```

`backend/.env.local` must define `SECRET_KEY` and include your FedEx credentials before starting the API.

Install the project dependencies, initialize the database and run the tests:

```bash
pip install -r backend/requirements.txt
npm install
pip install -r requirements-test.txt
python backend/app/init_db.py
pytest
```

## Running with Docker Compose

Create the environment files before starting the containers:

- `backend/.env.local` &ndash; copy from `backend/.env.example` and provide the required backend secrets.
- `.env` &ndash; copy from `.env.example` and set `GOOGLE_MAPS_API_KEY` for the frontend.
The Compose stack also starts a `db` service based on PostgreSQL. Database files are stored in the `db-data` volume so data persists between runs.

From the project root run:

```bash
docker-compose up
```

On the first run Docker Compose builds the backend and frontend images. Once the build completes, the services are available on the default ports:

- Backend: http://localhost:8000
- Frontend: http://localhost:4200
- Redis: localhost:6379
- Database: localhost:5432 (data in `db-data` volume)

## Running Tests

Install the backend dependencies and the packages listed in
`requirements-test.txt`. Once the requirements are installed, run the
test suite with `pytest`. Ensure the [required variables](#required-variables) (for example `FEDEX_CLIENT_ID`, `FEDEX_CLIENT_SECRET`, `FEDEX_ACCOUNT_NUMBER` and `SECRET_KEY`) are set in `backend/.env.local` or exported in your shell:

```bash
pip install -r backend/requirements.txt
pip install -r requirements-test.txt
pytest
```

Angular unit tests are executed with Karma via `npm test` in the `Frontend`
directory. Karma launches Chrome so a local installation is normally
required. On CI systems you can either run Playwright's bundled Chromium with
`--no-sandbox` or set `CHROME_BIN` to the path of that bundled Chrome
executable.

Example using Playwright's browser:

```bash
npx playwright install chromium
export CHROME_BIN=$(pwd)/node_modules/playwright-core/.local-browsers/chromium-*/chrome-linux/chrome
CI=true npm test -- --watch=false --browsers=ChromeHeadless --no-sandbox
```

## Password requirements

User registration requires a strong password. The password must be at least 8
characters long and include at least one digit and one uppercase letter. A
validation error is returned if this rule is not met.

## Double authentification

- exécutez `/auth/setup-2fa` pour obtenir l'URL du QR à scanner ;
- saisissez le code retourné dans `/auth/verify-2fa` pour activer la protection ;
- lors de la connexion, renseignez le champ `totp_code` si l'option est activée.

Le paquet `pyotp` utilisé pour générer les codes TOTP figure déjà dans `backend/requirements.txt`.

## Ré-envoi de l'email de vérification

Si vous n'avez pas reçu l'email de confirmation lors de l'inscription, vous
pouvez demander un nouvel envoi via l'endpoint `POST /auth/resend-verification`.
Envoyez simplement l'adresse email utilisée à l'inscription :

```bash
curl -X POST http://localhost:8000/api/v1/auth/resend-verification \
     -H 'Content-Type: application/json' \
     -d '{"email": "user@example.com"}'
```

L'interface Angular propose un formulaire accessible à l'adresse
`/auth/resend-verification` pour effectuer cette action.

## FedEx Webhook Setup

Configure a FedEx webhook so that shipment updates are sent to
`/webhook/fedex` on your backend. When enabling signature verification in
the FedEx dashboard, set the same secret in `FEDEX_WEBHOOK_SECRET` inside
`backend/.env.local`. FedEx will send events as POST requests and the
application will refresh the tracking information automatically.

## Tracking History API

The `/api/v1/history` endpoints allow an authenticated user to manage and
export their tracking history. Records are retained for a limited time as
configured by the `HISTORY_RETENTION_DAYS` environment variable. A scheduled
job runs daily to purge entries older than this value.

- **`GET /api/v1/history/`** – list the user's recorded tracking searches.
- **`POST /api/v1/history/`** – add a new history entry.
- **`PATCH /api/v1/history/{id}`** – update a note or pinned state for an entry.
- **`DELETE /api/v1/history/`** – remove all history entries.
- **`DELETE /api/v1/history/{id}`** – delete a single entry.
- **`GET /api/v1/history/export`** – download history in CSV or PDF using the
  `format` query parameter.

### Examples

Retrieve history:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
    http://localhost:8000/api/v1/history/
```

Export in CSV:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
    http://localhost:8000/api/v1/history/export?format=csv -o history.csv
```

## License

This project is licensed under the [MIT License](LICENSE).
