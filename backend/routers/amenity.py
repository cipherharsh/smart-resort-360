# /backend/routers/amenity.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from database import get_db
from models.models import Amenity, AmenityWaitlist, Booking
from schemas.schemas import (
    AmenityCreate,
    AmenityResponse,
    AmenityWaitlistCreate,
    AmenityWaitlistResponse,
    AmenityEscalateRequest,
    TokenData,
)
from services.auth_service import get_current_user, require_role
from services.twilio_integration import twilio_service

router = APIRouter()


@router.get("", response_model=List[AmenityResponse], summary="List All Resort Amenities")
def list_amenities(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetches all resort amenities (e.g. Cabanas, Tennis Courts, Jet Skis) and their status."""
    query = db.query(Amenity)
    if category:
        query = query.filter(Amenity.category.ilike(f"%{category}%"))
    return query.all()


@router.post("", response_model=AmenityResponse, summary="Create New Amenity")
def create_amenity(
    payload: AmenityCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN"])),
):
    """Manager/Admin endpoint to register a new amenity in the resort system."""
    amenity = Amenity(
        name=payload.name,
        category=payload.category,
        status=payload.status,
        max_duration_minutes=payload.max_duration_minutes,
    )
    db.add(amenity)
    db.commit()
    db.refresh(amenity)
    return amenity


@router.patch("/{amenity_id}/status", response_model=AmenityResponse, summary="Update Amenity Status")
def update_amenity_status(
    amenity_id: int,
    status_val: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN", "STAFF"])),
):
    """Updates amenity status ('FREE', 'OCCUPIED', 'MAINTENANCE')."""
    amenity = db.query(Amenity).filter(Amenity.id == amenity_id).first()
    if not amenity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Amenity not found")

    amenity.status = status_val.upper()
    db.commit()
    db.refresh(amenity)
    return amenity


@router.post("/waitlist", response_model=AmenityWaitlistResponse, summary="Join Amenity Waitlist")
def join_waitlist(payload: AmenityWaitlistCreate, db: Session = Depends(get_db)):
    """Guests or Staff can register a guest onto an occupied amenity's waitlist."""
    amenity = db.query(Amenity).filter(Amenity.id == payload.amenity_id).first()
    if not amenity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Amenity not found")

    booking = db.query(Booking).filter(Booking.booking_id == payload.guest_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guest booking not found")

    entry = AmenityWaitlist(
        amenity_id=payload.amenity_id,
        guest_id=payload.guest_id,
        status=payload.status or "WAITING",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/waitlist/{amenity_id}", response_model=List[AmenityWaitlistResponse], summary="List Amenity Waitlist")
def list_waitlist(amenity_id: int, db: Session = Depends(get_db)):
    """Retrieves active waitlist entries for a particular amenity."""
    return db.query(AmenityWaitlist).filter(
        AmenityWaitlist.amenity_id == amenity_id,
        AmenityWaitlist.status.in_(["WAITING", "NOTIFIED"]),
    ).order_by(AmenityWaitlist.created_at.asc()).all()


@router.post("/escalate", summary="Twilio Push-to-Voice Waitlist Escalation")
def escalate_waitlist_call(
    payload: AmenityEscalateRequest,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN", "STAFF"])),
):
    """
    Twilio TwiML dynamic voice call trigger for waitlist claims.
    Initiates an automated voice phone call to notify the guest that their amenity is ready.
    """
    waitlist_entry = db.query(AmenityWaitlist).filter(AmenityWaitlist.id == payload.waitlist_id).first()
    if not waitlist_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waitlist record not found")

    amenity = db.query(Amenity).filter(Amenity.id == waitlist_entry.amenity_id).first()
    booking = db.query(Booking).filter(Booking.booking_id == waitlist_entry.guest_id).first()

    amenity_name = amenity.name if amenity else "Amenity"
    guest_name = booking.guest_name if booking else "Valued Guest"

    # Trigger outbound voice call using Twilio Service
    call_result = twilio_service.trigger_voice_call(
        to_phone=payload.target_phone,
        guest_name=guest_name,
        amenity_name=amenity_name,
        claim_window_minutes=15,
    )

    # Update waitlist status to NOTIFIED
    waitlist_entry.status = "NOTIFIED"
    db.commit()

    return {
        "status": "escalated",
        "waitlist_id": waitlist_entry.id,
        "guest_name": guest_name,
        "amenity_name": amenity_name,
        "call_details": call_result,
    }


@router.get("/twiml-voice", summary="TwiML Dynamic Voice Webhook Endpoint")
def get_twiml_voice(
    guest_name: str = "Valued Guest",
    amenity_name: str = "Cabana",
):
    """Returns raw XML TwiML formatted response for Twilio Voice Webhooks."""
    xml_content = twilio_service.generate_waitlist_twiml(guest_name, amenity_name)
    return Response(content=xml_content, media_type="application/xml")
