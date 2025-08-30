from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class AuditAction(str, enum.Enum):
    CREATED = "created"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    MODIFIED = "modified"


class LeaveRequestAudit(Base):
    __tablename__ = "leave_request_audits"
    
    id = Column(Integer, primary_key=True, index=True)
    leave_request_id = Column(Integer, ForeignKey("leave_requests.id"), nullable=False)
    action = Column(Enum(AuditAction), nullable=False)
    performed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    old_status = Column(String, nullable=True)  # Previous status
    new_status = Column(String, nullable=True)  # New status
    comments = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    leave_request = relationship("LeaveRequest", back_populates="audit_logs")
    performed_by = relationship("User")
    
    def __repr__(self):
        return f"<LeaveRequestAudit(id={self.id}, action='{self.action}', leave_request_id={self.leave_request_id})>"

