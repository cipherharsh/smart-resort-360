# /backend/routers/auth.py
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.models import Booking, Employee
from schemas.schemas import (
    GuestLoginRequest,
    GuestVerifyOTPRequest,
    ManagerOTPRequest,
    ManagerVerifyOTPRequest,
    StaffOTPRequest,
    StaffVerifyOTPRequest,
    StaffLoginRequest,
    Token,
    TokenData,
)
from services.auth_service import (
    generate_otp,
    send_otp_email,
    create_access_token,
    verify_password,
    get_password_hash,
    get_current_user,
)

router = APIRouter()


# ==========================================
# MANAGER DYNAMIC OTP AUTHENTICATION
# ==========================================

@router.post("/manager-otp", summary="Request 4-digit OTP for Manager Workspace")
def manager_request_otp(payload: ManagerOTPRequest, db: Session = Depends(get_db)):
    """
    Sends a 4-digit OTP code to the Manager's Gmail address.
    If the manager account does not exist yet, creates the account automatically.
    """
    clean_email = payload.email.lower().strip()
    employee = db.query(Employee).filter(Employee.email == clean_email).first()

    if not employee:
        employee = Employee(
            full_name=payload.full_name or "Resort General Manager",
            role="MANAGER",
            department="Leadership",
            email=clean_email,
            auth_hash=get_password_hash("manager123"),
            is_active=True,
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)

    otp = generate_otp()
    employee.current_otp = otp
    employee.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    # Dispatch via Gmail SMTP
    sent = send_otp_email(to_email=employee.email, user_name=employee.full_name, otp=otp, role="MANAGER")

    return {
        "status": "success",
        "message": f"Verification OTP sent to {clean_email}",
        "role": "MANAGER",
        "full_name": employee.full_name,
        "expires_in_minutes": 10,
        "dev_otp": otp,  # Included for immediate friction-free testing
        "email_dispatched": sent,
    }


@router.post("/manager-verify", response_model=Token, summary="Verify Manager OTP and Return JWT")
def manager_verify_otp(payload: ManagerVerifyOTPRequest, db: Session = Depends(get_db)):
    """Validates Manager OTP and returns a Manager-scoped JWT token."""
    clean_email = payload.email.lower().strip()
    employee = db.query(Employee).filter(Employee.email == clean_email).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Manager profile not found",
        )

    if not employee.current_otp or not employee.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP request found. Please click 'Send OTP' first.",
        )

    if datetime.utcnow() > employee.otp_expires_at:
        employee.current_otp = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one.",
        )

    if employee.current_otp != payload.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP code provided. Please check your inbox or server logs.",
        )

    # Clear OTP on successful authentication
    employee.current_otp = None
    employee.otp_expires_at = None
    db.commit()

    access_token = create_access_token(
        data={
            "user_id": employee.employee_id,
            "email": employee.email,
            "role": "MANAGER",
            "department": employee.department,
            "full_name": employee.full_name,
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role="MANAGER",
        user_id=employee.employee_id,
        email=employee.email,
    )


# ==========================================
# GUEST DYNAMIC OTP AUTHENTICATION
# ==========================================

@router.post("/guest-login", summary="Request 4-digit OTP for Guest Login")
def guest_login(payload: GuestLoginRequest, db: Session = Depends(get_db)):
    """
    Looks up booking by email (or provisions demo booking if fresh),
    generates a secure 4-digit OTP, and dispatches via Gmail SMTP.
    """
    clean_email = payload.email.lower().strip()
    booking = db.query(Booking).filter(Booking.email == clean_email).first()

    if not booking:
        # Dynamically create an active reservation so any guest email works immediately
        now = datetime.utcnow()
        booking = Booking(
            guest_name="Alexander Wright",
            email=clean_email,
            room_number="101",
            check_in_date=now - timedelta(days=1),
            check_out_date=now + timedelta(days=4),
            booking_status="CHECKED_IN",
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

    otp = generate_otp()
    booking.current_otp = otp
    booking.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    # Send email dispatch via Gmail SMTP
    sent = send_otp_email(to_email=booking.email, user_name=booking.guest_name, otp=otp, role="GUEST")

    return {
        "status": "success",
        "message": f"Verification OTP sent to {clean_email}",
        "room_number": booking.room_number,
        "guest_name": booking.guest_name,
        "expires_in_minutes": 10,
        "dev_otp": otp,  # Included for immediate testing
        "email_dispatched": sent,
    }


@router.post("/guest-verify", response_model=Token, summary="Verify Guest OTP and Return JWT")
def guest_verify_otp(payload: GuestVerifyOTPRequest, db: Session = Depends(get_db)):
    """Validates guest OTP against active booking records and issues a scoped JWT access token."""
    clean_email = payload.email.lower().strip()
    booking = db.query(Booking).filter(Booking.email == clean_email).first()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation record not found",
        )

    if not booking.current_otp or not booking.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP request found. Please request a new verification code.",
        )

    if datetime.utcnow() > booking.otp_expires_at:
        booking.current_otp = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one.",
        )

    if booking.current_otp != payload.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP code provided",
        )

    # Clear OTP on successful authentication
    booking.current_otp = None
    booking.otp_expires_at = None
    db.commit()

    access_token = create_access_token(
        data={
            "user_id": booking.booking_id,
            "email": booking.email,
            "role": "GUEST",
            "room_number": booking.room_number,
            "guest_name": booking.guest_name,
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role="GUEST",
        user_id=booking.booking_id,
        email=booking.email,
    )


# ==========================================
# STAFF DYNAMIC OTP AUTHENTICATION
# ==========================================

@router.post("/staff-otp", summary="Request 4-digit OTP for Staff Workspace")
def staff_request_otp(payload: StaffOTPRequest, db: Session = Depends(get_db)):
    """
    Sends a 4-digit OTP code to the Staff's email address.
    If the staff account does not exist yet, creates the account automatically.
    """
    clean_email = payload.email.lower().strip()
    employee = db.query(Employee).filter(Employee.email == clean_email).first()

    if not employee:
        employee = Employee(
            full_name=payload.full_name or "Engineering Staff",
            role="STAFF",
            department=payload.department or "Maintenance",
            email=clean_email,
            auth_hash=get_password_hash("staff123"),
            is_active=True,
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)

    otp = generate_otp()
    employee.current_otp = otp
    employee.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    # Dispatch via Gmail SMTP
    sent = send_otp_email(to_email=employee.email, user_name=employee.full_name, otp=otp, role="STAFF")

    return {
        "status": "success",
        "message": f"Verification OTP sent to {clean_email}",
        "role": "STAFF",
        "full_name": employee.full_name,
        "department": employee.department,
        "expires_in_minutes": 10,
        "dev_otp": otp,  # Included for immediate friction-free testing
        "email_dispatched": sent,
    }


@router.post("/staff-verify", response_model=Token, summary="Verify Staff OTP and Return JWT")
def staff_verify_otp(payload: StaffVerifyOTPRequest, db: Session = Depends(get_db)):
    """Validates Staff OTP and returns a Staff-scoped JWT token."""
    clean_email = payload.email.lower().strip()
    employee = db.query(Employee).filter(Employee.email == clean_email).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff profile not found",
        )

    if not employee.current_otp or not employee.otp_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP request found. Please click 'Send OTP' first.",
        )

    if datetime.utcnow() > employee.otp_expires_at:
        employee.current_otp = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one.",
        )

    if employee.current_otp != payload.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP code provided. Please check your inbox or server logs.",
        )

    # Clear OTP on successful authentication
    employee.current_otp = None
    employee.otp_expires_at = None
    db.commit()

    access_token = create_access_token(
        data={
            "user_id": employee.employee_id,
            "email": employee.email,
            "role": "STAFF",
            "department": employee.department,
            "full_name": employee.full_name,
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role="STAFF",
        user_id=employee.employee_id,
        email=employee.email,
    )


@router.post("/staff-login", response_model=Token, summary="Authenticate Resort Staff")
def staff_login(payload: StaffLoginRequest, db: Session = Depends(get_db)):
    """Authenticates resort employees (Staff / Engineering) with PIN, password, or direct access."""
    clean_email = payload.email.lower().strip()
    employee = db.query(Employee).filter(
        Employee.email == clean_email,
        Employee.is_active.is_(True),
    ).first()

    if not employee:
        # Auto-provision staff if logging in for demo
        employee = Employee(
            full_name="Engineering Staff",
            role="STAFF",
            department="Maintenance",
            email=clean_email,
            auth_hash=get_password_hash(payload.password or "staff123"),
            is_active=True,
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)

    access_token = create_access_token(
        data={
            "user_id": employee.employee_id,
            "email": employee.email,
            "role": employee.role.upper(),
            "department": employee.department,
            "full_name": employee.full_name,
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=employee.role.upper(),
        user_id=employee.employee_id,
        email=employee.email,
    )


@router.get("/me", summary="Get Authenticated User Profile")
def get_me(current_user: TokenData = Depends(get_current_user)):
    """Returns JWT decoded information about the current user session."""
    return current_user

