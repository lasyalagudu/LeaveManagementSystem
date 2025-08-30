import os
import sys
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, User, Employee, LeaveType, EmployeeLeaveBalance, Holiday
from app.models.user import UserRole
from app.schemas.leave import LeaveTypeCategory
from app.services.auth_service import AuthService
from app.services.employee_service import EmployeeService
from app.services.leave_service import LeaveService
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_holidays(db: Session):
    """Seed common holidays"""
    logger.info("Seeding holidays...")
    
    # Check if holidays already exist
    existing_holidays = db.query(Holiday).count()
    if existing_holidays > 0:
        logger.info("Holidays already exist, skipping...")
        return
    
    # Common holidays (you can customize these for your company)
    holidays = [
        {
            "date": date(2024, 1, 1),
            "name": "New Year's Day",
            "description": "New Year's Day",
            "is_recurring": True
        },
        {
            "date": date(2024, 1, 26),
            "name": "Republic Day",
            "description": "Republic Day of India",
            "is_recurring": True
        },
        {
            "date": date(2024, 8, 15),
            "name": "Independence Day",
            "description": "Independence Day of India",
            "is_recurring": True
        },
        {
            "date": date(2024, 10, 2),
            "name": "Gandhi Jayanti",
            "description": "Birthday of Mahatma Gandhi",
            "is_recurring": True
        },
        {
            "date": date(2024, 12, 25),
            "name": "Christmas Day",
            "description": "Christmas Day",
            "is_recurring": True
        }
    ]
    
    for holiday_data in holidays:
        holiday = Holiday(**holiday_data)
        db.add(holiday)
    
    db.commit()
    logger.info(f"Seeded {len(holidays)} holidays")

def seed_leave_types(db: Session):
    """Seed default leave types"""
    logger.info("Seeding leave types...")
    
    # Check if leave types already exist
    existing_types = db.query(LeaveType).count()
    if existing_types > 0:
        logger.info("Leave types already exist, skipping...")
        return
    
    leave_types = [
        {
            "name": "Casual Leave",
            "description": "Short-term personal leave",
            "category": LeaveTypeCategory.CASUAL.value,
            "default_balance": 12,
            "allow_carry_forward": True,
            "max_carry_forward": 6,
            "color_code": "#FF6B6B",
            "allow_half_day": True,
            "allow_hourly": False,
            "max_consecutive_days": 5,
            "requires_approval": True,
            "can_exceed_balance": False,
            "requires_documentation": False
        },
        {
            "name": "Sick Leave",
            "description": "Medical leave with documentation",
            "category": LeaveTypeCategory.SICK.value,
            "default_balance": 15,
            "allow_carry_forward": True,
            "max_carry_forward": 10,
            "color_code": "#4ECDC4",
            "allow_half_day": True,
            "allow_hourly": False,
            "max_consecutive_days": 30,
            "requires_approval": True,
            "can_exceed_balance": True,  # Can exceed with medical proof
            "requires_documentation": True
        },
        {
            "name": "Annual Leave",
            "description": "Paid vacation leave",
            "category": LeaveTypeCategory.PAID.value,
            "default_balance": 21,
            "allow_carry_forward": True,
            "max_carry_forward": 15,
            "color_code": "#45B7D1",
            "allow_half_day": False,
            "allow_hourly": False,
            "max_consecutive_days": 30,
            "requires_approval": True,
            "can_exceed_balance": False,
            "requires_documentation": False
        },
        {
            "name": "Maternity Leave",
            "description": "Maternity leave for expecting mothers",
            "category": LeaveTypeCategory.MATERNITY.value,
            "default_balance": 180,
            "allow_carry_forward": False,
            "max_carry_forward": 0,
            "color_code": "#96CEB4",
            "allow_half_day": False,
            "allow_hourly": False,
            "max_consecutive_days": 180,
            "requires_approval": True,
            "can_exceed_balance": False,
            "requires_documentation": True
        },
        {
            "name": "Paternity Leave",
            "description": "Paternity leave for new fathers",
            "category": LeaveTypeCategory.PATERNITY.value,
            "default_balance": 15,
            "allow_carry_forward": False,
            "max_carry_forward": 0,
            "color_code": "#FFEAA7",
            "allow_half_day": False,
            "allow_hourly": False,
            "max_consecutive_days": 15,
            "requires_approval": True,
            "can_exceed_balance": False,
            "requires_documentation": True
        },
        {
            "name": "Bereavement Leave",
            "description": "Leave for family bereavement",
            "category": LeaveTypeCategory.BEREAVEMENT.value,
            "default_balance": 7,
            "allow_carry_forward": False,
            "max_carry_forward": 0,
            "color_code": "#DDA0DD",
            "allow_half_day": True,
            "allow_hourly": False,
            "max_consecutive_days": 7,
            "requires_approval": True,
            "can_exceed_balance": False,
            "requires_documentation": False
        }
    ]
    
    for leave_type_data in leave_types:
        leave_type = LeaveType(**leave_type_data)
        db.add(leave_type)
    
    db.commit()
    logger.info(f"Seeded {len(leave_types)} leave types")

def seed_super_admin(db: Session):
    """Seed super admin user if none exists"""
    logger.info("Checking for super admin...")
    
    # Check if super admin already exists
    existing_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
    if existing_admin:
        logger.info("Super admin already exists, skipping...")
        return existing_admin
    
    # Get super admin credentials from environment variables
    admin_email = os.getenv("SUPER_ADMIN_EMAIL", "admin@company.com")
    admin_password = os.getenv("SUPER_ADMIN_PASSWORD", "admin123")
    admin_first_name = os.getenv("SUPER_ADMIN_FIRST_NAME", "Super")
    admin_last_name = os.getenv("SUPER_ADMIN_LAST_NAME", "Admin")
    
    # Create super admin user
    auth_service = AuthService()
    super_admin = auth_service.create_user(
        db=db,
        email=admin_email,
        password=admin_password,
        first_name=admin_first_name,
        last_name=admin_last_name,
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        first_login=False  # Super admin doesn't need first-time password change
    )
    
    logger.info(f"Created super admin: {admin_email}")
    return super_admin

def seed_sample_hr(db: Session):
    """Seed sample HR user if none exists"""
    logger.info("Checking for HR users...")
    
    # Check if HR users already exist
    existing_hr = db.query(User).filter(User.role == UserRole.HR).first()
    if existing_hr:
        logger.info("HR users already exist, skipping...")
        return
    
    # Create sample HR user
    auth_service = AuthService()
    hr_user = auth_service.create_user(
        db=db,
        email="hr@company.com",
        password="hr123",
        first_name="HR",
        last_name="Manager",
        role=UserRole.HR,
        is_active=True,
        first_login=False
    )
    
    logger.info("Created sample HR user: hr@company.com")
    return hr_user

def seed_sample_employee(db: Session):
    """Seed sample employee if none exists"""
    logger.info("Checking for sample employees...")
    
    # Check if employees already exist
    existing_employee = db.query(User).filter(User.role == UserRole.EMPLOYEE).first()
    if existing_employee:
        logger.info("Sample employees already exist, skipping...")
        return
    
    # Create sample employee
    auth_service = AuthService()
    employee_user = auth_service.create_user(
        db=db,
        email="employee@company.com",
        password="emp123",
        first_name="John",
        last_name="Doe",
        role=UserRole.EMPLOYEE,
        is_active=True,
        first_login=False
    )
    
    # Create employee record
    employee_service = EmployeeService()
    employee = employee_service.create_employee(
        db=db,
        user_id=employee_user.id,
        employee_id="EMP001",
        first_name="John",
        last_name="Doe",
        email="employee@company.com",
        phone="+91-9876543210",
        department="Engineering",
        position="Software Developer",
        joining_date=date(2024, 1, 1),
        salary=50000
    )
    
    logger.info("Created sample employee: employee@company.com")
    return employee_user

def seed_leave_balances(db: Session):
    """Seed leave balances for existing employees"""
    logger.info("Seeding leave balances...")
    
    # Get all employees and leave types
    employees = db.query(Employee).all()
    leave_types = db.query(LeaveType).all()
    
    if not employees or not leave_types:
        logger.info("No employees or leave types found, skipping leave balance seeding...")
        return
    
    current_year = datetime.now().year
    
    for employee in employees:
        for leave_type in leave_types:
            # Check if balance already exists
            existing_balance = db.query(EmployeeLeaveBalance).filter(
                EmployeeLeaveBalance.employee_id == employee.id,
                EmployeeLeaveBalance.leave_type_id == leave_type.id,
                EmployeeLeaveBalance.year == current_year
            ).first()
            
            if existing_balance:
                continue
            
            # Create leave balance
            balance = EmployeeLeaveBalance(
                employee_id=employee.id,
                leave_type_id=leave_type.id,
                year=current_year,
                allocated_days=leave_type.default_balance,
                used_days=0,
                pending_days=0,
                carried_forward_days=0,
                available_balance=leave_type.default_balance
            )
            db.add(balance)
    
    db.commit()
    logger.info("Seeded leave balances for all employees")

def main():
    """Main seeding function"""
    logger.info("Starting database seeding...")
    
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
        
        # Get database session
        db = SessionLocal()
        
        try:
            # Seed in order
            seed_holidays(db)
            seed_leave_types(db)
            seed_super_admin(db)
            seed_sample_hr(db)
            seed_sample_employee(db)
            seed_leave_balances(db)
            
            logger.info("Database seeding completed successfully!")
            
            # Print login credentials
            logger.info("\n" + "="*50)
            logger.info("LOGIN CREDENTIALS:")
            logger.info("="*50)
            logger.info("Super Admin:")
            logger.info(f"  Email: {os.getenv('SUPER_ADMIN_EMAIL', 'admin@company.com')}")
            logger.info(f"  Password: {os.getenv('SUPER_ADMIN_PASSWORD', 'admin123')}")
            logger.info("\nHR User:")
            logger.info("  Email: hr@company.com")
            logger.info("  Password: hr123")
            logger.info("\nSample Employee:")
            logger.info("  Email: employee@company.com")
            logger.info("  Password: emp123")
            logger.info("="*50)
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Error during seeding: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
