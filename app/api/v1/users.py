from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi import BackgroundTasks
import logging

from app.database import get_db
from app.services.user_service import UserService
from app.services.employee_service import EmployeeService
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.employee import EmployeeOnboard, EmployeeResponse
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.api.deps import get_super_admin, get_hr_or_super_admin, get_any_authenticated_user
from app.schemas.user import UserPasswordChange
from app.api.deps import get_any_authenticated_user
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])
user_service = UserService()
employee_service = EmployeeService()

# -----------------------------
# ✅ FIRST: /me endpoint to avoid conflict with /{user_id}
# -----------------------------
@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_any_authenticated_user)):
    """Get current user's profile"""
    return UserResponse.from_orm(current_user)


# -----------------------------
# Create new user (Super Admin only)
# -----------------------------
@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    try:
        if user_data.role == UserRole.HR:
            user = user_service.create_hr_user(db, user_data, current_user)
        else:
            user = user_service.create_user(db, user_data)

        if not user:
            raise HTTPException(status_code=400, detail="Failed to create user")
        return user

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/me/password")
async def change_own_password(
    password_data: UserPasswordChange,
    current_user: User = Depends(get_any_authenticated_user),
    db: Session = Depends(get_db)
):
    """Change current user's password"""
    try:
        success = user_service.change_password(
            db,
            user_id=current_user.id,
            current_password=password_data.old_password,
            new_password=password_data.new_password
        )
        if not success:
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        return {"message": "Password changed successfully"}

    except Exception as e:
        logger.error(f"Password change error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# -----------------------------
# Employee onboarding (HR or Super Admin)
# -----------------------------
@router.post("/employees/onboard", response_model=EmployeeResponse)
async def onboard_employee_route(
    employee_data: EmployeeOnboard,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    try:
        employee, temp_password = await employee_service.onboard_employee(db, employee_data, current_user)

        background_tasks.add_task(
            employee_service.email_service.send_welcome_email,
            employee.user,
            temp_password
        )

        return employee

    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error onboarding employee: {e}")
        raise HTTPException(status_code=500, detail="Failed to onboard employee")


# -----------------------------
# Get all employees (HR or Super Admin)
# -----------------------------
@router.get("/employees/list", response_model=List[EmployeeResponse])
async def list_employees(
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    try:
        return employee_service.get_all_employees(db)
    except Exception as e:
        logger.error(f"Error getting employee users: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# -----------------------------
# Get HR users
# -----------------------------
@router.get("/hr", response_model=List[UserResponse])
async def get_hr_users(
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    try:
        return user_service.get_users_by_role(db, UserRole.HR)
    except Exception as e:
        logger.error(f"Error getting HR users: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# -----------------------------
# Get employee by employee ID
# -----------------------------
@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


# -----------------------------
# Get all employee users (HR or Super Admin)
# -----------------------------
@router.get("/employees", response_model=List[UserResponse])
async def get_employee_users(
    current_user: User = Depends(get_hr_or_super_admin),
    db: Session = Depends(get_db)
):
    try:
        return user_service.get_users_by_role(db, UserRole.EMPLOYEE)
    except Exception as e:
        logger.error(f"Error getting employee users: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# -----------------------------
# ✅ This route MUST come after `/me`
# Get user by ID
# -----------------------------
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_any_authenticated_user),
    db: Session = Depends(get_db)
):
    try:
        user = user_service.get_user_profile(db, user_id, current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# -----------------------------
# Update user (Super Admin only)
# -----------------------------
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    try:
        user = user_service.update_user(db, user_id, user_data)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# -----------------------------
# Deactivate user (Super Admin only)
# -----------------------------
@router.delete("/{user_id}")
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    try:
        if user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

        success = user_service.deactivate_user(db, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User deactivated successfully"}
    except Exception as e:
        logger.error(f"Error deactivating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# -----------------------------
# Activate user (Super Admin only)
# -----------------------------
@router.post("/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_super_admin),
    db: Session = Depends(get_db)
):
    try:
        success = user_service.activate_user(db, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User activated successfully"}
    except Exception as e:
        logger.error(f"Error activating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
