# /backend/services/__init__.py
from .auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    get_current_user,
    require_role,
    generate_otp,
    send_otp_email,
)
from .twilio_integration import twilio_service
from .forecaster import occupancy_forecaster
from .weather_service import fetch_live_weather

__all__ = [
    "get_password_hash",
    "verify_password",
    "create_access_token",
    "decode_access_token",
    "get_current_user",
    "require_role",
    "generate_otp",
    "send_otp_email",
    "twilio_service",
    "occupancy_forecaster",
    "fetch_live_weather",
]
