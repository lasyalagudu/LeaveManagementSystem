# Employee-Side Features - Leave Management System

This document outlines all the employee-side features that have been implemented in the Leave Management System.

## 🎯 Overview

The system provides comprehensive employee self-service capabilities for managing leave requests, viewing balances, and tracking application status. All endpoints are secured with role-based access control, ensuring employees can only access their own data.

## 🔐 Authentication & Security

- **JWT-based authentication** required for all endpoints
- **Role-based access control** - employees can only access their own data
- **Secure password management** with first-time login enforcement
- **Session management** with token refresh capabilities

## 📋 Leave Request Management

### 1. Apply for Leave

- **Endpoint**: `POST /leave/requests`
- **Access**: Employee only
- **Features**:
  - Submit new leave requests with start/end dates
  - Automatic calculation of leave days (excluding weekends)
  - Real-time leave balance validation
  - Automatic pending days allocation
  - Email notification to HR
  - Audit trail creation

**Request Body**:

```json
{
  "leave_type_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-17",
  "reason": "Personal vacation"
}
```

### 2. View My Leave Requests

- **Endpoint**: `GET /leave/my-requests`
- **Access**: Employee only
- **Features**:
  - View all personal leave requests
  - Optional status filtering (pending, approved, rejected, cancelled)
  - Chronological ordering (newest first)
  - Complete request details including status and approval info

**Query Parameters**:

- `status` (optional): Filter by status

### 3. View Specific Leave Request

- **Endpoint**: `GET /leave/my-requests/{request_id}`
- **Access**: Employee only (own requests)
- **Features**:
  - Detailed view of specific leave request
  - Status tracking
  - Approval/rejection details
  - Comments and audit information

### 4. Modify Leave Request

- **Endpoint**: `PUT /leave/my-requests/{request_id}`
- **Access**: Employee only (own requests)
- **Features**:
  - Modify pending leave requests only
  - Update start/end dates, reason
  - Automatic recalculation of leave days
  - Leave balance revalidation
  - Audit trail for all changes
  - Automatic pending days adjustment

**Request Body**:

```json
{
  "start_date": "2024-01-16",
  "end_date": "2024-01-18",
  "reason": "Updated vacation plans"
}
```

### 5. Cancel Leave Request

- **Endpoint**: `PUT /leave/my-requests/{request_id}/cancel`
- **Access**: Employee only (own requests)
- **Features**:
  - Cancel pending or approved requests
  - Automatic leave balance restoration
  - Audit trail creation
  - Optional cancellation comments

**Query Parameters**:

- `comments` (optional): Cancellation reason

## 💰 Leave Balance Management

### 1. View My Leave Balances

- **Endpoint**: `GET /leave/my-balances`
- **Access**: Employee only
- **Features**:
  - View all leave type balances
  - Current year balances by default
  - Optional year filtering
  - Real-time calculations including:
    - Allocated days
    - Used days
    - Pending days
    - Carried forward days
    - Available balance

**Query Parameters**:

- `year` (optional): Specific year (defaults to current year)

**Response**:

```json
[
  {
    "id": 1,
    "leave_type_id": 1,
    "leave_type_name": "Annual Leave",
    "year": 2024,
    "allocated_days": 25,
    "used_days": 5,
    "pending_days": 3,
    "carried_forward_days": 2,
    "available_balance": 19
  }
]
```

## 📊 Additional Employee Features

### 1. View Leave Types

- **Endpoint**: `GET /leave/types`
- **Access**: All authenticated users
- **Features**:
  - View available leave categories
  - Leave type descriptions
  - Default balances and policies
  - Active/inactive status

### 2. View Request Audit Trail

- **Endpoint**: `GET /leave/requests/{request_id}/audit`
- **Access**: Employee (own requests), HR, Super Admin
- **Features**:
  - Complete history of request changes
  - Approval/rejection details
  - Modification history
  - Timestamps and user actions
  - Comments and reasons

## 🔄 Business Logic & Validation

### Leave Request Validation

- **Date validation**: End date must be after start date
- **Leave balance check**: Sufficient available balance required
- **Status restrictions**: Only pending requests can be modified
- **Weekend exclusion**: Automatic calculation excludes weekends

### Leave Balance Management

- **Real-time updates**: Automatic balance adjustments
- **Pending days**: Reserved when request is submitted
- **Used days**: Updated when request is approved
- **Carry forward**: Automatic year-end processing
- **Policy enforcement**: Respects leave type limits

### Audit & Compliance

- **Complete audit trail**: All actions logged
- **User tracking**: Who performed what action
- **Timestamp recording**: When actions occurred
- **Status history**: Complete change tracking
- **Comment logging**: Reasons for changes

## 📧 Email Notifications

### Employee Notifications

- **Leave submission**: Confirmation of request creation
- **Approval notification**: When request is approved
- **Rejection notification**: When request is rejected (with reason)
- **Modification confirmation**: When request is updated
- **Cancellation confirmation**: When request is cancelled

## 🚀 API Usage Examples

### Complete Leave Request Workflow

1. **Submit Leave Request**:

```bash
POST /leave/requests
Authorization: Bearer <jwt_token>
{
  "leave_type_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-17",
  "reason": "Personal vacation"
}
```

2. **Check Request Status**:

```bash
GET /leave/my-requests
Authorization: Bearer <jwt_token>
```

3. **Modify Request** (if pending):

```bash
PUT /leave/my-requests/123
Authorization: Bearer <jwt_token>
{
  "start_date": "2024-01-16",
  "end_date": "2024-01-18"
}
```

4. **Cancel Request** (if needed):

```bash
PUT /leave/my-requests/123/cancel?comments=Change of plans
Authorization: Bearer <jwt_token>
```

5. **View Leave Balances**:

```bash
GET /leave/my-balances
Authorization: Bearer <jwt_token>
```

## 🔒 Security Features

### Access Control

- **Own data only**: Employees can only access their own information
- **Role validation**: Endpoint-level role checking
- **Token verification**: JWT token validation on every request
- **Session management**: Secure token handling

### Data Protection

- **Input validation**: All data validated before processing
- **SQL injection protection**: Parameterized queries
- **XSS prevention**: Input sanitization
- **CSRF protection**: Token-based request validation

## 📱 Frontend Integration

### Recommended UI Components

- **Leave Request Form**: Date pickers, leave type selector, reason input
- **Request Dashboard**: Status overview, pending requests, recent activity
- **Balance Display**: Visual representation of leave balances
- **Request History**: Detailed view with modification options
- **Notification Center**: Status updates and alerts

### User Experience Features

- **Real-time updates**: Immediate feedback on actions
- **Validation feedback**: Clear error messages
- **Status indicators**: Visual status representation
- **Responsive design**: Mobile-friendly interface
- **Accessibility**: Screen reader support

## 🧪 Testing & Validation

### Test Scenarios

- **Leave submission**: Valid and invalid data
- **Modification**: Date changes, reason updates
- **Cancellation**: Different request statuses
- **Balance validation**: Insufficient balance scenarios
- **Access control**: Unauthorized access attempts

### Validation Rules

- **Date ranges**: Business day calculations
- **Leave limits**: Policy enforcement
- **Status transitions**: Valid state changes
- **User permissions**: Role-based access

## 📈 Performance & Scalability

### Optimization Features

- **Database indexing**: Optimized queries for large datasets
- **Caching**: Frequently accessed data caching
- **Async processing**: Non-blocking operations
- **Connection pooling**: Efficient database connections

### Monitoring

- **Request logging**: API call tracking
- **Performance metrics**: Response time monitoring
- **Error tracking**: Exception logging and alerting
- **Usage analytics**: Feature utilization tracking

## 🔮 Future Enhancements

### Planned Features

- **Mobile app**: Native mobile application
- **Calendar integration**: Outlook/Google Calendar sync
- **Advanced reporting**: Personal leave analytics
- **Notification preferences**: Customizable alerts
- **Bulk operations**: Multiple request management

### Integration Opportunities

- **HR systems**: Integration with existing HR platforms
- **Payroll systems**: Automatic leave deduction
- **Time tracking**: Integration with time management tools
- **Communication platforms**: Slack/Teams notifications

---

## 📞 Support & Documentation

For technical support or feature requests, please contact the development team or refer to the main system documentation.

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: Production Ready





