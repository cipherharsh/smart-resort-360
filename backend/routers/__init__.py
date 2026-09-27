# /backend/routers/__init__.py
from .auth import router as auth_router
from .manager import router as manager_router
from .emergency import router as emergency_router
from .amenity import router as amenity_router
from .guest import router as guest_router

__all__ = [
    "auth_router",
    "manager_router",
    "emergency_router",
    "amenity_router",
    "guest_router",
]
