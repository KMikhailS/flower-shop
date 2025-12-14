import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers import users, goods, uploads, shop_addresses, health

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="FanFanTulpan API", version="1.0.0")

# Upload configuration
# Use /app/data/uploads to leverage the Docker volume mount
UPLOAD_DIR = Path("/app/data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Configure CORS
# Note: In production behind nginx proxy, requests come from same origin
# CORS is only needed for direct API access during testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Vite dev server
        "http://localhost:5173",  # Alternative Vite port
        "https://cadra.online",   # Production domain
        "https://www.cadra.online"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Mount static files directory for serving uploaded images
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

# Include routers
app.include_router(users.router)
app.include_router(goods.router)
app.include_router(uploads.router)
app.include_router(shop_addresses.router)
app.include_router(health.router)
