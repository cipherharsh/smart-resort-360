# /backend/routers/manager.py
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.models import (
    Employee,
    Booking,
    ServiceTicket,
    GuestFolio,
    Amenity,
    EmergencyAlert,
)
from schemas.schemas import (
    EmployeeCreate,
    EmployeeResponse,
    BookingCreate,
    BookingResponse,
    ServiceTicketResponse,
    ServiceTicketUpdate,
    GuestFolioCreate,
    GuestFolioResponse,
    ForecastResponse,
    TokenData,
)
from services.auth_service import get_password_hash, require_role
from services.forecaster import occupancy_forecaster

router = APIRouter()


# ==========================================
# EMPLOYEE MANAGEMENT
# ==========================================

@router.get("/employees", response_model=List[EmployeeResponse], summary="List Resort Employees")
def get_employees(
    department: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN"])),
):
    """Lists all resort staff with optional department and role filtering."""
    query = db.query(Employee)
    if department:
        query = query.filter(Employee.department.ilike(f"%{department}%"))
    if role:
        query = query.filter(Employee.role == role.upper())
    if is_active is not None:
        query = query.filter(Employee.is_active == is_active)
    return query.all()


@router.post("/employees", response_model=EmployeeResponse, summary="Create New Employee Account")
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN"])),
):
    """Registers a new staff or manager account with bcrypt password hashing."""
    existing = db.query(Employee).filter(Employee.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An employee with email '{payload.email}' already exists.",
        )

    employee = Employee(
        full_name=payload.full_name,
        role=payload.role.upper(),
        department=payload.department,
        email=payload.email.lower().strip(),
        auth_hash=get_password_hash(payload.password),
        is_active=payload.is_active,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


# ==========================================
# BOOKING MANAGEMENT
# ==========================================

@router.get("/bookings", response_model=List[BookingResponse], summary="List Resort Bookings")
def get_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN", "STAFF"])),
):
    """Lists reservations with optional status filter."""
    query = db.query(Booking)
    if status_filter:
        query = query.filter(Booking.booking_status == status_filter.upper())
    return query.order_by(Booking.check_in_date.desc()).all()


@router.post("/bookings", response_model=BookingResponse, summary="Create New Reservation")
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN", "STAFF"])),
):
    """Creates a new guest reservation record."""
    existing = db.query(Booking).filter(Booking.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reservation with email '{payload.email}' already exists.",
        )

    booking = Booking(
        guest_name=payload.guest_name,
        email=payload.email.lower().strip(),
        room_number=payload.room_number,
        check_in_date=payload.check_in_date,
        check_out_date=payload.check_out_date,
        booking_status=payload.booking_status,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


# ==========================================
# SERVICE TICKETS MANAGEMENT
# ==========================================

@router.get("/tickets", response_model=List[ServiceTicketResponse], summary="List All Service Tickets")
def get_service_tickets(
    department: Optional[str] = None,
    ticket_status: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN", "STAFF"])),
):
    """Returns service tickets across departments with live SLA status."""
    query = db.query(ServiceTicket)
    if department:
        query = query.filter(ServiceTicket.assigned_department.ilike(f"%{department}%"))
    if ticket_status:
        query = query.filter(ServiceTicket.status == ticket_status.upper())
    return query.order_by(ServiceTicket.created_at.desc()).all()


@router.patch("/tickets/{ticket_id}", response_model=ServiceTicketResponse, summary="Update Service Ticket")
def update_service_ticket(
    ticket_id: int,
    payload: ServiceTicketUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN", "STAFF"])),
):
    """Updates service ticket status, reassigned department, or assigned specialist."""
    ticket = db.query(ServiceTicket).filter(ServiceTicket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service ticket not found")

    if payload.status is not None:
        ticket.status = payload.status.upper()
    if payload.assigned_department is not None:
        ticket.assigned_department = payload.assigned_department
    if payload.assigned_employee_id is not None:
        ticket.assigned_employee_id = payload.assigned_employee_id
    if payload.sla_deadline is not None:
        ticket.sla_deadline = payload.sla_deadline

    db.commit()
    db.refresh(ticket)
    return ticket


# ==========================================
# GUEST FOLIO MANAGEMENT
# ==========================================

@router.get("/folios", response_model=List[GuestFolioResponse], summary="List All Guest Folio Charges")
def get_folios(
    booking_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN", "STAFF"])),
):
    """Lists guest room charges and billing folios."""
    query = db.query(GuestFolio)
    if booking_id:
        query = query.filter(GuestFolio.booking_id == booking_id)
    return query.order_by(GuestFolio.created_at.desc()).all()


@router.post("/folios", response_model=GuestFolioResponse, summary="Post Charge to Guest Folio")
def post_folio_charge(
    payload: GuestFolioCreate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN", "STAFF"])),
):
    """Posts a new billable charge (Dining, Spa, Cabana, Excursion) to a guest room folio."""
    booking = db.query(Booking).filter(Booking.booking_id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking record not found")

    folio = GuestFolio(
        booking_id=payload.booking_id,
        room_number=payload.room_number or booking.room_number,
        service_category=payload.service_category,
        item_description=payload.item_description,
        amount=payload.amount,
        payment_status=payload.payment_status,
        created_at=datetime.utcnow(),
    )
    db.add(folio)
    db.commit()
    db.refresh(folio)
    return folio


# ==========================================
# RESORT OVERVIEW METRICS & FORECASTING
# ==========================================

@router.get("/stats", summary="Get Resort Real-Time Dashboard Analytics")
def get_resort_stats(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN", "STAFF"])),
):
    """Computes high-level KPI metrics across occupancy, tickets, emergencies, and amenities."""
    total_bookings = db.query(Booking).filter(Booking.booking_status.in_(["CONFIRMED", "CHECKED_IN"])).count()
    open_tickets = db.query(ServiceTicket).filter(ServiceTicket.status.in_(["OPEN", "IN_PROGRESS"])).count()
    active_emergencies = db.query(EmergencyAlert).filter(EmergencyAlert.is_active.is_(True)).count()
    total_amenities = db.query(Amenity).count()
    occupied_amenities = db.query(Amenity).filter(Amenity.status == "OCCUPIED").count()
    active_employees = db.query(Employee).filter(Employee.is_active.is_(True)).count()

    # Total revenue from paid and pending folios
    total_revenue = db.query(func.sum(GuestFolio.amount)).scalar() or 0.0

    return {
        "active_guests": total_bookings,
        "occupancy_rate": f"{round((total_bookings / 50.0) * 100, 1)}%",
        "open_tickets": open_tickets,
        "active_emergencies": active_emergencies,
        "occupied_amenities": f"{occupied_amenities}/{total_amenities}",
        "active_staff_count": active_employees,
        "total_folio_revenue": round(float(total_revenue), 2),
    }


@router.get("/forecast", response_model=ForecastResponse, summary="Run Chronos-Bolt Occupancy Forecasting")
def get_occupancy_forecast(
    days: int = Query(14, ge=1, le=90, description="Forecast horizon in days"),
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(require_role(["MANAGER", "ADMIN"])),
):
    """
    Runs zero-shot occupancy predictions via Amazon Chronos-Bolt ('amazon/chronos-bolt-mini')
    on historical booking time-series data.
    """
    return occupancy_forecaster.forecast_occupancy(db=db, prediction_length=days)
