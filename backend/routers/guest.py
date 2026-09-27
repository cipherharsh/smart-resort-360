# /backend/routers/guest.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.models import Booking, GuestFolio, ServiceTicket
from schemas.schemas import (
    GuestChatRequest,
    GuestChatResponse,
    GuestFolioResponse,
    BookingDetailResponse,
    ServiceTicketResponse,
    TokenData,
)
from services.auth_service import get_current_user
from agents.department_head import run_department_head

router = APIRouter()


@router.post("/chat", response_model=GuestChatResponse, summary="Guest Multi-Agent AI Concierge Chat")
def guest_chat(
    payload: GuestChatRequest,
    db: Session = Depends(get_db),
):
    """
    Ingests guest queries into the LangGraph autonomous concierge & department head supervisor.
    Detects urgency, auto-allocates available staff, generates persistent ServiceTickets,
    and returns a reassuring SLA-bound response.
    """
    agent_output = run_department_head(
        message=payload.message,
        location=payload.location or "Resort Grounds",
        guest_id=payload.guest_id,
    )

    return GuestChatResponse(
        reply=agent_output.get("reply", "Thank you. Our concierge team has received your message."),
        department_routed=agent_output.get("detected_department"),
        ticket_created=agent_output.get("ticket_created", False),
        ticket_id=agent_output.get("ticket_id"),
        sla_deadline=agent_output.get("sla_deadline"),
    )


@router.get("/booking/{booking_id}", response_model=BookingDetailResponse, summary="Get Full Guest Booking Details")
def get_guest_booking(booking_id: int, db: Session = Depends(get_db)):
    """Retrieves booking record along with associated folios and active service tickets."""
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking


@router.get("/folio/{booking_id}", response_model=List[GuestFolioResponse], summary="Get Guest Billing Folio")
def get_guest_folio(booking_id: int, db: Session = Depends(get_db)):
    """Retrieves all room charges, dining, spa, and service folios for a reservation."""
    folios = db.query(GuestFolio).filter(GuestFolio.booking_id == booking_id).all()
    return folios


@router.get("/tickets/{booking_id}", response_model=List[ServiceTicketResponse], summary="Get Guest Service Tickets")
def get_guest_tickets(booking_id: int, db: Session = Depends(get_db)):
    """Retrieves service tickets requested by or associated with this guest reservation."""
    tickets = db.query(ServiceTicket).filter(ServiceTicket.guest_id == booking_id).order_by(ServiceTicket.created_at.desc()).all()
    return tickets
