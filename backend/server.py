import asyncio
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
from lib.db import client, db, ensure_indexes
from routers.ai import router as ai_router
from routers.auth import router as auth_router
from routers.discovery import router as discovery_router
from routers.trips import router as trips_router


# Startup runs before the yield, shutdown after it. Add your own setup/teardown here.
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())  # background: a big index build must not block boot
    yield
    client.close()


# Create the main app without a prefix
app = FastAPI(lifespan=lifespan, title="VoyageAI")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

logger = logging.getLogger("voyage")


@api_router.get("/")
async def root():
    return {"message": "VoyageAI API", "provider_mode": os.environ.get("PROVIDER_MODE", "mock")}


api_router.include_router(auth_router)
api_router.include_router(trips_router)
api_router.include_router(discovery_router)
api_router.include_router(ai_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def observability(request: Request, call_next):
    """Structured request log + a safe envelope for anything that escapes a handler."""
    request_id = str(uuid.uuid4())[:8]
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception(
            "request_failed request_id=%s method=%s path=%s", request_id, request.method, request.url.path
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Something went wrong on our side. Please try again."},
        )
    logger.info(
        "request request_id=%s method=%s path=%s status=%s latency_ms=%s",
        request_id, request.method, request.url.path, response.status_code,
        int((time.perf_counter() - started) * 1000),
    )
    return response


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Include the router in the main app — must stay the last statement in this file.
app.include_router(api_router)
