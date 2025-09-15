import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Navbar, Nav, Container, Dropdown, Badge } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { FaHome, FaUser, FaSignOutAlt, FaBell } from "react-icons/fa";

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  if (!isAuthenticated) return null;

  const getRoleDisplayName = (role) => {
    const roleNames = {
      super_admin: "Super Admin",
      hr: "HR Manager",
      employee: "Employee",
    };
    return roleNames[role] || role;
  };

  return (
    <Navbar
      bg="primary"
      variant="dark"
      expand="lg"
      className="shadow-sm"
      expanded={expanded}
      onToggle={(val) => setExpanded(val)}
    >
      <Container>
        <Navbar.Brand as={Link} to="/dashboard" className="fw-bold">
          <FaHome className="me-2" /> LMS
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard" active={isActive("/dashboard")}>
              Home
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/about"
              active={isActive("/about")}
              onClick={() => setExpanded(false)}
            >
              About
            </Nav.Link>
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

            {/* User Dropdown */}
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
                  Profile
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout} className="text-danger">
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



