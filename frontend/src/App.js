import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Container } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import About from "./pages/About";
import EmployeeById from "./pages/admin/EmployeeById";
import Employees from "./pages/admin/Employees";
import ViewEmployee from "./pages/admin/ViewEmployee";
// Context
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Components
import Navigation from "./components/layout/Navigation";
import Footer from "./components/layout/Footer";

// Pages
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import LeaveRequests from "./pages/leave/LeaveRequests";
import MyLeaveRequests from "./pages/leave/MyLeaveRequests";
import CreateLeaveRequest from "./pages/leave/CreateLeaveRequest";
import MyLeaveBalances from "./pages/leave/MyLeaveBalances";
import LeaveTypes from "./pages/admin/LeaveTypes";

import Holidays from "./pages/admin/Holidays";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import EmployeesDashboard from "./pages/admin/EmployeesDashboard";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["hr", "super_admin"]}>
    {children}
  </ProtectedRoute>
);

// Super Admin Route Component
const SuperAdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={["super_admin"]}>{children}</ProtectedRoute>
);

function AppRoutes() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navigation />
        <Container className="flex-grow-1 py-4">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />

            {/* Protected Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/employees"
              element={
                <AdminRoute>
                  <EmployeesDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/hr/leave-requests"
              element={
                <AdminRoute>
                  {" "}
                  {/* Or HRRoute if you built one */}
                  <LeaveRequests />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/employees/add"
              element={
                <AdminRoute>
                  <Employees />
                  {/* existing add/edit modal component */}
                </AdminRoute>
              }
            />
            <Route
              path="/admin/employees/list"
              element={
                <AdminRoute>
                  <ViewEmployee />
                  {/* existing table component */}
                </AdminRoute>
              }
            />
            <Route
              path="/admin/employees/view"
              element={
                <AdminRoute>
                  <EmployeeById /> {/* new component to fetch by ID */}
                </AdminRoute>
              }
            />

            {/* Leave Management Routes */}
            <Route
              path="/leave/requests"
              element={
                <AdminRoute>
                  <LeaveRequests />
                </AdminRoute>
              }
            />
            <Route
              path="/leave/my-requests"
              element={
                <ProtectedRoute>
                  <MyLeaveRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/create"
              element={
                <ProtectedRoute>
                  <CreateLeaveRequest />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave/my-balances"
              element={
                <ProtectedRoute>
                  <MyLeaveBalances />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/leave-types"
              element={
                <AdminRoute>
                  <LeaveTypes />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <AdminRoute>
                  <Employees />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/holidays"
              element={
                <AdminRoute>
                  <Holidays />
                </AdminRoute>
              }
            />

            {/* Profile Route */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Container>
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  );
}

export default App;
