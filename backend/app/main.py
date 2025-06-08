from fastapi import FastAPI
import logging
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from fastapi_limiter import FastAPILimiter
import redis.asyncio as redis
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .services.tracking_history_service import TrackingHistoryService
from .database import SessionLocal
from .config import settings
from .routers import auth, google_auth
from .routers import webhook
from .api.v1.api import api_router

# Chargement des variables d'environnement
load_dotenv()

# Configure global logging
logging.basicConfig(level=logging.INFO)

scheduler = AsyncIOScheduler()


def purge_old_history() -> None:
    """Remove tracking history older than the configured retention period."""
    db = SessionLocal()
    try:
        service = TrackingHistoryService(db)
        service.delete_older_than(settings.HISTORY_RETENTION_DAYS)
    finally:
        db.close()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API pour le suivi des colis",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
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


@app.on_event("startup")
async def startup() -> None:
    redis_client = redis.from_url(
        settings.REDIS_URL, encoding="utf8", decode_responses=True
    )
    await FastAPILimiter.init(redis_client)
    scheduler.add_job(purge_old_history, "interval", days=1)
    scheduler.start()


@app.on_event("shutdown")
async def shutdown() -> None:
    await FastAPILimiter.close()
    scheduler.shutdown()


# Inclusion des routeurs
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(google_auth.router, prefix=settings.API_V1_STR)
app.include_router(api_router)
app.include_router(webhook.router)


@app.get("/")
async def root():
    return {"message": "Welcome to the Tracking App API"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
