# /backend/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models  # Ensures all SQLAlchemy models are registered
from services.seed_data import seed_initial_resort_data

# Import Modular Routers
from routers.auth import router as auth_router
from routers.manager import router as manager_router
from routers.emergency import router as emergency_router
from routers.amenity import router as amenity_router
from routers.guest import router as guest_router
from routers.weather import router as weather_router


# Modern lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # This runs exactly once when the server starts
    Base.metadata.create_all(bind=engine)
    # Seed initial resort baseline records if empty
    seed_initial_resort_data()
    yield
    # Anything after 'yield' runs when the server shuts down


# Initialize FastAPI with the lifespan manager
app = FastAPI(
    title="Smart Resort 360 API",
    description="High-performance multi-agent AI hospitality platform backend API.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS Middleware for Frontend Access (Vite/React/Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# MOUNT ROUTERS
# ==========================================
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication (API)"])
app.include_router(manager_router, prefix="/api/manager", tags=["Manager & Operations"])
app.include_router(emergency_router, prefix="/api/emergency", tags=["Emergency & Safety"])
app.include_router(guest_router, prefix="/api/guest", tags=["Guest Services & AI Concierge"])
app.include_router(amenity_router, prefix="/api/amenity", tags=["Amenities & Waitlist Escalation"])
app.include_router(weather_router, prefix="/api/weather", tags=["Live Weather & Environmental Intelligence"])


@app.get("/", tags=["System"])
def read_root():
    return {
        "system": "Smart Resort 360",
        "status": "online",
        "documentation": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    # If this route works without crashing, database connectivity is confirmed!
    return {
        "status": "healthy",
        "database_connected": True,
        "engine": "Smart Resort 360 AI Platform",
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    from fastapi import Response, status
    return Response(status_code=status.HTTP_204_NO_CONTENT)