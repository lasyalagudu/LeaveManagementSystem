from enum import Enum

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
    EARNED = "earned"   # ← Add since you already used it in DB seeding


class LeaveStatus(str, Enum):
    """Status of a leave request"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
