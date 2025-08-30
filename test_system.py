#!/usr/bin/env python3
"""
Simple test script to verify the Leave Management System components
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.database import init_db
from app.models import User, Employee, LeaveType, EmployeeLeaveBalance, LeaveRequest, LeaveRequestAudit
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_config():
    """Test configuration loading"""
    logger.info("Testing configuration...")
    logger.info(f"App Name: {settings.app_name}")
    logger.info(f"Database URL: {settings.database_url}")
    logger.info(f"Super Admin Email: {settings.super_admin_email}")
    logger.info("Configuration test passed!")


def test_models():
    """Test model imports"""
    logger.info("Testing model imports...")
    logger.info(f"User model: {User}")
    logger.info(f"Employee model: {Employee}")
    logger.info(f"LeaveType model: {LeaveType}")
    logger.info(f"EmployeeLeaveBalance model: {EmployeeLeaveBalance}")
    logger.info(f"LeaveRequest model: {LeaveRequest}")
    logger.info(f"LeaveRequestAudit model: {LeaveRequestAudit}")
    logger.info("Model imports test passed!")


def test_database():
    """Test database connection"""
    logger.info("Testing database connection...")
    try:
        init_db()
        logger.info("Database connection test passed!")
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False
    return True


def main():
    """Main test function"""
    logger.info("Starting system tests...")
    
    # Test configuration
    test_config()
    
    # Test models
    test_models()
    
    # Test database (optional - requires database setup)
    try:
        test_database()
    except Exception as e:
        logger.warning(f"Database test skipped: {e}")
    
    logger.info("All tests completed!")


if __name__ == "__main__":
    main()





