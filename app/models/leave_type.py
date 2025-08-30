from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base
from app.schemas.leave import LeaveTypeCategory
from sqlalchemy.orm import relationship
from app.models.enums import LeaveTypeCategory

class LeaveType(Base):
    __tablename__ = "leave_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, default=LeaveTypeCategory.CASUAL.value)
    default_balance = Column(Integer, nullable=False, default=0)
    allow_carry_forward = Column(Boolean, default=False)
    max_carry_forward = Column(Integer, default=0)
    color_code = Column(String(7), nullable=True)  # Hex color code
    is_active = Column(Boolean, default=True)
    
    # New fields for enhanced leave type management
    allow_half_day = Column(Boolean, default=True)
    allow_hourly = Column(Boolean, default=False)
    max_consecutive_days = Column(Integer, default=30)
    requires_approval = Column(Boolean, default=True)
    can_exceed_balance = Column(Boolean, default=False)  # For sick leave with medical proof
    requires_documentation = Column(Boolean, default=False)  # For sick/maternity leave
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    leave_balances = relationship("EmployeeLeaveBalance", back_populates="leave_type")
    leave_requests = relationship("LeaveRequest", back_populates="leave_type")  # NEW


