# /backend/services/seed_data.py
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
from models.models import Employee, Booking, Amenity, GuestFolio, ServiceTicket
from services.auth_service import get_password_hash

logger = logging.getLogger("seed_data")


def seed_initial_resort_data():
    """
    Seeds essential baseline resort staff, amenities, and demo bookings if database is fresh.
    """
    db: Session = SessionLocal()
    try:
        # 1. Seed Employees if none exist
        if db.query(Employee).count() == 0:
            default_staff = [
                Employee(
                    full_name="Elena Vance (General Manager)",
                    role="MANAGER",
                    department="Management",
                    email="manager@smartresort360.com",
                    auth_hash=get_password_hash("manager123"),
                    is_active=True,
                ),
                Employee(
                    full_name="Marcus Brody",
                    role="STAFF",
                    department="Housekeeping",
                    email="housekeeping@smartresort360.com",
                    auth_hash=get_password_hash("staff123"),
                    is_active=True,
                ),
                Employee(
                    full_name="Carlos Mendoza",
                    role="STAFF",
                    department="Maintenance",
                    email="maintenance@smartresort360.com",
                    auth_hash=get_password_hash("staff123"),
                    is_active=True,
                ),
                Employee(
                    full_name="Samantha Ray",
                    role="STAFF",
                    department="F&B",
                    email="fnb@smartresort360.com",
                    auth_hash=get_password_hash("staff123"),
                    is_active=True,
                ),
                Employee(
                    full_name="Viktor Novak",
                    role="STAFF",
                    department="Security",
                    email="security@smartresort360.com",
                    auth_hash=get_password_hash("staff123"),
                    is_active=True,
                ),
                Employee(
                    full_name="Chloe Bennett",
                    role="STAFF",
                    department="Front Desk",
                    email="frontdesk@smartresort360.com",
                    auth_hash=get_password_hash("staff123"),
                    is_active=True,
                ),
            ]
            db.add_all(default_staff)
            db.commit()
            logger.info("Default staff and manager accounts successfully seeded.")

        # 2. Seed Amenities if none exist
        if db.query(Amenity).count() == 0:
            default_amenities = [
                # Indoor Games
                Amenity(name="Royal Snooker Lounge", category="Indoor Games", status="FREE", max_duration_minutes=60),
                Amenity(name="8-Ball Pool Arena", category="Indoor Games", status="OCCUPIED", max_duration_minutes=45),
                Amenity(name="Championship Carrom Club", category="Indoor Games", status="FREE", max_duration_minutes=45),
                # Outdoor Games
                Amenity(name="Floodlit Cricket Nets & Pitch", category="Outdoor Games", status="FREE", max_duration_minutes=60),
                Amenity(name="Badminton Court A", category="Outdoor Games", status="FREE", max_duration_minutes=45),
                Amenity(name="Executive Golf Putting Green", category="Outdoor Games", status="FREE", max_duration_minutes=60),
                # Wellness & Cabanas
                Amenity(name="Sunset Oceanfront Cabana #4", category="Cabana", status="OCCUPIED", max_duration_minutes=90),
                Amenity(name="Royal Beachfront Cabana #1", category="Cabana", status="FREE", max_duration_minutes=90),
                Amenity(name="Hydrotherapy Spa Cabana", category="Spa", status="FREE", max_duration_minutes=60),
                Amenity(name="Infinity Pool VIP Daybed #2", category="Pool", status="FREE", max_duration_minutes=120),
            ]
            db.add_all(default_amenities)
            db.commit()
            logger.info("Default resort amenities seeded.")

        # 3. Seed Sample Booking & Folios if none exist
        if db.query(Booking).count() == 0:
            now = datetime.utcnow()
            guest_booking = Booking(
                guest_name="Alexander Wright",
                email="guest@smartresort360.com",
                room_number="402",
                check_in_date=now - timedelta(days=1),
                check_out_date=now + timedelta(days=4),
                booking_status="CHECKED_IN",
            )
            db.add(guest_booking)
            db.commit()
            db.refresh(guest_booking)

            # Sample Folios for the booking
            folios = [
                GuestFolio(
                    booking_id=guest_booking.booking_id,
                    room_number="402",
                    service_category="Dining",
                    item_description="Cabana Ocean Breeze Cocktail & Tapas",
                    amount=68.50,
                    payment_status="PAID",
                    created_at=now - timedelta(hours=5),
                ),
                GuestFolio(
                    booking_id=guest_booking.booking_id,
                    room_number="402",
                    service_category="Spa",
                    item_description="Signature 80-min Deep Tissue Massage",
                    amount=185.00,
                    payment_status="PENDING",
                    created_at=now - timedelta(hours=2),
                ),
            ]
            db.add_all(folios)
            db.commit()
            logger.info("Demo guest booking and folios seeded.")

    except Exception as e:
        logger.warning(f"Seed data notice: {e}")
    finally:
        db.close()
