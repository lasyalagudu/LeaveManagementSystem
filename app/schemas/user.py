from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from app.models.user import UserRole


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    password: Optional[constr(min_length=8)] = None


class UserCreateResponse(UserResponse):
    """Response after creating a user, can extend UserResponse"""
    pass


# ===== Auth Schemas =====
class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPasswordSetup(BaseModel):
    password: constr(min_length=8)
    confirm_password: constr(min_length=8)


class UserPasswordReset(BaseModel):
    email: EmailStr


class UserPasswordChange(BaseModel):
    old_password: constr(min_length=8)
    new_password: constr(min_length=8)
    confirm_password: constr(min_length=8)
