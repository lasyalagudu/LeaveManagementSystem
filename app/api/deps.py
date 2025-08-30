from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.models.user import User, UserRole
from app.services.user_service import UserService
from typing import Optional

security = HTTPBearer()
auth_service = AuthService()
user_service = UserService()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        token_data = auth_service.verify_token(token)
        if token_data is None:
            raise credentials_exception
        
        user = user_service.get_user_by_id(db, token_data.user_id)
        if user is None:
            raise credentials_exception
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        return user
    except Exception:
        raise credentials_exception


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def get_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Get current user if they are Super Admin"""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required"
        )
    return current_user


def get_hr_or_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Get current user if they are HR or Super Admin"""
    if current_user.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR or Super Admin access required"
        )
    return current_user


def get_employee_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current user if they are an Employee"""
    if current_user.role != UserRole.EMPLOYEE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee access required"
        )
    return current_user


def get_any_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    """Get any authenticated user"""
    return current_user



