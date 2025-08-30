# Leave Management System - Frontend

A modern, responsive React-based frontend for the Leave Management System, built with React Bootstrap and integrated with a FastAPI backend.

## 🚀 Features

### **Authentication & User Management**

- **Secure Login System**: JWT-based authentication with role-based access control
- **Role-Based Navigation**: Different menu items and permissions based on user role
- **User Profile Management**: Update personal information and change passwords
- **First-Time Login**: Secure password setup for new employees

### **Employee Features**

- **Dashboard**: Personalized overview with leave statistics and quick actions
- **Leave Application**: Apply for different types of leave with validation
- **My Leave Requests**: View, filter, and manage personal leave applications
- **Leave Balances**: Monitor available leave balances with visual charts
- **Profile Management**: Update personal information and security settings

### **HR/Admin Features**

- **Leave Request Management**: Approve, reject, or modify employee leave requests
- **Employee Management**: Add, edit, and manage employee information
- **Leave Types Configuration**: Configure different leave categories and policies
- **Holiday Management**: Set company holidays and public holidays
- **Leave Balances Overview**: Monitor all employee leave balances across the organization

### **Super Admin Features**

- **System Administration**: Full access to all system features
- **User Management**: Create and manage HR users
- **System Configuration**: Configure global settings and policies

## 🛠️ Technology Stack

- **React 18**: Modern React with hooks and functional components
- **React Bootstrap**: UI components built on Bootstrap 5
- **React Router DOM**: Client-side routing and navigation
- **Axios**: HTTP client for API communication
- **React Hook Form**: Form handling and validation
- **React Datepicker**: Date selection components
- **React Toastify**: Toast notifications
- **Recharts**: Data visualization and charts
- **React Icons**: Icon library for consistent UI

## 📁 Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Navigation.js      # Main navigation component
│   │       └── Footer.js          # Footer component
│   ├── contexts/
│   │   └── AuthContext.js         # Authentication context
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login.js           # Login page
│   │   ├── admin/
│   │   │   ├── Employees.js       # Employee management
│   │   │   ├── Holidays.js        # Holiday management
│   │   │   ├── LeaveTypes.js      # Leave type configuration
│   │   │   └── LeaveBalances.js   # All employee balances
│   │   ├── leave/
│   │   │   ├── CreateLeaveRequest.js  # Leave application form
│   │   │   ├── LeaveRequests.js       # HR view of all requests
│   │   │   ├── MyLeaveRequests.js     # Employee view of own requests
│   │   │   └── MyLeaveBalances.js     # Employee view of own balances
│   │   ├── Dashboard.js           # Main dashboard
│   │   ├── Profile.js             # User profile management
│   │   └── NotFound.js            # 404 error page
│   ├── App.js                     # Main application component
│   └── index.js                   # Application entry point
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

## 🚀 Getting Started

### **Prerequisites**

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:8000`

### **Installation**

1. **Clone the repository and navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the development server:**

   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### **Build for Production**

```bash
npm run build
```

## 🔐 User Roles & Permissions

### **Employee**

- View personal dashboard
- Apply for leave
- View own leave requests and balances
- Update profile information
- Change password

### **HR Manager**

- All Employee permissions
- Approve/reject leave requests
- Manage employee information
- Configure leave types
- Set company holidays
- View all employee leave balances

### **Super Admin**

- All HR Manager permissions
- Create and manage HR users
- System-wide configuration
- Full administrative access

## 📱 Key Pages & Features

### **Dashboard (`/dashboard`)**

- **Employee View**: Personal leave statistics, recent requests, quick actions
- **HR/Admin View**: Organization-wide overview, pending requests, team statistics
- **Charts & Analytics**: Visual representation of leave data

### **Leave Application (`/leave/create`)**

- **Smart Form**: Dynamic fields based on leave type selection
- **Validation**: Real-time validation for dates, balance, and policies
- **Documentation**: Support for medical proof and other documents
- **Half-Day/Hourly**: Options for flexible leave durations

### **Leave Management (`/leave/requests`)**

- **Comprehensive View**: All employee leave requests with filtering
- **Quick Actions**: Approve, reject, or modify requests
- **Priority Indicators**: Visual cues for urgent requests
- **Search & Filter**: Find specific requests quickly

### **Employee Management (`/admin/employees`)**

- **CRUD Operations**: Add, edit, and manage employee information
- **Department Organization**: Group employees by department
- **Status Management**: Active/inactive employee tracking
- **Bulk Operations**: Manage multiple employees efficiently

### **Leave Types (`/admin/leave-types`)**

- **Policy Configuration**: Set rules for different leave categories
- **Advanced Options**: Carry forward, balance limits, approval requirements
- **Duration Support**: Full day, half-day, and hourly leave options
- **Documentation Rules**: Configure required documentation per leave type

### **Holiday Management (`/admin/holidays`)**

- **Company Calendar**: Set recurring and one-time holidays
- **Year Management**: Organize holidays by calendar year
- **Status Control**: Active/inactive holiday management
- **Description Support**: Add context for each holiday

### **Leave Balances (`/admin/leave-balances`)**

- **Organization Overview**: All employee balances in one view
- **Analytics Dashboard**: Charts and statistics for leave utilization
- **Filtering Options**: Search by employee, department, or leave type
- **Export Capabilities**: Generate reports for analysis

## 🎨 UI/UX Features

### **Responsive Design**

- Mobile-first approach
- Bootstrap 5 responsive grid system
- Adaptive navigation for different screen sizes

### **Visual Feedback**

- Loading states with spinners
- Success/error notifications
- Progress indicators for forms
- Color-coded status badges

### **Interactive Elements**

- Hover effects and transitions
- Modal dialogs for confirmations
- Collapsible sections
- Sortable and filterable tables

### **Data Visualization**

- Pie charts for leave type distribution
- Bar charts for employee utilization
- Progress bars for balance status
- Interactive tooltips and legends

## 🔧 Configuration

### **Environment Variables**

The frontend is configured to proxy API requests to `http://localhost:8000` by default. You can modify this in `package.json`:

```json
{
  "proxy": "http://localhost:8000"
}
```

### **API Endpoints**

All API calls use relative paths that are automatically proxied to the backend:

- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/employees/*` - Employee management
- `/api/v1/leave/*` - Leave management
- `/api/v1/users/*` - User management

## 🧪 Testing

### **Run Tests**

```bash
npm test
```

### **Test Coverage**

```bash
npm run test -- --coverage
```

## 📦 Build & Deployment

### **Development Build**

```bash
npm start
```

### **Production Build**

```bash
npm run build
```

### **Build Output**

The production build creates a `build/` directory with optimized static files ready for deployment.

## 🚀 Deployment Options

### **Static Hosting**

- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

### **Container Deployment**

```dockerfile
FROM nginx:alpine
COPY build/ /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions per user role
- **Input Validation**: Client-side and server-side validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based request validation

## 📊 Performance Features

- **Code Splitting**: Lazy loading of route components
- **Optimized Bundles**: Webpack optimization for production
- **Image Optimization**: Compressed and optimized assets
- **Caching Strategies**: Browser caching for static assets
- **Lazy Loading**: On-demand component loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the documentation
- Review existing issues
- Create a new issue with detailed information

## 🔄 Updates & Maintenance

### **Regular Updates**

- Keep dependencies updated
- Monitor for security vulnerabilities
- Update React and related packages
- Test compatibility with new versions

### **Backup & Recovery**

- Regular backups of configuration
- Version control for all changes
- Rollback procedures for deployments
- Monitoring and alerting setup

---

**Built with ❤️ using React and Bootstrap**
