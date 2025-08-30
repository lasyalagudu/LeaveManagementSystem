from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.enums import LeaveStatus, LeaveDurationType  # <-- updated import
from enum import Enum



class LeaveStatus(str, Enum):
    """Status of leave requests"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    duration_type = Column(String(20), nullable=False, default=LeaveDurationType.FULL_DAY.value)
    start_half = Column(String(20), nullable=True)  # "morning" or "afternoon" for half-day
    hours = Column(Float, nullable=True)  # For hourly leaves
    number_of_days = Column(Float, nullable=False)  # Changed to float to support half-days and hours
    reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default=LeaveStatus.PENDING.value)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # New fields for enhanced leave management
    medical_proof = Column(Text, nullable=True)  # For sick leave exceeding balance
    documentation = Column(Text, nullable=True)  # For leaves requiring documentation
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    employee = relationship("Employee", back_populates="leave_requests")
    leave_type = relationship("LeaveType", back_populates="leave_requests")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    audit_logs = relationship("LeaveRequestAudit", back_populates="leave_request")
    
    def __repr__(self):
        return f"<LeaveRequest(id={self.id}, employee_id={self.employee_id}, status='{self.status}')>"
