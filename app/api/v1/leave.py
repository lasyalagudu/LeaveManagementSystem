from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.api.deps import get_current_user, get_hr_or_super_admin, get_super_admin
from app.models.user import User, UserRole
from app.schemas.leave import (
    LeaveTypeCreate, LeaveTypeUpdate, LeaveTypeResponse,
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse,
    LeaveBalanceResponse, LeaveAuditResponse, HolidayBase, HolidayCreate, HolidayResponse
)
from app.services.leave_service import LeaveService
from app.services.employee_service import EmployeeService
from app.schemas.leave import LeaveTypeResponse
from app.models import LeaveType

router = APIRouter()
leave_service = LeaveService()
employee_service = EmployeeService()

# Leave Type Management (HR and Super Admin only)
@router.post("/leave-types", response_model=LeaveTypeResponse, status_code=status.HTTP_201_CREATED)
def create_leave_type(
    leave_type_data: LeaveTypeCreate,
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    """Create a new leave type (HR and Super Admin only)"""
    try:
        leave_type = leave_service.create_leave_type(db, leave_type_data, current_user)
        print("DB Object:", leave_type.__dict__)  
        return leave_type
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/leave-types", response_model=List[LeaveTypeResponse])
def get_leave_types(db: Session = Depends(get_db)):
    leave_types = db.query(LeaveType).all()
    return [LeaveTypeResponse.from_orm(lt) for lt in leave_types]


@router.get("/leave-types/{leave_type_id}", response_model=LeaveTypeResponse)
def get_leave_type(
    leave_type_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific leave type by ID (public endpoint)"""
    leave_type = leave_service.get_leave_type_by_id(db, leave_type_id)
    if not leave_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")
    return leave_type

@router.put("/leave-types/{leave_type_id}", response_model=LeaveTypeResponse)
def update_leave_type(
    leave_type_id: int,
    leave_type_data: LeaveTypeUpdate,
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    """Update a leave type (HR and Super Admin only)"""
    try:
        leave_type = leave_service.update_leave_type(db, leave_type_id, leave_type_data, current_user)
        if not leave_type:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")
        return leave_type
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
# Leave Request Management
@router.post("/leave-requests", response_model=LeaveRequestResponse, status_code=status.HTTP_201_CREATED)
def create_leave_request(
    leave_request_data: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new leave request (Employees only)"""
    try:
        leave_request = leave_service.create_leave_request(db, leave_request_data, current_user)
        return leave_request
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/leave-requests", response_model=List[LeaveRequestResponse])
def get_leave_requests(
    employee_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get leave requests with role-based access control"""
    try:
        if employee_id:
            return leave_service.get_leave_requests_by_employee(db, employee_id, current_user)
        else:
            # HR and Super Admin can see all requests
            if current_user.role in [UserRole.HR, UserRole.SUPER_ADMIN]:
                return db.query(LeaveRequest).all()
            else:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/leave-requests/pending", response_model=List[LeaveRequestResponse])
def get_pending_leave_requests(
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    """Get all pending leave requests (HR and Super Admin only)"""
    try:
        return leave_service.get_pending_leave_requests(db, current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/leave-requests/{request_id}", response_model=LeaveRequestResponse)
def get_leave_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific leave request with role-based access control"""
    try:
        # Check if user has access to this request
        if current_user.role == UserRole.EMPLOYEE:
            leave_request = leave_service.get_my_leave_request_by_id(db, request_id, current_user)
        else:
            leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
        
        if not leave_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
        
        return leave_request
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.put("/leave-requests/{request_id}/approve", response_model=LeaveRequestResponse)
def approve_leave_request(
    request_id: int,
    comments: str = None,
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    """Approve a leave request (HR and Super Admin only)"""
    try:
        leave_request = leave_service.approve_leave_request(db, request_id, current_user, comments)
        if not leave_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
        return leave_request
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.put("/leave-requests/{request_id}/reject", response_model=LeaveRequestResponse)
def reject_leave_request(
    request_id: int,
    rejection_reason: str,
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    """Reject a leave request (HR and Super Admin only)"""
    try:
        leave_request = leave_service.reject_leave_request(db, request_id, current_user, rejection_reason)
        if not leave_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
        return leave_request
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.put("/leave-requests/{request_id}/cancel", response_model=LeaveRequestResponse)
def cancel_leave_request(
    request_id: int,
    comments: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a leave request (Owner, HR, or Super Admin)"""
    try:
        leave_request = leave_service.cancel_leave_request(db, request_id, current_user, comments)
        if not leave_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
        return leave_request
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

# Audit Logs (update route path)
@router.get("/leave-requests/{request_id}/audit", response_model=List[LeaveAuditResponse])
def get_leave_audit_logs(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get audit logs for a leave request with role-based access control"""
    try:
        return leave_service.get_leave_audit_logs(db, request_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

# Employee-specific endpoints (optional renaming for consistency)
@router.get("/my-requests", response_model=List[LeaveRequestResponse])
def get_my_leave_requests(
    status_filter: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current employee's leave requests with optional status filtering"""
    try:
        return leave_service.get_my_leave_requests(db, current_user, status_filter)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/my-requests/{request_id}", response_model=LeaveRequestResponse)
def get_my_leave_request_by_id(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific leave request for current employee"""
    try:
        leave_request = leave_service.get_my_leave_request_by_id(db, request_id, current_user)
        if not leave_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
        return leave_request
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.put("/my-requests/{request_id}", response_model=LeaveRequestResponse)
def modify_my_leave_request(
    request_id: int,
    update_data: LeaveRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modify own leave request (Employee only)"""
    try:
        leave_request = leave_service.modify_my_leave_request(db, request_id, update_data, current_user)
        if not leave_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
        return leave_request
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.put("/my-requests/{request_id}/cancel", response_model=LeaveRequestResponse)
def cancel_my_leave_request(
    request_id: int,
    comments: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel own leave request (Employee only)"""
    try:
        leave_request = leave_service.cancel_my_leave_request(db, request_id, current_user, comments)
        if not leave_request:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
        return leave_request
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

# Leave Balance Management
@router.get("/balances", response_model=List[LeaveBalanceResponse])
def get_leave_balances(
    employee_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get leave balances with role-based access control"""
    try:
        if employee_id:
            # Check if user has access to this employee's balances
            if current_user.role == UserRole.EMPLOYEE:
                employee = employee_service.get_employee_by_user_id(db, current_user.id)
                if not employee or employee.id != employee_id:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own balances")
            elif current_user.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
            
            return employee_service.get_leave_balances(db, employee_id)
        else:
            # HR and Super Admin can see all balances
            if current_user.role in [UserRole.HR, UserRole.SUPER_ADMIN]:
                return employee_service.get_all_leave_balances(db)
            else:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/my-balances", response_model=List[LeaveBalanceResponse])
def get_my_leave_balances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current employee's leave balances"""
    try:
        employee = employee_service.get_employee_by_user_id(db, current_user.id)
        if not employee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee record not found")
        
        return employee_service.get_leave_balances(db, employee.id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

# Audit Logs
@router.get("/requests/{request_id}/audit", response_model=List[LeaveAuditResponse])
def get_leave_audit_logs(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get audit logs for a leave request with role-based access control"""
    try:
        return leave_service.get_leave_audit_logs(db, request_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

# Holiday Management (HR and Super Admin only)
@router.post("/holidays", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
def create_holiday(
    holiday_data: HolidayCreate,
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    """Create a new holiday (HR and Super Admin only)"""
    try:
        holiday = leave_service.create_holiday(db, holiday_data, current_user)
        return holiday
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/holidays", response_model=List[HolidayResponse])
def get_holidays(
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """Get holidays within a date range (public endpoint)"""
    try:
        from datetime import datetime
        start = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else None
        end = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else None
        
        return leave_service.get_holidays(db, start, end)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/holidays/{holiday_id}", response_model=HolidayResponse)
def get_holiday(
    holiday_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific holiday by ID (public endpoint)"""
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holiday not found")
    return holiday

@router.put("/holidays/{holiday_id}", response_model=HolidayResponse)
def update_holiday(
    holiday_id: int,
    holiday_data: HolidayBase,
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    """Update a holiday (HR and Super Admin only)"""
    try:
        holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
        if not holiday:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holiday not found")
        
        # Update fields
        for field, value in holiday_data.dict(exclude_unset=True).items():
            setattr(holiday, field, value)
        
        db.commit()
        db.refresh(holiday)
        return holiday
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.delete("/holidays/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holiday(
    holiday_id: int,
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    """Delete a holiday (HR and Super Admin only)"""
    try:
        holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
        if not holiday:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holiday not found")
        
        db.delete(holiday)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
