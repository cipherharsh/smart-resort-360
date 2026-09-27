# /backend/services/auth_service.py
import os
import random
import smtplib
import logging
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, List, Dict, Any

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models.models import Employee, Booking
from schemas.schemas import TokenData

logger = logging.getLogger("auth_service")

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "smart_resort_360_jwt_secret_key_production_grade_998877")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

# Security Bearer scheme
security = HTTPBearer(auto_error=True)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against hashed password using native bcrypt."""
    try:
        password_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hash_bytes)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Generates secure bcrypt hash of a password."""
    password_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Encodes JWT access token with expiration time."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> TokenData:
    """Decodes JWT access token and extracts payload."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: Optional[int] = payload.get("user_id")
        email: Optional[str] = payload.get("email")
        role: Optional[str] = payload.get("role")
        if email is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload structure",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return TokenData(user_id=user_id, email=email, role=role)
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    """Dependency to retrieve and validate the current authenticated user token."""
    token = credentials.credentials
    return decode_access_token(token)


def require_role(allowed_roles: List[str]):
    """Role-Based Access Control (RBAC) dependency factory."""
    def role_checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        normalized_allowed = [r.upper() for r in allowed_roles]
        if current_user.role.upper() not in normalized_allowed and "ADMIN" not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {allowed_roles}, but current role is '{current_user.role}'",
            )
        return current_user
    return role_checker


def generate_otp() -> str:
    """Generates a secure 4-digit numeric OTP."""
    return f"{random.randint(1000, 9999)}"


def send_otp_email(to_email: str, user_name: str, otp: str, role: str = "GUEST") -> bool:
    """
    Sends a 4-digit OTP email using smtplib to the user's Gmail.
    Falls back gracefully and logs clearly if SMTP credentials need App Password.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM_EMAIL", smtp_user or "auth@smartresort360.com")

    role_title = "Manager Workspace" if role.upper() == "MANAGER" else ("Staff Portal" if role.upper() == "STAFF" else "Guest Stay")
    subject = f"Smart Resort 360 - {role_title} Verification Code: {otp}"
    
    body_text = f"""Dear {user_name},

Your one-time access verification code for Smart Resort 360 ({role_title}) is:

    ======================
            {otp}
    ======================

This code will expire in 10 minutes.

If you did not request this login code, please ignore this email.

Warm regards,
Smart Resort 360 AI Hospitality Platform
"""

    print(f"\n==================================================")
    print(f"[*] [OTP DISPATCH] Role: {role.upper()} | To: {to_email}")
    print(f"[*] [OTP CODE]     >>> {otp} <<<")
    print(f"==================================================\n")

    if smtp_user and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = smtp_from
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body_text, "plain"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
            logger.info(f"Successfully dispatched OTP email via Gmail SMTP to {to_email}")
            return True
        except Exception as e:
            logger.warning(f"SMTP dispatch note for {to_email}: {e}. OTP is logged above.")
            return False
    else:
        logger.info(f"Development mode OTP logged for {to_email}: {otp}")
        return True

