# /backend/routers/emergency.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.models import EmergencyAlert
from schemas.schemas import (
    EmergencyAlertResponse,
    EmergencyBroadcastRequest,
    TokenData,
)
from services.auth_service import get_current_user, require_role
from services.twilio_integration import twilio_service

router = APIRouter()


@router.post("/broadcast", response_model=EmergencyAlertResponse, summary="Initiate Resort-Wide Emergency Broadcast")
def broadcast_emergency(
    payload: EmergencyBroadcastRequest,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN", "STAFF"])),
):
    """
    Manager/Staff override activating a resort-wide emergency record.
    Broadcasts the alert and logs priority dispatch.
    """
    alert = EmergencyAlert(
        initiator_role=current_user.role,
        location=payload.location,
        alert_type=payload.alert_type.upper(),
        message=payload.message,
        is_active=True,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Optional voice alert broadcast generation
    twilio_service.generate_emergency_twiml(
        alert_type=alert.alert_type,
        location=alert.location,
        message=alert.message,
    )

    return alert


@router.get("/active", response_model=List[EmergencyAlertResponse], summary="Get All Active Emergency Alerts")
def get_active_emergencies(db: Session = Depends(get_db)):
    """Public/Guest/Staff endpoint to query all currently active emergency alerts."""
    alerts = db.query(EmergencyAlert).filter(EmergencyAlert.is_active.is_(True)).order_by(EmergencyAlert.created_at.desc()).all()
    return alerts


@router.post("/{alert_id}/resolve", summary="Resolve and Deactivate Emergency Alert")
def resolve_emergency(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN"])),
):
    """Deactivates a live emergency alert record once the situation is resolved."""
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency alert #{alert_id} not found",
        )

    alert.is_active = False
    db.commit()
    return {"status": "resolved", "alert_id": alert_id, "message": "Emergency alert marked as resolved."}
