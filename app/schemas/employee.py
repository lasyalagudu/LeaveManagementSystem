from pydantic import BaseModel, validator
from typing import Optional
from datetime import date, datetime


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    department: str
    designation: str
    joining_date: date
    manager_id: Optional[int] = None

class UserInfo(BaseModel):
    email: str
    role: str

    class Config:
        orm_mode = True
class EmployeeCreate(EmployeeBase):
    email: str
    employee_id: str  # Company employee ID


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    manager_id: Optional[int] = None


class EmployeeResponse(EmployeeBase):
    id: int
    user_id: int
    employee_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: UserInfo
    class Config:
        orm_mode = True


class EmployeeOnboard(BaseModel):
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    department: str
    designation: str
    joining_date: date
    employee_id: str
    manager_id: Optional[int] = None


class EmployeeCreateResponse(EmployeeResponse):
    """Response after creating an employee; inherits all fields from EmployeeResponse"""
    pass
