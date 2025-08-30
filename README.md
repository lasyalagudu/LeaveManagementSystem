# Leave Management System

A comprehensive, production-ready Leave Management System built with Python FastAPI, PostgreSQL, and modern authentication practices. Designed for startups and enterprises with role-based access control, secure initialization, and complete audit trails.

## 🚀 Features

### Core Functionality

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Super Admin, HR, and Employee roles with secure onboarding
- **Leave Management**: Complete leave request workflow with approval/rejection
- **Leave Types**: Configurable leave categories with carry-forward rules
- **Balance Tracking**: Real-time leave balance calculation and management
- **Audit Trail**: Complete history of all actions and changes
- **Email Notifications**: Automated notifications for all system events

### Security Features

- **Secure Initialization**: Auto-creation of Super Admin with environment variables
- **Password Security**: Secure password setup with tokens and mandatory first-time changes
- **Role Enforcement**: Strict role-based access control throughout the system
- **Audit Logging**: Complete traceability of all system actions

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





