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
import LeaveBalances from "./pages/leave/LeaveBalances";
import MyLeaveBalances from "./pages/leave/MyLeaveBalances";
import LeaveTypes from "./pages/admin/LeaveTypes";
import Employees from "./pages/admin/Employees";
import Holidays from "./pages/admin/Holidays";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

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
              path="/leave/balances"
              element={
                <AdminRoute>
                  <LeaveBalances />
                </AdminRoute>
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





