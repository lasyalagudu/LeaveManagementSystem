import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const EmployeeRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "employee") {
    // Redirect non-employees to their dashboard
    if (user.role === "hr") return <Navigate to="/hr/dashboard" replace />;
    if (user.role === "super_admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default EmployeeRoute;
