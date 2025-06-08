# AppTracking

## Installation

1. Installez les dépendances Python :
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Depuis le répertoire `Frontend/`, installez les dépendances Node.js :
   ```bash
   npm install
   ```
3. Lancez le backend :
   ```bash
   uvicorn backend.app.main:app
   ```
4. Dans `Frontend/`, démarrez l’interface :
   ```bash
   npm start
   ```

## Environment Variables

The backend requires several FedEx credentials to be provided via environment variables.
Créez un fichier `backend/.env.local` en vous basant sur `backend/.env.example` ou exportez les variables dans votre shell :

```
FEDEX_AUTH_URL=<FedEx OAuth URL>
FEDEX_CLIENT_ID=<your FedEx client id>
FEDEX_CLIENT_SECRET=<your FedEx client secret>
FEDEX_ACCOUNT_NUMBER=<your FedEx account number>
```

Le fichier `.env.local` doit au minimum définir `FEDEX_CLIENT_ID`,
`FEDEX_CLIENT_SECRET`, `FEDEX_ACCOUNT_NUMBER` et `SECRET_KEY` ainsi que toutes
les autres variables nécessaires.

Optionally set `FEDEX_BASE_URL` to override the default `https://apis-sandbox.fedex.com`.

Both `backend/.env` and `backend/.env.local` are ignored by Git. Store your secrets in `backend/.env.local` so they are not committed and are automatically loaded by the backend.

`SECRET_KEY` must be provided in production. Define it in `backend/.env.local` or set the environment variable before starting the backend.


`REDIS_URL` controls the Redis connection used for rate limiting. If omitted, the API defaults to `redis://localhost:6379/0`.

The frontend needs a Google Maps API key. Set `GOOGLE_MAPS_API_KEY` in a `.env` file at the project root or export it in your shell before running the Angular app.

## Tests

Pour exécuter la suite de tests automatisés :

```bash
pytest
```

