from datetime import datetime, date
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging
from app.schemas.user import UserCreate
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.leave_type import LeaveType
from app.models.leave_balance import EmployeeLeaveBalance
from app.schemas.employee import EmployeeOnboard, EmployeeUpdate
from app.services.user_service import UserService
from app.services.email_service import EmailService
from app.schemas.employee import EmployeeOnboard
from app.models.employee import Employee
logger = logging.getLogger(__name__)
import uuid
import secrets
class EmployeeService:
    def __init__(self):
        self.user_service = UserService()
        self.email_service = EmailService()
    
    
        
    async def onboard_employee(self, db: Session, employee_data: EmployeeOnboard, created_by: User) -> tuple[Employee, str]:
        if created_by.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
            raise ValueError("Only HR or Super Admin can onboard employees")

        try:
            # Generate a temporary password
            temp_password = secrets.token_urlsafe(8)  # random 8-character password

            # Create user
            user_create = UserCreate(
                email=employee_data.email,
                first_name=employee_data.first_name,
                last_name=employee_data.last_name,
                role=UserRole.EMPLOYEE,
                password=temp_password
            )
            user = self.user_service.create_user(db, user_create)

            # Create employee
            employee = Employee(
                user_id=user.id,
                employee_id=employee_data.employee_id,
                first_name=employee_data.first_name,
                last_name=employee_data.last_name,
                phone=employee_data.phone,
                department=employee_data.department,
                designation=employee_data.designation,
                joining_date=employee_data.joining_date,
                manager_id=employee_data.manager_id
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)

            # Initialize leave balances
            self._initialize_leave_balances(db, employee.id, employee_data.joining_date.year)

            # ✅ Return employee and temp password; email will be sent from route
            return employee, temp_password

        except IntegrityError as e:
            db.rollback()
            logger.error(f"DB error onboarding employee: {e}")
            raise ValueError("Failed to onboard employee due to database constraint")
        except Exception as e:
            db.rollback()
            logger.error(f"Error onboarding employee: {e}")
            raise

    def get_employee_by_employee_id(self, db: Session, employee_id: str):
        from app.models.employee import Employee
        return db.query(Employee).filter(Employee.employee_id == employee_id).first()


    def _initialize_leave_balances(self, db: Session, employee_id: int, year: int):
        leave_types = db.query(LeaveType).filter(LeaveType.is_active==True).all()
        employee = db.query(Employee).filter(Employee.id==employee_id).first()
        if not employee:
            return
        for leave_type in leave_types:
            days_remaining = (date(year, 12, 31) - employee.joining_date).days + 1
            pro_rated_balance = round((leave_type.default_balance * days_remaining)/365, 2)
            balance = EmployeeLeaveBalance(
                employee_id=employee_id,
                leave_type_id=leave_type.id,
                year=year,
                allocated_days=pro_rated_balance,
                available_balance=pro_rated_balance
            )
            db.add(balance)
        db.commit()

    def get_employee_by_id(self, db: Session, employee_id: int) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.id == employee_id).first()

    def get_employee_by_user_id(self, db: Session, user_id: int) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.user_id == user_id).first()

    def get_employee_by_employee_id(self, db: Session, employee_id: str) -> Optional[Employee]:
        return db.query(Employee).filter(Employee.employee_id == employee_id).first()

    def get_all_employees(self, db: Session, skip: int = 0, limit: int = 100) -> List[Employee]:
        return db.query(Employee).offset(skip).limit(limit).all()

    def update_employee(self, db: Session, employee_id: int, employee_data: EmployeeUpdate) -> Optional[Employee]:
        employee = self.get_employee_by_id(db, employee_id)
        if not employee:
            return None
        
        update_data = employee_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(employee, field, value)
        
        employee.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(employee)
        return employee

    def get_employee_leave_balances(self, db: Session, employee_id: int, year: Optional[int] = None) -> List[EmployeeLeaveBalance]:
        if not year:
            year = datetime.utcnow().year
        return db.query(EmployeeLeaveBalance).filter(
            EmployeeLeaveBalance.employee_id == employee_id,
            EmployeeLeaveBalance.year == year
        ).all()

    def carry_forward_leaves(self, db: Session, employee_id: int, from_year: int, to_year: int) -> bool:
        """Carry forward leaves for all leave types that allow it"""
        try:
            from_balances = self.get_employee_leave_balances(db, employee_id, from_year)
            for balance in from_balances:
                leave_type = db.query(LeaveType).filter(LeaveType.id == balance.leave_type_id).first()
                if not leave_type or not leave_type.allow_carry_forward:
                    continue

                carry_forward_amount = min(balance.available_balance, leave_type.max_carry_forward)
                if carry_forward_amount <= 0:
                    continue

                to_balance = db.query(EmployeeLeaveBalance).filter(
                    EmployeeLeaveBalance.employee_id == employee_id,
                    EmployeeLeaveBalance.leave_type_id == balance.leave_type_id,
                    EmployeeLeaveBalance.year == to_year
                ).first()
                
                if not to_balance:
                    to_balance = EmployeeLeaveBalance(
                        employee_id=employee_id,
                        leave_type_id=balance.leave_type_id,
                        year=to_year,
                        allocated_days=leave_type.default_balance,
                        carried_forward_days=carry_forward_amount,
                        available_balance=leave_type.default_balance + carry_forward_amount
                    )
                    db.add(to_balance)
                else:
                    to_balance.carried_forward_days = carry_forward_amount
                    to_balance.available_balance = to_balance.allocated_days + carry_forward_amount

            db.commit()
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error carrying forward leaves: {e}")
            return False

    def get_employee_profile(self, db: Session, employee_id: int, requesting_user: User) -> Optional[Employee]:
        """Get employee profile with role-based access control"""
        employee = self.get_employee_by_id(db, employee_id)
        if not employee:
            return None
        
        # Super Admin can access all profiles
        if requesting_user.role == UserRole.SUPER_ADMIN:
            return employee
        
        # HR can access employee profiles
        if requesting_user.role == UserRole.HR:
            return employee

        # Employees can access only their own profile
        if requesting_user.role == UserRole.EMPLOYEE and employee.user_id == requesting_user.id:
            return employee

        return None







