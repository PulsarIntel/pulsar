import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from finance.api.api import router as api_router
from finance.core.config import settings
from finance.core.exceptions import AppError
from finance.core.handlers import app_error_handler
from finance.events.main import on_shutdown, on_startup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.JWT_SECRET or settings.JWT_SECRET == "change-me-in-production":
        raise RuntimeError("JWT_SECRET must be set in environment variables")
    await on_startup()
    yield
    await on_shutdown()

app = FastAPI(
    title="Finance API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)
app.include_router(api_router, prefix="/api")
