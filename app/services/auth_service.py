from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User, UserRole
from app.schemas.auth import TokenData
from app.schemas.user import UserLogin, UserPasswordSetup
import secrets
import string


class AuthService:
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.secret_key = settings.secret_key
        self.algorithm = settings.algorithm
        self.access_token_expire_minutes = settings.access_token_expire_minutes
        self.refresh_token_expire_days = settings.refresh_token_expire_days
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Generate password hash"""
        return self.pwd_context.hash(password)
    
    def generate_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Generate JWT token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def generate_refresh_token(self, data: dict) -> str:
        """Generate refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[TokenData]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            email: str = payload.get("sub")
            user_id: int = payload.get("user_id")
            role: str = payload.get("role")
            
            if email is None or user_id is None or role is None:
                return None
            
            token_data = TokenData(email=email, user_id=user_id, role=UserRole(role))
            return token_data
        except JWTError:
            return None
    
    def authenticate_user(self, db: Session, login_data: UserLogin) -> Optional[User]:
        """Authenticate user with email and password"""
        user = db.query(User).filter(User.email == login_data.email).first()
        if not user:
            return None
        if not user.hashed_password:
            return None
        if not self.verify_password(login_data.password, user.hashed_password):
            return None
        return user
    
    def create_access_token(self, user: User) -> dict:
        """Create access and refresh tokens for user"""
        access_token_expires = timedelta(minutes=self.access_token_expire_minutes)
        refresh_token_expires = timedelta(days=self.refresh_token_expire_days)
        
        access_token = self.generate_token(
            data={"sub": user.email, "user_id": user.id, "role": user.role.value},
            expires_delta=access_token_expires
        )
        
        refresh_token = self.generate_refresh_token(
            data={"sub": user.email, "user_id": user.id, "role": user.role.value}
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60
        }
    
    def generate_password_setup_token(self) -> str:
        """Generate secure token for password setup"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(32))
    
    def verify_password_setup_token(self, db: Session, token: str) -> Optional[User]:
        """Verify password setup token and return user if valid"""
        user = db.query(User).filter(
            User.password_setup_token == token,
            User.password_setup_expires > datetime.utcnow()
        ).first()
        return user
    
    def setup_password(self, db: Session, token: str, password: str) -> bool:
        """Setup password for user with valid token"""
        user = self.verify_password_setup_token(db, token)
        if not user:
            return False
        
        user.hashed_password = self.get_password_hash(password)
        user.password_setup_token = None
        user.password_setup_expires = None
        user.first_login = False
        user.is_verified = True
        
        db.commit()
        return True
    
    def refresh_access_token(self, refresh_token: str) -> Optional[dict]:
        """Generate new access token using refresh token"""
        try:
            payload = jwt.decode(refresh_token, self.secret_key, algorithms=[self.algorithm])
            email: str = payload.get("sub")
            user_id: int = payload.get("user_id")
            role: str = payload.get("role")
            
            if email is None or user_id is None or role is None:
                return None
            
            access_token_expires = timedelta(minutes=self.access_token_expire_minutes)
            access_token = self.generate_token(
                data={"sub": email, "user_id": user_id, "role": role},
                expires_delta=access_token_expires
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": self.access_token_expire_minutes * 60
            }
        except JWTError:
            return None


