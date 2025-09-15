from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import date, datetime
from app.models.leave_audit import AuditAction
from enum import Enum
from app.models.enums import LeaveDurationType, LeaveTypeCategory, LeaveStatus

class LeaveDurationType(str, Enum):
    """Types of leave duration"""
    FULL_DAY = "full_day"
    HALF_DAY = "half_day"
    HOURLY = "hourly"


class LeaveTypeCategory(str, Enum):
    """Categories of leave types"""
    CASUAL = "casual"
    SICK = "sick"
    PAID = "paid"
    UNPAID = "unpaid"
    MATERNITY = "maternity"
    PATERNITY = "paternity"
    BEREAVEMENT = "bereavement"


class LeaveTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: LeaveTypeCategory
    default_balance: int
    allow_carry_forward: bool = False
    max_carry_forward: int = 0
    color_code: Optional[str] = None
    # New fields for enhanced leave type management
    allow_half_day: bool = True
    allow_hourly: bool = False
    max_consecutive_days: int = 30
    requires_approval: bool = True
    can_exceed_balance: bool = False  # For sick leave with medical proof
    requires_documentation: bool = False  # For sick/maternity leave


class LeaveTypeCreate(LeaveTypeBase):
    pass


class LeaveTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[LeaveTypeCategory] = None
    default_balance: Optional[int] = None
    allow_carry_forward: Optional[bool] = None
    max_carry_forward: Optional[int] = None
    color_code: Optional[str] = None
    allow_half_day: Optional[bool] = None
    allow_hourly: Optional[bool] = None
    max_consecutive_days: Optional[int] = None
    requires_approval: Optional[bool] = None
    can_exceed_balance: Optional[bool] = None
    requires_documentation: Optional[bool] = None
    is_active: Optional[bool] = None


class LeaveTypeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    category: str
    default_balance: int
    allow_carry_forward: bool
    max_carry_forward: int
    color_code: Optional[str] = None
    is_active: bool
    allow_half_day: bool
    allow_hourly: bool
    max_consecutive_days: int
    requires_approval: bool
    can_exceed_balance: bool
    requires_documentation: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        orm_mode = True

class LeaveRequestBase(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    duration_type: LeaveDurationType = LeaveDurationType.FULL_DAY
    start_half: Optional[str] = None  # "morning" or "afternoon" for half-day
    hours: Optional[float] = None  # For hourly leaves
    reason: str
    # New fields for enhanced leave management
    medical_proof: Optional[str] = None  # For sick leave exceeding balance
    documentation: Optional[str] = None  # For leaves requiring documentation
    
    @validator('start_date')
    def validate_start_date_not_in_past(cls, v):
        """Validate that start date is not in the past"""
        today = date.today()
        if v < today:
            raise ValueError('Start date cannot be in the past')
        return v
    
    @validator('start_date')
    def validate_start_date_not_too_far_in_future(cls, v):
        """Validate that start date is not more than 1 year in the future"""
        today = date.today()
        max_future_date = today.replace(year=today.year + 1)
        if v > max_future_date:
            raise ValueError('Start date cannot be more than 1 year in the future')
        return v
    
    @validator('end_date')
    def validate_end_date_after_start_date(cls, v, values):
        """Validate that end date is after start date"""
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('End date must be after start date')
        return v
    
    @validator('end_date')
    def validate_end_date_not_too_far_in_future(cls, v):
        """Validate that end date is not more than 1 year in the future"""
        today = date.today()
        max_future_date = today.replace(year=today.year + 1)
        if v > max_future_date:
            raise ValueError('End date cannot be more than 1 year in the future')
        return v
    
    @validator('reason')
    def validate_reason_length(cls, v):
        """Validate reason length (minimum 10 characters, maximum 500 characters)"""
        if len(v.strip()) < 10:
            raise ValueError('Reason must be at least 10 characters long')
        if len(v) > 500:
            raise ValueError('Reason cannot exceed 500 characters')
        return v.strip()
    
    @validator('start_date', 'end_date')
    def validate_not_weekend(cls, v):
        """Validate that dates are not weekends (optional - can be overridden)"""
        # This is a soft validation - weekends are allowed but logged
        if v.weekday() >= 5:  # Saturday = 5, Sunday = 6
            # Just log a warning, don't raise error
            # In production, you might want to make this configurable
            pass
        return v
    
    @validator('start_half')
    def validate_start_half_for_half_day(cls, v, values):
        """Validate start_half is provided for half-day leaves"""
        if 'duration_type' in values and values['duration_type'] == LeaveDurationType.HALF_DAY:
            if not v or v not in ['morning', 'afternoon']:
                raise ValueError('start_half must be "morning" or "afternoon" for half-day leaves')
        return v
    
    @validator('hours')
    def validate_hours_for_hourly_leave(cls, v, values):
        """Validate hours is provided for hourly leaves"""
        if 'duration_type' in values and values['duration_type'] == LeaveDurationType.HOURLY:
            if not v or v <= 0 or v > 8:
                raise ValueError('hours must be between 0 and 8 for hourly leaves')
        return v
    
    @validator('medical_proof')
    def validate_medical_proof_for_sick_leave(cls, v, values):
        """Validate medical proof for sick leave exceeding balance"""
        # This will be validated in the service layer based on leave type
        return v
    
    @validator('documentation')
    def validate_documentation_requirement(cls, v, values):
        """Validate documentation for leaves requiring it"""
        # This will be validated in the service layer based on leave type
        return v


class LeaveRequestCreate(LeaveRequestBase):
    pass


class LeaveRequestUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_type: Optional[LeaveDurationType] = None
    start_half: Optional[str] = None
    hours: Optional[float] = None
    reason: Optional[str] = None
    medical_proof: Optional[str] = None
    documentation: Optional[str] = None
    
    @validator('start_date')
    def validate_start_date_not_in_past(cls, v):
        """Validate that start date is not in the past"""
        if v is not None:
            today = date.today()
            if v < today:
                raise ValueError('Start date cannot be in the past')
        return v
    
    @validator('start_date')
    def validate_start_date_not_too_far_in_future(cls, v):
        """Validate that start date is not more than 1 year in the future"""
        if v is not None:
            today = date.today()
            max_future_date = today.replace(year=today.year + 1)
            if v > max_future_date:
                raise ValueError('Start date cannot be more than 1 year in the future')
        return v
    
    @validator('end_date')
    def validate_end_date_after_start_date(cls, v, values):
        """Validate that end date is after start date"""
        if v is not None and 'start_date' in values:
            start_date = values['start_date']
            if start_date and v < start_date:
                raise ValueError('End date must be after start date')
        return v
    
    @validator('end_date')
    def validate_end_date_not_too_far_in_future(cls, v):
        """Validate that end date is not more than 1 year in the future"""
        if v is not None:
            today = date.today()
            max_future_date = today.replace(year=today.year + 1)
            if v > max_future_date:
                raise ValueError('End date cannot be more than 1 year in the future')
        return v
    
    @validator('reason')
    def validate_reason_length(cls, v):
        """Validate reason length (minimum 10 characters, maximum 500 characters)"""
        if v is not None:
            if len(v.strip()) < 10:
                raise ValueError('Reason must be at least 10 characters long')
            if len(v) > 500:
                raise ValueError('Reason cannot exceed 500 characters')
            return v.strip()
        return v
    
    @validator('start_half')
    def validate_start_half_for_half_day(cls, v, values):
        """Validate start_half is provided for half-day leaves"""
        if v is not None and 'duration_type' in values and values['duration_type'] == LeaveDurationType.HALF_DAY:
            if v not in ['morning', 'afternoon']:
                raise ValueError('start_half must be "morning" or "afternoon" for half-day leaves')
        return v
    
    @validator('hours')
    def validate_hours_for_hourly_leave(cls, v, values):
        """Validate hours is provided for hourly leaves"""
        if v is not None and 'duration_type' in values and values['duration_type'] == LeaveDurationType.HOURLY:
            if v <= 0 or v > 8:
                raise ValueError('hours must be between 0 and 8 for hourly leaves')
        return v


class LeaveRequestResponse(LeaveRequestBase):
    id: int
    employee_id: int
    number_of_days: float  # Changed to float to support half-days and hours
    status: LeaveStatus
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True



class LeaveBalanceResponse(BaseModel):
    id: int
    leave_type_id: int
    leave_type_name: str
    leave_type_category: LeaveTypeCategory
    year: int
    allocated_days: int
    used_days: float
    pending_days: float
    carried_forward_days: int
    available_balance: float
    
    class Config:
        from_attributes = True


class LeaveAuditResponse(BaseModel):
    id: int
    leave_request_id: int
    action: AuditAction
    performed_by_id: int
    performed_by_name: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comments: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class HolidayBase(BaseModel):
    date: date
    name: str
    description: Optional[str] = None
    is_recurring: bool = True  # Recurring yearly holidays


class HolidayCreate(HolidayBase):
    pass


class HolidayResponse(HolidayBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

