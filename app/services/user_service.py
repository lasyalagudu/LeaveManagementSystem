from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self):
        self.auth_service = AuthService()
        self.email_service = EmailService()
    
    def create_user(self, db: Session, user_data: UserCreate) -> Optional[User]:
        try:
            existing_user = db.query(User).filter(User.email == user_data.email).first()
            if existing_user:
                raise ValueError("Email already registered")

            user = User(
                email=user_data.email,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                role=user_data.role,
                is_active=True,
                is_verified=False,
                first_login=True
            )

            if getattr(user_data, "password", None):
                user.hashed_password = self.auth_service.get_password_hash(user_data.password)
                user.is_verified = True
                user.first_login = False
            else:
                # Generate password setup token
                user.password_setup_token = self.auth_service.generate_password_setup_token()
                user.password_setup_expires = datetime.utcnow() + timedelta(hours=24)

            db.add(user)
            db.commit()
            db.refresh(user)

            # Send welcome email if no password
            if not getattr(user_data, "password", None):
                self.email_service.send_welcome_email(user, user.password_setup_token)

            return user

        except IntegrityError as e:
            db.rollback()
            logger.error(f"DB error creating user: {e}")
            raise ValueError("Failed to create user")
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating user: {e}")
            raise
    
    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    def get_users_by_role(self, db: Session, role: UserRole) -> List[User]:
        """Get all users by role"""
        return db.query(User).filter(User.role == role, User.is_active == True).all()
    
    def update_user(self, db: Session, user_id: int, user_data: UserUpdate) -> Optional[User]:
        """Update user information"""
        user = self.get_user_by_id(db, user_id)
        if not user:
            return None
        
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user
    
    def deactivate_user(self, db: Session, user_id: int) -> bool:
        """Deactivate a user"""
        user = self.get_user_by_id(db, user_id)
        if not user:
            return False
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.commit()
        return True
    
    def activate_user(self, db: Session, user_id: int) -> bool:
        """Activate a user"""
        user = self.get_user_by_id(db, user_id)
        if not user:
            return False
        
        user.is_active = True
        user.updated_at = datetime.utcnow()
        db.commit()
        return True
    
    def reset_password_token(self, db: Session, email: str) -> bool:
        """Generate password reset token and send email"""
        user = self.get_user_by_email(db, email)
        if not user:
            return False
        
        # Generate reset token
        user.reset_password_token = self.auth_service.generate_password_setup_token()
        user.reset_password_expires = datetime.utcnow() + timedelta(hours=1)
        
        db.commit()
        
        # Send reset email
        self.email_service.send_password_reset_email(user)
        return True
    
    def change_password(self, db: Session, user_id: int, current_password: str, new_password: str) -> bool:
        """Change user password"""
        user = self.get_user_by_id(db, user_id)
        if not user or not user.hashed_password:
            return False
        
        # Verify current password
        if not self.auth_service.verify_password(current_password, user.hashed_password):
            return False
        
        # Update password
        user.hashed_password = self.auth_service.get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        
        db.commit()
        return True
    
    def get_all_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination"""
        return db.query(User).offset(skip).limit(limit).all()
    
    def initialize_super_admin(self, db: Session) -> Optional[User]:
        """Initialize Super Admin user if none exists"""
        # Check if Super Admin already exists
        existing_admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if existing_admin:
            return existing_admin
        
        try:
            # Create Super Admin from environment variables
            super_admin_data = UserCreate(
                email=settings.super_admin_email,
                password=settings.super_admin_password,
                role=UserRole.SUPER_ADMIN,
                first_name=settings.super_admin_first_name,
                last_name=settings.super_admin_last_name
            )
            
            super_admin = self.create_user(db, super_admin_data)
            logger.info(f"Super Admin initialized: {super_admin.email}")
            return super_admin
            
        except Exception as e:
            logger.error(f"Failed to initialize Super Admin: {e}")
            return None
    
    def create_hr_user(self, db: Session, hr_data: UserCreate, created_by: User) -> Optional[User]:
        """Create HR user (only Super Admin can do this)"""
        if created_by.role != UserRole.SUPER_ADMIN:
            raise ValueError("Only Super Admin can create HR users")
        
        if hr_data.role != UserRole.HR:
            raise ValueError("Can only create HR users")
        
        return self.create_user(db, hr_data)
    
    def get_user_profile(self, db: Session, user_id: int, requesting_user: User) -> Optional[User]:
        """Get user profile with role-based access control"""
        # Super Admin can access all profiles
        if requesting_user.role == UserRole.SUPER_ADMIN:
            return self.get_user_by_id(db, user_id)
        
        # HR can access employee profiles
        if requesting_user.role == UserRole.HR:
            target_user = self.get_user_by_id(db, user_id)
            if target_user and target_user.role == UserRole.EMPLOYEE:
                return target_user
        
        # Users can only access their own profile
        if requesting_user.id == user_id:
            return requesting_user
        
        return None


