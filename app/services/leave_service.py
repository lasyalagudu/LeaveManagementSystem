from datetime import datetime, date, timedelta
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.leave_type import LeaveType
from app.models.leave_balance import EmployeeLeaveBalance
from app.models.leave_request import LeaveRequest, LeaveStatus
from app.models.leave_audit import LeaveRequestAudit, AuditAction
from app.models.holiday import Holiday
from app.schemas.leave import (
    LeaveTypeCreate, LeaveTypeUpdate, LeaveRequestCreate, LeaveRequestUpdate,
    LeaveDurationType, LeaveTypeCategory
)
from app.services.employee_service import EmployeeService
from app.services.email_service import EmailService
import logging
from app.schemas.leave import LeaveTypeResponse

logger = logging.getLogger(__name__)


class LeaveService:
    def __init__(self):
        self.employee_service = EmployeeService()
        self.email_service = EmailService()
    
    def create_leave_type(self, db: Session, leave_type_data: LeaveTypeCreate, created_by: User) -> Optional[LeaveType]:
        """Create a new leave type (only HR and Super Admin can do this)"""
        if created_by.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
            raise ValueError("Only HR or Super Admin can create leave types")
        
        try:
            leave_type = LeaveType(**leave_type_data.dict())
            db.add(leave_type)
            db.commit()
            db.refresh(leave_type)
            
            logger.info(f"Leave type created: {leave_type.name}")
            return LeaveTypeResponse.from_orm(db_leave_type) 
            
        except IntegrityError as e:
            db.rollback()
            logger.error(f"Database error creating leave type: {e}")
            raise ValueError("Leave type name already exists")
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating leave type: {e}")
            raise
    
    def get_leave_type_by_id(self, db: Session, leave_type_id: int) -> Optional[LeaveType]:
        """Get leave type by ID"""
        return db.query(LeaveType).filter(LeaveType.id == leave_type_id).first()
    
    def get_all_leave_types(self, db: Session, active_only: bool = True) -> List[LeaveType]:
        """Get all leave types"""
        query = db.query(LeaveType)
        if active_only:
            query = query.filter(LeaveType.is_active == True)
        return query.all()
    
    def update_leave_type(self, db: Session, leave_type_id: int, leave_type_data: LeaveTypeUpdate, 
                         updated_by: User) -> Optional[LeaveType]:
        """Update leave type (only HR and Super Admin can do this)"""
        if updated_by.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
            raise ValueError("Only HR or Super Admin can update leave types")
        
        leave_type = self.get_leave_type_by_id(db, leave_type_id)
        if not leave_type:
            return None
        
        update_data = leave_type_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(leave_type, field, value)
        
        leave_type.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(leave_type)
        return leave_type
    
    def create_leave_request(self, db: Session, leave_request_data: LeaveRequestCreate, 
                           employee_user: User) -> Optional[LeaveRequest]:
        """Create a new leave request"""
        if employee_user.role != UserRole.EMPLOYEE:
            raise ValueError("Only employees can create leave requests")
        
        try:
            # Get employee record
            employee = self.employee_service.get_employee_by_user_id(db, employee_user.id)
            if not employee:
                raise ValueError("Employee record not found")
            
            # Get leave type for validation
            leave_type = self.get_leave_type_by_id(db, leave_request_data.leave_type_id)
            if not leave_type or not leave_type.is_active:
                raise ValueError("Selected leave type is not available")
            
            # Enhanced business logic validations
            self._validate_leave_request_business_rules(db, leave_request_data, employee.id, leave_type)
            
            # Calculate number of days (now supports half-days and hours)
            start_date = leave_request_data.start_date
            end_date = leave_request_data.end_date
            duration_type = leave_request_data.duration_type
            
            if duration_type == LeaveDurationType.HOURLY:
                number_of_days = leave_request_data.hours / 8.0  # Convert hours to days
            elif duration_type == LeaveDurationType.HALF_DAY:
                number_of_days = self._calculate_half_day_leave_days(db, start_date, end_date)
            else:
                number_of_days = self._calculate_leave_days(db, start_date, end_date)
            
            # Validate leave balance (with special rules for sick leave)
            if not self._validate_leave_balance(db, employee.id, leave_request_data.leave_type_id, 
                                              number_of_days, leave_type, leave_request_data.medical_proof):
                raise ValueError("Insufficient leave balance")
            
            # Create leave request
            leave_request = LeaveRequest(
                employee_id=employee.id,
                leave_type_id=leave_request_data.leave_type_id,
                start_date=start_date,
                end_date=end_date,
                duration_type=duration_type.value,
                start_half=leave_request_data.start_half,
                hours=leave_request_data.hours,
                number_of_days=number_of_days,
                reason=leave_request_data.reason,
                medical_proof=leave_request_data.medical_proof,
                documentation=leave_request_data.documentation,
                status=LeaveStatus.PENDING
            )
            
            db.add(leave_request)
            db.commit()
            db.refresh(leave_request)
            
            # Update pending days in leave balance
            self._update_pending_leave_balance(db, employee.id, leave_request_data.leave_type_id, 
                                            number_of_days, add=True)
            
            # Create audit log
            self._create_audit_log(db, leave_request.id, AuditAction.CREATED, employee_user.id)
            
            # Send notification email to HR
            self._notify_hr_leave_request(db, leave_request)
            
            # Console log for leave application
            logger.info(f"Leave request created: {leave_request.id} by employee {employee.id} for {number_of_days} days")
            
            return leave_request
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating leave request: {e}")
            raise

    def _validate_leave_request_business_rules(self, db: Session, leave_request_data: LeaveRequestCreate, 
                                             employee_id: int, leave_type: LeaveType):
        """Enhanced validation for leave requests"""
        start_date = leave_request_data.start_date
        end_date = leave_request_data.end_date
        duration_type = leave_request_data.duration_type
        
        # 1. Check leave type specific rules
        if duration_type == LeaveDurationType.HALF_DAY and not leave_type.allow_half_day:
            raise ValueError(f"Leave type '{leave_type.name}' does not support half-day leaves")
        
        if duration_type == LeaveDurationType.HOURLY and not leave_type.allow_hourly:
            raise ValueError(f"Leave type '{leave_type.name}' does not support hourly leaves")
        
        # 2. Maximum consecutive days (leave type specific)
        max_consecutive_days = leave_type.max_consecutive_days
        if (end_date - start_date).days + 1 > max_consecutive_days:
            raise ValueError(f"Leave request cannot exceed {max_consecutive_days} consecutive days for this leave type")
        
        # 3. Check for overlapping leave requests
        if self._has_overlapping_leave_requests(db, employee_id, start_date, end_date):
            raise ValueError("You have overlapping leave requests for these dates")
        
        # 4. Check if dates fall within company holidays
        holiday_dates = self._get_holiday_dates(db, start_date, end_date)
        if holiday_dates:
            logger.warning(f"Leave request dates include holidays: {holiday_dates}")
        
        # 5. Check if employee is on probation
        if self._employee_on_probation(db, employee_id):
            raise ValueError("Employees on probation cannot apply for leave")
        
        # 6. Check if dates are within current year
        current_year = datetime.now().year
        if start_date.year != current_year or end_date.year != current_year:
            raise ValueError("Leave requests can only be made for the current year")
        
        # 7. Check if employee has any pending disciplinary actions
        if self._employee_has_disciplinary_actions(db, employee_id):
            raise ValueError("Leave requests are restricted due to pending disciplinary actions")
        
        # 8. Validate documentation requirements
        if leave_type.requires_documentation and not leave_request_data.documentation:
            raise ValueError(f"Documentation is required for {leave_type.name} leaves")
        
        # 9. Validate medical proof for sick leave exceeding balance
        if leave_type.category == LeaveTypeCategory.SICK and leave_request_data.medical_proof:
            if not leave_request_data.medical_proof.strip():
                raise ValueError("Medical proof is required for sick leave exceeding balance")

    def _has_overlapping_leave_requests(self, db: Session, employee_id: int, 
                                      start_date: date, end_date: date) -> bool:
        """Check if employee has overlapping leave requests"""
        overlapping_requests = db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
            # Check for overlap: new start < existing end AND new end > existing start
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date
        ).first()
        
        return overlapping_requests is not None

    def _get_holiday_dates(self, db: Session, start_date: date, end_date: date) -> List[date]:
        """Get holiday dates within the leave period"""
        holidays = db.query(Holiday).filter(
            Holiday.date >= start_date,
            Holiday.date <= end_date,
            Holiday.is_active == True
        ).all()
        
        return [holiday.date for holiday in holidays]

    def _calculate_half_day_leave_days(self, db: Session, start_date: date, end_date: date) -> float:
        """Calculate half-day leave days excluding weekends and holidays"""
        days = 0.0
        current_date = start_date
        
        while current_date <= end_date:
            if current_date.weekday() < 5:  # Monday to Friday (0-4)
                # Check if it's a holiday
                holiday = db.query(Holiday).filter(
                    Holiday.date == current_date,
                    Holiday.is_active == True
                ).first()
                
                if not holiday:  # Only count non-holiday weekdays
                    days += 0.5  # Half day
            current_date += timedelta(days=1)
        
        return days

    def _calculate_leave_days(self, db: Session, start_date: date, end_date: date) -> float:
        """Calculate number of leave days excluding weekends and holidays"""
        days = 0.0
        current_date = start_date
        
        while current_date <= end_date:
            if current_date.weekday() < 5:  # Monday to Friday (0-4)
                # Check if it's a holiday
                holiday = db.query(Holiday).filter(
                    Holiday.date == current_date,
                    Holiday.is_active == True
                ).first()
                
                if not holiday:  # Only count non-holiday weekdays
                    days += 1.0
            current_date += timedelta(days=1)
        
        return days

    def _validate_leave_balance(self, db: Session, employee_id: int, leave_type_id: int, 
                               requested_days: float, leave_type: LeaveType, medical_proof: str = None) -> bool:
        """Enhanced leave balance validation with special rules"""
        current_year = datetime.now().year
        balance = db.query(EmployeeLeaveBalance).filter(
            EmployeeLeaveBalance.employee_id == employee_id,
            EmployeeLeaveBalance.leave_type_id == leave_type_id,
            EmployeeLeaveBalance.year == current_year
        ).first()
        
        if not balance:
            return False
        
        available_balance = balance.available_balance - balance.pending_days
        
        # Special rule for sick leave with medical proof
        if leave_type.category == LeaveTypeCategory.SICK and leave_type.can_exceed_balance and medical_proof:
            logger.info(f"Sick leave with medical proof - allowing balance exceed for employee {employee_id}")
            return True
        
        return available_balance >= requested_days

    def _update_pending_leave_balance(self, db: Session, employee_id: int, leave_type_id: int, 
                                    days: float, add: bool = True):
        """Update pending days in leave balance"""
        current_year = datetime.now().year
        balance = db.query(EmployeeLeaveBalance).filter(
            EmployeeLeaveBalance.employee_id == employee_id,
            EmployeeLeaveBalance.leave_type_id == leave_type_id,
            EmployeeLeaveBalance.year == current_year
        ).first()
        
        if balance:
            if add:
                balance.pending_days += days
            else:
                balance.pending_days = max(0, balance.pending_days - days)
            
            balance.available_balance = (balance.allocated_days - balance.used_days - 
                                       balance.pending_days + balance.carried_forward_days)
            db.commit()
    
    def approve_leave_request(self, db: Session, leave_request_id: int, approved_by: User, 
                            comments: str = None) -> Optional[LeaveRequest]:
        """Approve a leave request (only HR and Super Admin can do this)"""
        if approved_by.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
            raise ValueError("Only HR or Super Admin can approve leave requests")
        
        leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_request_id).first()
        if not leave_request:
            return None
        
        # Prevent approving requests not in PENDING state
        if leave_request.status != LeaveStatus.PENDING:
            raise ValueError("Only pending leave requests can be approved")
        
        try:
            # Update leave request status
            leave_request.status = LeaveStatus.APPROVED
            leave_request.approved_by_id = approved_by.id
            leave_request.approved_at = datetime.utcnow()
            
            # Update leave balance
            self._update_pending_leave_balance(db, leave_request.employee_id, 
                                            leave_request.leave_type_id, leave_request.number_of_days, add=False)
            
            # Create audit log
            self._create_audit_log(db, leave_request.id, AuditAction.APPROVED, approved_by.id, 
                                 old_status=LeaveStatus.PENDING.value, new_status=LeaveStatus.APPROVED.value,
                                 comments=comments)
            
            # Send notification email to employee
            self._notify_employee_leave_decision(db, leave_request, LeaveStatus.APPROVED)
            
            # Console log for leave approval
            logger.info(f"Leave request {leave_request_id} approved by {approved_by.id} for employee {leave_request.employee_id}")
            
            db.commit()
            return leave_request
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error approving leave request: {e}")
            raise
    
    def reject_leave_request(self, db: Session, leave_request_id: int, rejected_by: User, 
                           rejection_reason: str) -> Optional[LeaveRequest]:
        """Reject a leave request (only HR and Super Admin can do this)"""
        if rejected_by.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
            raise ValueError("Only HR or Super Admin can reject leave requests")
        
        leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_request_id).first()
        if not leave_request:
            return None
        
        # Prevent rejecting requests not in PENDING state
        if leave_request.status != LeaveStatus.PENDING:
            raise ValueError("Only pending leave requests can be rejected")
        
        try:
            # Update leave request status
            leave_request.status = LeaveStatus.REJECTED
            leave_request.rejection_reason = rejection_reason
            
            # Update leave balance (remove pending days)
            self._update_pending_leave_balance(db, leave_request.employee_id, 
                                            leave_request.leave_type_id, leave_request.number_of_days, add=False)
            
            # Create audit log
            self._create_audit_log(db, leave_request.id, AuditAction.REJECTED, rejected_by.id,
                                 old_status=LeaveStatus.PENDING.value, new_status=LeaveStatus.REJECTED.value,
                                 comments=rejection_reason)
            
            # Send notification email to employee
            self._notify_employee_leave_decision(db, leave_request, LeaveStatus.REJECTED)
            
            # Console log for leave rejection
            logger.info(f"Leave request {leave_request_id} rejected by {rejected_by.id} for employee {leave_request.employee_id}")
            
            db.commit()
            return leave_request
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error rejecting leave request: {e}")
            raise
    
    def cancel_leave_request(self, db: Session, leave_request_id: int, cancelled_by: User, 
                           comments: str = None) -> Optional[LeaveRequest]:
        """Cancel a leave request"""
        leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_request_id).first()
        if not leave_request:
            return None
        
        # Check if user can cancel this request
        if cancelled_by.role == UserRole.EMPLOYEE:
            employee = self.employee_service.get_employee_by_user_id(db, cancelled_by.id)
            if not employee or employee.id != leave_request.employee_id:
                raise ValueError("You can only cancel your own leave requests")
        elif cancelled_by.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
            raise ValueError("Insufficient permissions")
        
        # Only allow cancellation of pending or approved requests
        if leave_request.status not in [LeaveStatus.PENDING, LeaveStatus.APPROVED]:
            raise ValueError("Leave request cannot be cancelled in its current status")
        
        try:
            old_status = leave_request.status
            leave_request.status = LeaveStatus.CANCELLED
            
            # Update leave balance
            if old_status == LeaveStatus.PENDING:
                self._update_pending_leave_balance(db, leave_request.employee_id, 
                                                leave_request.leave_type_id, leave_request.number_of_days, add=False)
            elif old_status == LeaveStatus.APPROVED:
                # Refund used days
                self._refund_used_leave_balance(db, leave_request.employee_id, 
                                              leave_request.leave_type_id, leave_request.number_of_days)
            
            # Create audit log
            self._create_audit_log(db, leave_request.id, AuditAction.CANCELLED, cancelled_by.id,
                                 old_status=old_status.value, new_status=LeaveStatus.CANCELLED.value,
                                 comments=comments)
            
            # Console log for leave cancellation
            logger.info(f"Leave request {leave_request_id} cancelled by {cancelled_by.id} for employee {leave_request.employee_id}")
            
            db.commit()
            return leave_request
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error cancelling leave request: {e}")
            raise
    
    def _refund_used_leave_balance(self, db: Session, employee_id: int, leave_type_id: int, days: float):
        """Refund used leave balance when request is cancelled"""
        current_year = datetime.now().year
        balance = db.query(EmployeeLeaveBalance).filter(
            EmployeeLeaveBalance.employee_id == employee_id,
            EmployeeLeaveBalance.leave_type_id == leave_type_id,
            EmployeeLeaveBalance.year == current_year
        ).first()
        
        if balance:
            balance.used_days = max(0, balance.used_days - days)
            balance.available_balance = (balance.allocated_days - balance.used_days - 
                                       balance.pending_days + balance.carried_forward_days)
            db.commit()
    
    def _create_audit_log(self, db: Session, leave_request_id: int, action: AuditAction, 
                          performed_by_id: int, old_status: str = None, new_status: str = None, 
                          comments: str = None):
        """Create audit log entry"""
        audit_log = LeaveRequestAudit(
            leave_request_id=leave_request_id,
            action=action,
            performed_by_id=performed_by_id,
            old_status=old_status,
            new_status=new_status,
            comments=comments
        )
        db.add(audit_log)
    
    def _notify_hr_leave_request(self, db: Session, leave_request: LeaveRequest):
        """Send notification email to HR about new leave request"""
        try:
            # Get HR users
            hr_users = db.query(User).filter(User.role == UserRole.HR, User.is_active == True).all()
            
            for hr_user in hr_users:
                self.email_service.send_hr_leave_request_notification(hr_user, leave_request)
        except Exception as e:
            logger.error(f"Error sending HR notification: {e}")
    
    def _notify_employee_leave_decision(self, db: Session, leave_request: LeaveRequest, status: LeaveStatus):
        """Send notification email to employee about leave decision"""
        try:
            employee_user = db.query(User).filter(User.id == leave_request.employee.user_id).first()
            if employee_user:
                self.email_service.send_employee_leave_decision_notification(employee_user, leave_request, status)
        except Exception as e:
            logger.error(f"Error sending employee notification: {e}")
    
    def get_leave_requests_by_employee(self, db: Session, employee_id: int, 
                                     requesting_user: User) -> List[LeaveRequest]:
        """Get leave requests for an employee with role-based access control"""
        # Check access permissions
        if requesting_user.role == UserRole.EMPLOYEE:
            employee = self.employee_service.get_employee_by_user_id(db, requesting_user.id)
            if not employee or employee.id != employee_id:
                raise ValueError("You can only view your own leave requests")
        elif requesting_user.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
            raise ValueError("Insufficient permissions")
        
        return db.query(LeaveRequest).filter(LeaveRequest.employee_id == employee_id).all()
    
    def get_pending_leave_requests(self, db: Session, requesting_user: User) -> List[LeaveRequest]:
        """Get all pending leave requests (HR and Super Admin only)"""
        if requesting_user.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
            raise ValueError("Only HR and Super Admin can view pending requests")
        
        return db.query(LeaveRequest).filter(LeaveRequest.status == LeaveStatus.PENDING).all()
    
    def get_leave_audit_logs(self, db: Session, leave_request_id: int, 
                            requesting_user: User) -> List[LeaveRequestAudit]:
        """Get audit logs for a leave request"""
        # Check if user has access to this leave request
        leave_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_request_id).first()
        if not leave_request:
            return []
        
        if requesting_user.role == UserRole.EMPLOYEE:
            employee = self.employee_service.get_employee_by_user_id(db, requesting_user.id)
            if not employee or employee.id != leave_request.employee_id:
                raise ValueError("You can only view audit logs for your own requests")
        elif requesting_user.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
            raise ValueError("Insufficient permissions")
        
        return db.query(LeaveRequestAudit).filter(
            LeaveRequestAudit.leave_request_id == leave_request_id
        ).order_by(LeaveRequestAudit.created_at.desc()).all()

    # Employee-specific methods
    def get_my_leave_requests(self, db: Session, current_user: User, 
                             status_filter: str = None) -> List[LeaveRequest]:
        """Get current employee's leave requests with optional status filtering"""
        if current_user.role != UserRole.EMPLOYEE:
            raise ValueError("Only employees can access this method")
        
        employee = self.employee_service.get_employee_by_user_id(db, current_user.id)
        if not employee:
            return []
        
        query = db.query(LeaveRequest).filter(LeaveRequest.employee_id == employee.id)
        
        if status_filter:
            try:
                status_enum = LeaveStatus(status_filter.lower())
                query = query.filter(LeaveRequest.status == status_enum)
            except ValueError:
                # Invalid status filter, return all
                pass
        
        return query.order_by(LeaveRequest.created_at.desc()).all()

    def get_my_leave_request_by_id(self, db: Session, request_id: int, 
                                  current_user: User) -> Optional[LeaveRequest]:
        """Get specific leave request for current employee"""
        if current_user.role != UserRole.EMPLOYEE:
            raise ValueError("Only employees can access this method")
        
        employee = self.employee_service.get_employee_by_user_id(db, current_user.id)
        if not employee:
            return None
        
        leave_request = db.query(LeaveRequest).filter(
            LeaveRequest.id == request_id,
            LeaveRequest.employee_id == employee.id
        ).first()
        
        return leave_request

    def modify_my_leave_request(self, db: Session, request_id: int, 
                               update_data: LeaveRequestUpdate, 
                               current_user: User) -> Optional[LeaveRequest]:
        """Modify leave request for current employee"""
        if current_user.role != UserRole.EMPLOYEE:
            raise ValueError("Only employees can modify their own leave requests")
        
        employee = self.employee_service.get_employee_by_user_id(db, current_user.id)
        if not employee:
            raise ValueError("Employee record not found")
        
        leave_request = db.query(LeaveRequest).filter(
            LeaveRequest.id == request_id,
            LeaveRequest.employee_id == employee.id
        ).first()
        
        if not leave_request:
            return None
        
        # Only allow modification of pending requests
        if leave_request.status != LeaveStatus.PENDING:
            raise ValueError("Only pending leave requests can be modified")
        
        try:
            # Store old values for audit
            old_start_date = leave_request.start_date
            old_end_date = leave_request.end_date
            old_reason = leave_request.reason
            
            # Update fields if provided
            update_dict = update_data.dict(exclude_unset=True)
            
            if 'start_date' in update_dict or 'end_date' in update_dict:
                # If dates are being changed, recalculate number of days
                new_start_date = update_dict.get('start_date', leave_request.start_date)
                new_end_date = update_dict.get('end_date', leave_request.end_date)
                
                # Validate new dates
                if new_end_date < new_start_date:
                    raise ValueError("End date must be after start date")
                
                # Calculate new number of days based on duration type
                if leave_request.duration_type == LeaveDurationType.HOURLY.value:
                    new_number_of_days = leave_request.hours / 8.0
                elif leave_request.duration_type == LeaveDurationType.HALF_DAY.value:
                    new_number_of_days = self._calculate_half_day_leave_days(db, new_start_date, new_end_date)
                else:
                    new_number_of_days = self._calculate_leave_days(db, new_start_date, new_end_date)
                
                # Validate leave balance for new duration
                if not self._validate_leave_balance(db, employee.id, leave_request.leave_type_id, 
                                                  new_number_of_days, leave_request.leave_type, leave_request.medical_proof):
                    raise ValueError("Insufficient leave balance for new duration")
                
                # Update pending days in leave balance
                self._update_pending_leave_balance(db, employee.id, leave_request.leave_type_id, 
                                                leave_request.number_of_days, add=False)  # Remove old
                self._update_pending_leave_balance(db, employee.id, leave_request.leave_type_id, 
                                                new_number_of_days, add=True)  # Add new
                
                # Update leave request
                leave_request.start_date = new_start_date
                leave_request.end_date = new_end_date
                leave_request.number_of_days = new_number_of_days
            
            if 'reason' in update_dict:
                leave_request.reason = update_dict['reason']
            
            leave_request.updated_at = datetime.utcnow()
            
            # Create audit log for modification
            self._create_audit_log(db, leave_request.id, AuditAction.MODIFIED, current_user.id,
                                 old_status=LeaveStatus.PENDING.value, 
                                 new_status=LeaveStatus.PENDING.value,
                                 comments=f"Modified: Start: {old_start_date}→{leave_request.start_date}, "
                                         f"End: {old_end_date}→{leave_request.end_date}, "
                                         f"Reason: {old_reason}→{leave_request.reason}")
            
            db.commit()
            db.refresh(leave_request)
            
            logger.info(f"Leave request modified: {leave_request.id}")
            return leave_request
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error modifying leave request: {e}")
            raise

    def cancel_my_leave_request(self, db: Session, request_id: int, 
                               current_user: User, comments: str = None) -> Optional[LeaveRequest]:
        """Cancel own leave request (Employee only)"""
        if current_user.role != UserRole.EMPLOYEE:
            raise ValueError("Only employees can cancel their own leave requests")
        
        employee = self.employee_service.get_employee_by_user_id(db, current_user.id)
        if not employee:
            raise ValueError("Employee record not found")
        
        leave_request = db.query(LeaveRequest).filter(
            LeaveRequest.id == request_id,
            LeaveRequest.employee_id == employee.id
        ).first()
        
        if not leave_request:
            return None
        
        # Only allow cancellation of pending or approved requests
        if leave_request.status not in [LeaveStatus.PENDING, LeaveStatus.APPROVED]:
            raise ValueError("Leave request cannot be cancelled in its current status")
        
        try:
            old_status = leave_request.status
            leave_request.status = LeaveStatus.CANCELLED
            
            # Update leave balance
            if old_status == LeaveStatus.PENDING:
                self._update_pending_leave_balance(db, leave_request.employee_id, 
                                                leave_request.leave_type_id, leave_request.number_of_days, add=False)
            elif old_status == LeaveStatus.APPROVED:
                # Refund used days
                self._refund_used_leave_balance(db, leave_request.employee_id, 
                                              leave_request.leave_type_id, leave_request.number_of_days)
            
            # Create audit log
            self._create_audit_log(db, leave_request.id, AuditAction.MODIFIED, current_user.id,
                                 old_status=old_status.value, new_status=LeaveStatus.CANCELLED.value,
                                 comments=comments or "Cancelled by employee")
            
            db.commit()
            return leave_request
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error cancelling leave request: {e}")
            raise

    # Holiday management methods
    def create_holiday(self, db: Session, holiday_data, created_by: User) -> Optional[Holiday]:
        """Create a new holiday (HR and Super Admin only)"""
        if created_by.role not in [UserRole.HR, UserRole.SUPER_ADMIN]:
            raise ValueError("Only HR or Super Admin can create holidays")
        
        try:
            holiday = Holiday(**holiday_data.dict())
            db.add(holiday)
            db.commit()
            db.refresh(holiday)
            
            logger.info(f"Holiday created: {holiday.name} on {holiday.date}")
            return holiday
            
        except IntegrityError as e:
            db.rollback()
            logger.error(f"Database error creating holiday: {e}")
            raise ValueError("Holiday date already exists")
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating holiday: {e}")
            raise

    def get_holidays(self, db: Session, start_date: date = None, end_date: date = None) -> List[Holiday]:
        """Get holidays within a date range"""
        query = db.query(Holiday).filter(Holiday.is_active == True)
        
        if start_date:
            query = query.filter(Holiday.date >= start_date)
        if end_date:
            query = query.filter(Holiday.date <= end_date)
        
        return query.order_by(Holiday.date).all()

    def _employee_on_probation(self, db: Session, employee_id: int) -> bool:
        """Check if employee is on probation (first 3 months)"""
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee or not employee.joining_date:
            return False
        
        probation_end_date = employee.joining_date + timedelta(days=90)  # 3 months
        return datetime.now().date() <= probation_end_date

    def _employee_has_disciplinary_actions(self, db: Session, employee_id: int) -> bool:
        """Check if employee has pending disciplinary actions (placeholder)"""
        # This is a placeholder - in production, you would query a disciplinary actions table
        # For now, return False (no restrictions)
        return False
