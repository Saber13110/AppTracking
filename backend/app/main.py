from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from .config import settings
from .routers import auth, google_auth
from .api.v1.api import api_router

# Chargement des variables d'environnement
load_dotenv()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API pour le suivi des colis",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Ajout du middleware de session
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routeurs
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(google_auth.router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to the Tracking App API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 