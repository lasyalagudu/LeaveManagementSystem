# Leave Request Validation Rules

This document outlines all the validation rules implemented for leave requests in the Leave Management System.

## 🎯 Overview

The system implements comprehensive validation at multiple levels:

1. **Schema-level validation** (Pydantic validators)
2. **Service-level validation** (Business logic rules)
3. **Database-level validation** (Constraints and triggers)

## 📅 Date Validation Rules

### 1. Past Date Restrictions

- **Rule**: Start date cannot be in the past
- **Validation**: `start_date >= today`
- **Error Message**: "Start date cannot be in the past"
- **Implementation**: Pydantic validator in `LeaveRequestCreate` and `LeaveRequestUpdate`

### 2. Future Date Restrictions

- **Rule**: Dates cannot be more than 1 year in the future
- **Validation**: `start_date <= today + 1 year` AND `end_date <= today + 1 year`
- **Error Message**: "Start/End date cannot be more than 1 year in the future"
- **Business Logic**: Prevents planning too far ahead

### 3. Date Range Validation

- **Rule**: End date must be after start date
- **Validation**: `end_date > start_date`
- **Error Message**: "End date must be after start date"
- **Implementation**: Pydantic validator with cross-field validation

### 4. Current Year Restriction

- **Rule**: Leave requests can only be made for the current year
- **Validation**: `start_date.year == current_year` AND `end_date.year == current_year`
- **Error Message**: "Leave requests can only be made for the current year"
- **Business Logic**: Prevents planning for next year

## 📝 Reason Validation Rules

### 1. Minimum Length

- **Rule**: Reason must be at least 10 characters long
- **Validation**: `len(reason.strip()) >= 10`
- **Error Message**: "Reason must be at least 10 characters long"
- **Business Logic**: Ensures meaningful explanation

### 2. Maximum Length

- **Rule**: Reason cannot exceed 500 characters
- **Validation**: `len(reason) <= 500`
- **Error Message**: "Reason cannot exceed 500 characters"
- **Business Logic**: Prevents overly long explanations

### 3. Content Validation

- **Rule**: Reason is automatically trimmed of whitespace
- **Implementation**: `reason.strip()` applied automatically
- **Business Logic**: Clean data storage

## ⏰ Duration Validation Rules

### 1. Maximum Consecutive Days

- **Rule**: Leave request cannot exceed 30 consecutive days
- **Validation**: `(end_date - start_date).days + 1 <= 30`
- **Error Message**: "Leave request cannot exceed 30 consecutive days"
- **Business Logic**: Prevents extremely long absences

### 2. Business Day Calculation

- **Rule**: Weekends are excluded from leave day calculations
- **Implementation**: `_calculate_leave_days()` method
- **Business Logic**: Only working days count as leave

## 🔄 Overlap Validation Rules

### 1. No Overlapping Requests

- **Rule**: Employee cannot have overlapping leave requests
- **Validation**: Check for existing PENDING or APPROVED requests
- **Error Message**: "You have overlapping leave requests for these dates"
- **Business Logic**: Prevents double-booking of leave

### 2. Overlap Detection Logic

```python
# Check for overlap: new start < existing end AND new end > existing start
LeaveRequest.start_date <= end_date AND LeaveRequest.end_date >= start_date
```

## 👤 Employee Status Validation Rules

### 1. Probation Period

- **Rule**: Employees on probation cannot apply for leave
- **Validation**: `joining_date + 90 days > today`
- **Error Message**: "Employees on probation cannot apply for leave"
- **Business Logic**: 3-month probation period

### 2. Disciplinary Actions

- **Rule**: Employees with pending disciplinary actions cannot apply for leave
- **Validation**: Check disciplinary actions table
- **Error Message**: "Leave requests are restricted due to pending disciplinary actions"
- **Business Logic**: HR control over problematic employees

### 3. Active Status

- **Rule**: Only active employees can apply for leave
- **Validation**: `user.is_active == True`
- **Implementation**: Authentication dependency

## 🏢 Company Policy Validation Rules

### 1. Leave Type Availability

- **Rule**: Only active leave types can be used
- **Validation**: `leave_type.is_active == True`
- **Error Message**: "Selected leave type is not available"
- **Business Logic**: HR control over leave categories

### 2. Company Holidays

- **Rule**: Warning when leave dates fall on company holidays
- **Validation**: Check against holidays table
- **Implementation**: Soft validation (warning only)
- **Business Logic**: Employee awareness

## 💰 Leave Balance Validation Rules

### 1. Sufficient Balance

- **Rule**: Employee must have sufficient leave balance
- **Validation**: `available_balance - pending_days >= requested_days`
- **Error Message**: "Insufficient leave balance"
- **Business Logic**: Prevents over-allocation

### 2. Available Balance Calculation

```python
available_balance = allocated_days - used_days - pending_days + carried_forward_days
```

## 🔒 Access Control Validation Rules

### 1. Role-Based Access

- **Rule**: Only employees can create leave requests
- **Validation**: `user.role == UserRole.EMPLOYEE`
- **Error Message**: "Only employees can create leave requests"

### 2. Ownership Validation

- **Rule**: Employees can only modify their own requests
- **Validation**: `request.employee_id == current_user.employee.id`
- **Error Message**: "You can only modify your own leave requests"

### 3. Status-Based Modification

- **Rule**: Only pending requests can be modified
- **Validation**: `request.status == LeaveStatus.PENDING`
- **Error Message**: "Only pending leave requests can be modified"

## 📊 Validation Implementation Details

### Schema Level (Pydantic)

```python
@validator('start_date')
def validate_start_date_not_in_past(cls, v):
    today = date.today()
    if v < today:
        raise ValueError('Start date cannot be in the past')
    return v
```

### Service Level (Business Logic)

```python
def _validate_leave_request_business_rules(self, db, leave_request_data, employee_id):
    # Multiple validation checks
    self._has_overlapping_leave_requests()
    self._employee_on_probation()
    self._dates_fall_on_company_holidays()
    # ... more validations
```

### Database Level

- **Foreign Key Constraints**: Ensure valid employee and leave type IDs
- **Unique Constraints**: Prevent duplicate requests
- **Check Constraints**: Enforce date ranges

## 🚨 Error Handling

### Validation Error Responses

```json
{
  "detail": "Start date cannot be in the past",
  "status_code": 400,
  "error_type": "validation_error"
}
```

### Common Error Messages

1. **Date Validation**: Clear, specific date-related errors
2. **Business Rules**: Business logic explanation
3. **Access Control**: Permission-related messages
4. **System Errors**: Generic internal server errors

## 🔧 Configuration Options

### Configurable Parameters

```python
# These can be made configurable via environment variables or database
MAX_CONSECUTIVE_DAYS = 30
PROBATION_PERIOD_DAYS = 90
MAX_FUTURE_YEARS = 1
MIN_REASON_LENGTH = 10
MAX_REASON_LENGTH = 500
```

### Holiday Management

- **Static Holidays**: Common holidays (New Year, Christmas)
- **Dynamic Holidays**: Company-specific dates from database
- **Regional Holidays**: Country-specific holiday lists

## 🧪 Testing Validation Rules

### Test Scenarios

1. **Past Date**: Submit request with yesterday's date
2. **Future Year**: Submit request for next year
3. **Overlapping**: Submit request with overlapping dates
4. **Probation**: Submit request during probation period
5. **Insufficient Balance**: Submit request exceeding available balance
6. **Invalid Status**: Try to modify approved request

### Expected Results

- **400 Bad Request**: For validation errors
- **403 Forbidden**: For access control violations
- **422 Unprocessable Entity**: For Pydantic validation errors

## 📈 Performance Considerations

### Validation Optimization

- **Early Exit**: Stop validation on first failure
- **Database Queries**: Minimize database calls during validation
- **Caching**: Cache holiday lists and company policies
- **Async Processing**: Non-blocking validation where possible

### Monitoring

- **Validation Metrics**: Track validation failure rates
- **Performance Metrics**: Monitor validation response times
- **Error Logging**: Log all validation failures for analysis

## 🔮 Future Enhancements

### Planned Validations

1. **Workload Validation**: Check team workload during leave period
2. **Project Deadlines**: Validate against project timelines
3. **Seasonal Restrictions**: Holiday season leave limitations
4. **Manager Approval**: Multi-level approval workflows
5. **Leave Quotas**: Department/team leave quotas

### Advanced Features

1. **AI-Powered Validation**: Machine learning for anomaly detection
2. **Predictive Analytics**: Forecast leave impact on operations
3. **Integration Validation**: Check with external systems (payroll, HR)
4. **Compliance Validation**: Regulatory and policy compliance checks

---

## 📞 Support & Configuration

For questions about validation rules or to configure custom validations, please contact the development team.

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: Production Ready







