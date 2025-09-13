# 🚀 Frontend Setup Guide

## 📋 Prerequisites

Before setting up the frontend, ensure you have:

- **Node.js** (v16 or higher) installed
- **npm** or **yarn** package manager
- **Backend API** running on http://localhost:8000
- **Git** (optional, for version control)

## 🛠️ Installation Steps

### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected Output:**

```
added 1234 packages, and audited 1234 packages in 1m 23s
found 0 vulnerabilities
```

### Step 3: Start Development Server

```bash
npm start
```

**Expected Output:**

```
Compiled successfully!

You can now view lms-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.100:3000

Note that the development build is not optimized.
To create a production build, use npm run build.
```

### Step 4: Open Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Backend API Connection

The frontend is configured to proxy API requests to your backend. This is set in `package.json`:

```json
{
  "proxy": "http://localhost:8000"
}
```

**If your backend runs on a different port, update this value.**

### Environment Variables (Optional)

Create a `.env` file in the frontend directory for custom configuration:

```bash
# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_APP_NAME=Leave Management System
REACT_APP_VERSION=1.0.0
```

## 🎯 Available Scripts

| Command     | Description                 |
| ----------- | --------------------------- |
| `npm start` | Start development server    |
| `npm build` | Build for production        |
| `npm test`  | Run test suite              |
| `npm eject` | Eject from Create React App |

## 🌐 Access Points

### Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Demo Credentials

Use these credentials to test the system:

| Role            | Email                | Password |
| --------------- | -------------------- | -------- |
| **Super Admin** | admin@company.com    | admin123 |
| **HR Manager**  | hr@company.com       | hr123    |
| **Employee**    | employee@company.com | emp123   |

## 🎨 Features to Test

### 1. Authentication

- ✅ Login with different user roles
- ✅ JWT token management
- ✅ Role-based access control

### 2. Dashboard

- ✅ View statistics based on user role
- ✅ Interactive charts
- ✅ Quick action buttons

### 3. Leave Management

- ✅ Apply for leave (different types)
- ✅ Half-day and hourly leave support
- ✅ Date validation
- ✅ Form validation

### 4. Admin Features (HR/Super Admin)

- ✅ View all leave requests
- ✅ Approve/reject requests
- ✅ Manage leave types
- ✅ Manage holidays

## 🐛 Troubleshooting

### Common Issues & Solutions

#### 1. Port 3000 Already in Use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm start
```

#### 2. API Connection Failed

```bash
# Check if backend is running
curl http://localhost:8000/api/v1/health

# Verify proxy configuration in package.json
```

#### 3. Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Build Errors

```bash
# Check Node.js version
node --version

# Should be v16 or higher
```

### Development Tips

1. **Check Browser Console**: Look for JavaScript errors
2. **Network Tab**: Verify API calls are being made
3. **React DevTools**: Install browser extension for debugging
4. **Hot Reload**: Changes should reflect immediately

## 📱 Testing on Different Devices

### Mobile Testing

- Use browser dev tools device simulation
- Test responsive design
- Verify touch interactions

### Cross-Browser Testing

- Chrome (recommended for development)
- Firefox
- Safari
- Edge

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

### Deploy Options

- **Netlify**: Drag and drop `build` folder
- **Vercel**: Connect GitHub repository
- **AWS S3**: Upload `build` folder
- **GitHub Pages**: Use `gh-pages` package

## 📚 Additional Resources

### Documentation

- [React Documentation](https://reactjs.org/docs/)
- [React Bootstrap](https://react-bootstrap.github.io/)
- [Bootstrap 5](https://getbootstrap.com/docs/5.0/)

### Development Tools

- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

## 🎉 Success Indicators

You'll know the setup is successful when:

1. ✅ `npm install` completes without errors
2. ✅ `npm start` starts the development server
3. ✅ Browser opens to http://localhost:3000
4. ✅ Login page loads with demo credentials
5. ✅ You can log in with any demo account
6. ✅ Dashboard displays correctly
7. ✅ Navigation shows role-appropriate menu items

## 🆘 Getting Help

If you encounter issues:

1. **Check this guide** for common solutions
2. **Review console errors** in browser
3. **Verify backend** is running and accessible
4. **Check network tab** for failed API calls
5. **Open an issue** with detailed error description

---

**Happy Development! 🚀**









