import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Navbar,
  Nav,
  Container,
  Button,
  Dropdown,
  Badge,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaHome,
  FaCalendarAlt,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaUser,
  FaBell,
  FaPlus,
} from "react-icons/fa";

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      super_admin: "Super Admin",
      hr: "HR Manager",
      employee: "Employee",
    };
    return roleNames[role] || role;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Navbar
      bg="primary"
      variant="dark"
      expand="lg"
      className="shadow-sm"
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <Container>
        <Navbar.Brand as={Link} to="/dashboard" className="fw-bold">
          <FaHome className="me-2" />
          LMS
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/dashboard"
              active={isActive("/dashboard")}
              onClick={() => setExpanded(false)}
            >
              <FaHome className="me-1" />
              Dashboard
            </Nav.Link>

            {/* Leave Management */}
            <Nav.Link
              as={Link}
              to="/leave/my-requests"
              active={isActive("/leave/my-requests")}
              onClick={() => setExpanded(false)}
            >
              <FaCalendarAlt className="me-1" />
              My Leaves
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/leave/create"
              active={isActive("/leave/create")}
              onClick={() => setExpanded(false)}
            >
              <FaPlus className="me-1" />
              Apply Leave
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/leave/my-balances"
              active={isActive("/leave/my-balances")}
              onClick={() => setExpanded(false)}
            >
              <FaCalendarAlt className="me-1" />
              My Balances
            </Nav.Link>

            {/* Admin Only Links */}
            {(user?.role === "hr" || user?.role === "super_admin") && (
              <>
                <Nav.Link
                  as={Link}
                  to="/leave/requests"
                  active={isActive("/leave/requests")}
                  onClick={() => setExpanded(false)}
                >
                  <FaCalendarAlt className="me-1" />
                  All Requests
                  <Badge bg="warning" text="dark" className="ms-1">
                    Pending
                  </Badge>
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to="/leave/balances"
                  active={isActive("/leave/balances")}
                  onClick={() => setExpanded(false)}
                >
                  <FaCalendarAlt className="me-1" />
                  All Balances
                </Nav.Link>
              </>
            )}

            {/* HR and Super Admin Only */}
            {(user?.role === "hr" || user?.role === "super_admin") && (
              <>
                <Nav.Link
                  as={Link}
                  to="/admin/leave-types"
                  active={isActive("/admin/leave-types")}
                  onClick={() => setExpanded(false)}
                >
                  <FaCog className="me-1" />
                  Leave Types
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to="/admin/employees"
                  active={isActive("/admin/employees")}
                  onClick={() => setExpanded(false)}
                >
                  <FaUsers className="me-1" />
                  Employees
                </Nav.Link>

                <Nav.Link
                  as={Link}
                  to="/admin/holidays"
                  active={isActive("/admin/holidays")}
                  onClick={() => setExpanded(false)}
                >
                  <FaCalendarAlt className="me-1" />
                  Holidays
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav className="ms-auto">
            {/* Notifications */}
            <Nav.Link className="position-relative me-3">
              <FaBell className="fs-5" />
              <Badge
                bg="danger"
                className="position-absolute top-0 start-100 translate-middle rounded-pill"
                style={{ fontSize: "0.6rem" }}
              >
                3
              </Badge>
            </Nav.Link>

            {/* User Menu */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" id="dropdown-user">
                <FaUser className="me-1" />
                {user?.first_name} {user?.last_name}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Header>
                  <div className="fw-bold">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-muted small">{user?.email}</div>
                  <Badge bg="secondary" className="mt-1">
                    {getRoleDisplayName(user?.role)}
                  </Badge>
                </Dropdown.Header>
                <Dropdown.Divider />

                <Dropdown.Item as={Link} to="/profile">
                  <FaUser className="me-2" />
                  Profile
                </Dropdown.Item>

                <Dropdown.Divider />

                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <FaSignOutAlt className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;





