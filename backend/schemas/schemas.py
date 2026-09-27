# /backend/schemas/schemas.py
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ==========================================
# AUTH & TOKEN SCHEMAS
# ==========================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    email: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


class GuestLoginRequest(BaseModel):
    email: EmailStr


class GuestVerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=6)


class ManagerOTPRequest(BaseModel):
    email: EmailStr
    role: Optional[str] = "MANAGER"
    full_name: Optional[str] = "Resort Manager"


class ManagerVerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=6)
    role: Optional[str] = "MANAGER"


class StaffLoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    pin: Optional[str] = None
    otp: Optional[str] = None



# ==========================================
# EMPLOYEE SCHEMAS
# ==========================================

class EmployeeBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., max_length=50, description="e.g. MANAGER, STAFF, ADMIN")
    department: str = Field(..., max_length=100, description="e.g. Housekeeping, Maintenance, Front Desk, F&B, Security")
    email: EmailStr
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    password: str = Field(..., min_length=6)


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    employee_id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# BOOKING SCHEMAS
# ==========================================

class BookingBase(BaseModel):
    guest_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    room_number: str = Field(..., max_length=50)
    check_in_date: datetime
    check_out_date: datetime
    booking_status: str = Field(default="CONFIRMED", max_length=50)


class BookingCreate(BookingBase):
    pass


class BookingResponse(BookingBase):
    booking_id: int
    current_otp: Optional[str] = None
    otp_expires_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# EMERGENCY ALERT SCHEMAS
# ==========================================

class EmergencyAlertBase(BaseModel):
    initiator_role: str = Field(..., max_length=50)
    location: str = Field(..., max_length=255)
    alert_type: str = Field(..., max_length=100, description="e.g. FIRE, MEDICAL, SECURITY, WEATHER")
    message: str


class EmergencyAlertCreate(EmergencyAlertBase):
    is_active: bool = True


class EmergencyBroadcastRequest(BaseModel):
    location: str
    alert_type: str = Field(..., description="e.g. FIRE, MEDICAL, SECURITY, WEATHER")
    message: str


class EmergencyAlertResponse(EmergencyAlertBase):
    alert_id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# SERVICE TICKET SCHEMAS
# ==========================================

class ServiceTicketBase(BaseModel):
    guest_id: Optional[int] = None
    location: str = Field(..., max_length=255)
    issue_category: str = Field(..., max_length=100)
    assigned_department: str = Field(..., max_length=100)
    assigned_employee_id: Optional[int] = None
    status: str = Field(default="OPEN", max_length=50)
    sla_deadline: Optional[datetime] = None


class ServiceTicketCreate(BaseModel):
    guest_id: Optional[int] = None
    location: str
    issue_category: str
    assigned_department: str
    assigned_employee_id: Optional[int] = None
    sla_deadline: Optional[datetime] = None


class ServiceTicketUpdate(BaseModel):
    status: Optional[str] = None
    assigned_employee_id: Optional[int] = None
    assigned_department: Optional[str] = None
    sla_deadline: Optional[datetime] = None


class ServiceTicketResponse(ServiceTicketBase):
    ticket_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# GUEST FOLIO SCHEMAS
# ==========================================

class GuestFolioBase(BaseModel):
    booking_id: int
    room_number: str = Field(..., max_length=50)
    service_category: str = Field(..., max_length=100)
    item_description: str = Field(..., max_length=255)
    amount: float = Field(..., ge=0.0)
    payment_status: str = Field(default="PENDING", max_length=50)


class GuestFolioCreate(GuestFolioBase):
    pass


class GuestFolioResponse(GuestFolioBase):
    folio_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# AMENITY SCHEMAS
# ==========================================

class AmenityBase(BaseModel):
    name: str = Field(..., max_length=255)
    category: str = Field(..., max_length=100)
    status: str = Field(default="FREE", max_length=50)
    max_duration_minutes: int = Field(default=60, gt=0)


class AmenityCreate(AmenityBase):
    pass


class AmenityResponse(AmenityBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# AMENITY WAITLIST SCHEMAS
# ==========================================

class AmenityWaitlistBase(BaseModel):
    amenity_id: int
    guest_id: int
    status: str = Field(default="WAITING", max_length=50)


class AmenityWaitlistCreate(AmenityWaitlistBase):
    pass


class AmenityWaitlistResponse(AmenityWaitlistBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AmenityEscalateRequest(BaseModel):
    waitlist_id: int
    target_phone: str = Field(..., description="E.164 phone number e.g. +1234567890")


# ==========================================
# GUEST CHAT & AGENT SCHEMAS
# ==========================================

class GuestChatRequest(BaseModel):
    guest_id: Optional[int] = None
    message: str = Field(..., min_length=1)
    location: Optional[str] = "Room"


class GuestChatResponse(BaseModel):
    reply: str
    department_routed: Optional[str] = None
    ticket_created: Optional[bool] = False
    ticket_id: Optional[int] = None
    sla_deadline: Optional[datetime] = None


# ==========================================
# FORECAST SCHEMAS
# ==========================================

class ForecastRequest(BaseModel):
    prediction_length: int = Field(default=14, ge=1, le=90, description="Forecast horizon in days")


class DailyForecast(BaseModel):
    date: str
    predicted_occupancy: float
    lower_bound: float
    upper_bound: float


class ForecastResponse(BaseModel):
    forecast_horizon_days: int
    generated_at: datetime
    forecasts: List[DailyForecast]
    summary: Dict[str, Any]


# Detailed composite responses
class BookingDetailResponse(BookingResponse):
    guest_folios: List[GuestFolioResponse] = []
    service_tickets: List[ServiceTicketResponse] = []
    waitlist_entries: List[AmenityWaitlistResponse] = []

    model_config = ConfigDict(from_attributes=True)
