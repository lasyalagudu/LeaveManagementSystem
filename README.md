# Leave Management System

A comprehensive, production-ready Leave Management System built with Python FastAPI, PostgreSQL, and modern authentication practices. Designed for startups and enterprises with role-based access control, secure initialization, and complete audit trails.

## 🚀 Features
1. Authentication & Authorization
JWT-based authentication for secure access
Role-based access control (Super Admin, HR, Employee)
Password hashing and secure login
Session management and token expiration

2. User Management
Role-specific onboarding: Super Admin, HR, Employee
Employee profile creation and management
Manager assignment for hierarchical approvals
Update, deactivate, or delete user accounts

3. Leave Management

Full leave request workflow: apply, approve, reject, cancel
Multi-level approvals based on manager or HR
Leave request history per employee
Leave request comments/notes for context
Overlapping leave check: prevents multiple leaves for the same period
Validations performed:
Leave balance availability
Maximum allowed leaves per type
Probation period restrictions
Date validity (start date < end date, future dates only)
Manager approval required for certain leave types
Duplicate leave requests prevention

4. Leave Types
Configurable leave categories (Casual, Sick, Paid, Unpaid, etc.)
Custom leave policies (carry-forward, max per year, accrual rules)
Conditional leave rules (e.g., probation period restrictions)

5. Balance Tracking

Real-time leave balance updates
Automatic deduction on approval
Display of remaining, used, and pending leaves
Accrual and carry-forward calculations

6. Audit Trail
Complete logging of all actions (creation, update, approval, rejection)
Tracking who performed what action and when

7. Email Notifications
Automated notifications for leave requests, approvals, and rejections
Reminders for pending approvals

### Architecture

- **Clean Architecture**: Service layer, controllers, models, and schemas
- **Database Design**: Optimized PostgreSQL schema with proper relationships
- **API Design**: RESTful API following best practices
- **Scalability**: Built for enterprise deployment and growth

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI App  │    │  Service Layer │    │  PostgreSQL    │
│   (Controllers)│◄──►│  (Business      │◄──►│  (Database)    │
│                │    │   Logic)        │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Pydantic     │    │   Email         │    │   Audit Logs   │
│   Schemas      │    │   Service       │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🗄️ Database Schema

### Core Tables

- **users**: User accounts with authentication and roles
- **employees**: Employee details and information
- **leave_types**: Configurable leave categories
- **employee_leave_balances**: Leave balance tracking
- **leave_requests**: Leave applications and workflow
- **leave_request_audits**: Complete audit trail




### Key Relationships

- Users have roles (Super Admin, HR, Employee)
- Employees are linked to users
- Leave balances track allocations per employee/type/year
- All actions are logged in audit tables

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip/poetry

### 1. Clone and Setup

```bash
git clone <repository-url>
cd lms
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration

```bash
cp env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb lms_db

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost:5432/lms_db
```

### 4. Run the Application

```bash
# Start the application
uvicorn app.main:app --reload

# Or run directly
python -m app.main
```

### 5. Seed Development Data (Optional)

```bash
python app/seeder.py
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/lms_db

# JWT
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Super Admin
SUPER_ADMIN_EMAIL=ceo@yourcompany.com
SUPER_ADMIN_PASSWORD=ChangeMe123!
```

## 🔐 Authentication Flow

### 1. System Initialization

- Super Admin is auto-created on first startup
- Credentials come from environment variables
- First login requires password change

### 2. User Onboarding

- HR creates employee accounts
- Employees receive password setup emails
- Secure token-based password creation
- Mandatory first-time password setup

### 3. Role-Based Access

- **Super Admin**: Full system access, user management
- **HR**: Employee management, leave approval, leave type configuration
- **Employee**: Leave requests, profile management, balance viewing

## 📋 API Endpoints

1)Super-admin login 
http://127.0.0.1:8000/api/v1/auth/login
type : post
{
  "email": "alex@example.com",
  "password": "Test@123"
}

2)Add HR
type : post
http://127.0.0.1:8000/api/v1/users
{
  "email": "priya@example.com",
  "password": "test@123",
  "role": "hr",
  "first_name": "Priya",
  "last_name": "Sharma"
}
3)HR can add leave-types
http://127.0.0.1:8000/api/v1/leave-types
type : post
{
  "name": "Sick Leave",
  "description": "Medical leave requiring documentation",
  "category": "sick",
  "default_balance": 12,
  "allow_carry_forward": false,
  "max_carry_forward": 0,
  "allow_half_day": true,
  "allow_hourly": false,
  "max_consecutive_days": 10,
  "requires_approval": true,
  "can_exceed_balance": true,
  "requires_documentation": true
}
4)Admin can view hr 
type : GET
http://127.0.0.1:8000/api/v1/users/hr
5)
http://127.0.0.1:8000/api/v1/users/employees/onboard
type : post
{
    
  "email": "alice@gmail.com",
  "first_name": "manasa",
  "last_name": "veera",
  "employee_id": "EMP1001",
  "phone": "+91-9876543210",
  "department": "Engineering",
  "designation": "Intern",
  "joining_date": "2025-08-01",
  "manager_id": 1
}
6)get all employees details
type : GET
http://127.0.0.1:8000/api/v1/users/employees/list
7)get user by id
type : GET
http://127.0.0.1:8000/api/v1/users/5
8)get leave_types
type : GET
http://127.0.0.1:8000/api/v1/leave-types
9)update leave_type 
type : POST
http://127.0.0.1:8000/api/v1/leave-types/1
{
  "name": "Annual Leave Updated",
  "description": "Updated description",
  "max_days": 25,
  "is_active": true
}
10)get leave requests
type : GET
http://127.0.0.1:8000/api/v1/leave/requests
11)get all pending requests
type : GET
http://127.0.0.1:8000/api/v1/requests/pending
12)approve request
type : POST
http://127.0.0.1:8000/api/v1/requests/1/approve
13)reject leave request
type : POST
http://127.0.0.1:8000/api/v1/requests/1/reject
{"rejection_reason": "Project deadlines"}

### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/setup-password` - Password setup
- `POST /api/v1/auth/reset-password-request` - Password reset
- `POST /api/v1/auth/change-password` - Change password

### Users

- `POST /api/v1/users/` - Create user (Super Admin)
- `GET /api/v1/users/` - Get all users (Super Admin)
- `GET /api/v1/users/{user_id}` - Get user profile
- `PUT /api/v1/users/{user_id}` - Update user (Super Admin)

### Leave Management

- `POST /api/v1/leave/requests` - Create leave request
- `GET /api/v1/leave/requests` - Get leave requests
- `PUT /api/v1/leave/requests/{id}/approve` - Approve request
- `PUT /api/v1/leave/requests/{id}/reject` - Reject request

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Secure all sensitive configuration
2. **Database**: Use production PostgreSQL with proper backups
3. **Email**: Configure production SMTP or email service
4. **Security**: Enable HTTPS, configure CORS properly
5. **Monitoring**: Add logging and monitoring solutions

### Docker Deployment

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📊 Business Logic

### Leave Balance Calculation

- **Available Balance** = Allocated + Carried Forward - Used - Pending
- **Pro-rated Allocation**: Based on joining date for new employees
- **Carry Forward**: Configurable per leave type with limits

### Approval Workflow

1. Employee submits leave request
2. System validates balance and dates
3. HR receives notification
4. HR approves/rejects with comments
5. Employee receives decision notification
6. Balance updated automatically
7. Audit log created for all actions

## 🔍 Monitoring and Logging

- Structured logging throughout the application
- Audit trails for compliance and debugging
- Health check endpoints
- Error tracking and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

- [ ] Mobile app support
- [ ] Advanced reporting and analytics
- [ ] Integration with HR systems
- [ ] Multi-tenant support
- [ ] Advanced workflow customization
- [ ] API rate limiting and monitoring

---

**Built with ❤️ for modern enterprises**





