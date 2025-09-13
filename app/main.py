from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
import logging

from app.config import settings
from app.database import init_db, get_db
from app.services.user_service import UserService
from app.api.v1 import auth, users, leave

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Leave Management System...")
    
    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    # Initialize Super Admin
    try:
        db = next(get_db())
        user_service = UserService()
        super_admin = user_service.initialize_super_admin(db)
        if super_admin:
            logger.info(f"Super Admin initialized: {super_admin.email}")
        else:
            logger.warning("Failed to initialize Super Admin")
    except Exception as e:
        logger.error(f"Failed to initialize Super Admin: {e}")
    
    logger.info("Leave Management System started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Leave Management System...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="A comprehensive Leave Management System with role-based access control",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"] if settings.debug else ["localhost", "127.0.0.1"]  # Configure for production
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(leave.router, prefix="/api/v1")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else "Documentation disabled in production"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
    "main:app",  # Remove 'app.' if main.py is in LMS root
    host="0.0.0.0",
    port=8000,
    reload=settings.debug,
    log_level="info"
)

for route in app.routes:
    print(route.path, route.name)
