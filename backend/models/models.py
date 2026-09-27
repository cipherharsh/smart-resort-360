# /backend/models/models.py
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Float,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import relationship

# Import Base directly from existing database.py
from database import Base


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # e.g., 'MANAGER', 'STAFF', 'ADMIN'
    department = Column(String(100), nullable=False)  # e.g., 'Housekeeping', 'Maintenance', 'Front Desk', 'F&B', 'Security'
    email = Column(String(255), unique=True, index=True, nullable=False)
    auth_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    current_otp = Column(String(10), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)

    # Relationships
    assigned_tickets = relationship("ServiceTicket", back_populates="assigned_employee")

    def __repr__(self):
        return f"<Employee(id={self.employee_id}, name='{self.full_name}', role='{self.role}', dept='{self.department}')>"


class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    guest_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    room_number = Column(String(50), nullable=False)
    check_in_date = Column(DateTime, nullable=False)
    check_out_date = Column(DateTime, nullable=False)
    booking_status = Column(String(50), default="CONFIRMED", nullable=False)  # 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'
    current_otp = Column(String(10), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)

    # Relationships
    guest_folios = relationship("GuestFolio", back_populates="booking", cascade="all, delete-orphan")
    service_tickets = relationship("ServiceTicket", back_populates="booking")
    waitlist_entries = relationship("AmenityWaitlist", back_populates="booking")

    def __repr__(self):
        return f"<Booking(id={self.booking_id}, guest='{self.guest_name}', room='{self.room_number}', status='{self.booking_status}')>"


class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    alert_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    initiator_role = Column(String(50), nullable=False)  # e.g., 'MANAGER', 'SECURITY', 'SYSTEM'
    location = Column(String(255), nullable=False)
    alert_type = Column(String(100), nullable=False)  # e.g., 'FIRE', 'MEDICAL', 'SECURITY', 'WEATHER'
    message = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<EmergencyAlert(id={self.alert_id}, type='{self.alert_type}', location='{self.location}', active={self.is_active})>"


class ServiceTicket(Base):
    __tablename__ = "service_tickets"

    ticket_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    guest_id = Column(Integer, ForeignKey("bookings.booking_id"), nullable=True)
    location = Column(String(255), nullable=False)
    issue_category = Column(String(100), nullable=False)  # e.g., 'Plumbing', 'Electrical', 'Housekeeping', 'F&B'
    assigned_department = Column(String(100), nullable=False)
    assigned_employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    status = Column(String(50), default="OPEN", nullable=False)  # 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    sla_deadline = Column(DateTime, nullable=True)

    # Relationships
    assigned_employee = relationship("Employee", back_populates="assigned_tickets")
    booking = relationship("Booking", back_populates="service_tickets")

    def __repr__(self):
        return f"<ServiceTicket(id={self.ticket_id}, dept='{self.assigned_department}', status='{self.status}')>"


class GuestFolio(Base):
    __tablename__ = "guest_folios"

    folio_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.booking_id"), nullable=False)
    room_number = Column(String(50), nullable=False)
    service_category = Column(String(100), nullable=False)  # e.g., 'Spa', 'Dining', 'Cabana', 'Excursion', 'Mini-Bar'
    item_description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    payment_status = Column(String(50), default="PENDING", nullable=False)  # 'PENDING', 'PAID', 'WAIVED'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="guest_folios")

    def __repr__(self):
        return f"<GuestFolio(id={self.folio_id}, room='{self.room_number}', item='{self.item_description}', amount={self.amount})>"


class Amenity(Base):
    __tablename__ = "amenities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # e.g., 'Cabana', 'Tennis Court', 'Spa Pool', 'Jet Ski'
    status = Column(String(50), default="FREE", nullable=False)  # 'FREE', 'OCCUPIED', 'MAINTENANCE'
    max_duration_minutes = Column(Integer, default=60, nullable=False)

    # Relationships
    waitlist_entries = relationship("AmenityWaitlist", back_populates="amenity", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Amenity(id={self.id}, name='{self.name}', status='{self.status}')>"


class AmenityWaitlist(Base):
    __tablename__ = "amenity_waitlists"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    amenity_id = Column(Integer, ForeignKey("amenities.id"), nullable=False)
    guest_id = Column(Integer, ForeignKey("bookings.booking_id"), nullable=False)
    status = Column(String(50), default="WAITING", nullable=False)  # 'WAITING', 'NOTIFIED', 'CLAIMED', 'EXPIRED', 'CANCELLED'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    amenity = relationship("Amenity", back_populates="waitlist_entries")
    booking = relationship("Booking", back_populates="waitlist_entries")

    def __repr__(self):
        return f"<AmenityWaitlist(id={self.id}, amenity_id={self.amenity_id}, guest_id={self.guest_id}, status='{self.status}')>"
