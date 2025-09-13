import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
  Tab,
  Tabs,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import {
  FaUser,
  FaBuilding,
  FaCalendarAlt,
  FaShieldAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaKey,
} from "react-icons/fa";
import { toast } from "react-toastify";

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateProfile = () => {
    const newErrors = {};

    if (!profileData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!profileData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!profileData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.current_password) {
      newErrors.current_password = "Current password is required";
    }

    if (!passwordData.new_password) {
      newErrors.new_password = "New password is required";
    } else if (passwordData.new_password.length < 6) {
      newErrors.new_password = "New password must be at least 6 characters";
    }

    if (!passwordData.confirm_password) {
      newErrors.confirm_password = "Please confirm your new password";
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfile()) {
      return;
    }

    setLoading(true);

    try {
      const result = await updateProfile(profileData);

      if (result.success) {
        toast.success("Profile updated successfully!");
        setEditing(false);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(
        passwordData.current_password,
        passwordData.new_password
      );

      if (result.success) {
        toast.success("Password changed successfully!");
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      super_admin: "Super Admin",
      hr: "HR Manager",
      employee: "Employee",
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: "danger",
      hr: "warning",
      employee: "info",
    };
    return colors[role] || "secondary";
  };

  if (!user) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading profile...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="mb-1">
            <FaUser className="me-2 text-primary" />
            My Profile
          </h2>
          <p className="text-muted mb-0">
            Manage your account information and settings
          </p>
        </Col>
      </Row>

      <Row>
        <Col lg={4} className="mb-4">
          {/* Profile Card */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center p-4">
              <div
                className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "80px", height: "80px" }}
              >
                <FaUser size={32} />
              </div>

              <h4 className="mb-1">
                {user.first_name} {user.last_name}
              </h4>

              <p className="text-muted mb-2">{user.email}</p>

              <Badge bg={getRoleBadgeColor(user.role)} className="mb-3">
                {getRoleDisplayName(user.role)}
              </Badge>

              <div className="text-start small">
                <div className="mb-2">
                  <FaBuilding className="me-2 text-muted" />
                  <span className="text-muted">Department:</span>{" "}
                  {user.department || "Not specified"}
                </div>
                <div className="mb-2">
                  <FaCalendarAlt className="me-2 text-muted" />
                  <span className="text-muted">Member since:</span>{" "}
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Unknown"}
                </div>
                <div>
                  <FaShieldAlt className="me-2 text-muted" />
                  <span className="text-muted">Status:</span>{" "}
                  {user.is_active ? "Active" : "Inactive"}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <Tabs defaultActiveKey="profile" className="mb-0">
                <Tab eventKey="profile" title="Profile Information">
                  <div className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Personal Information</h5>
                      {!editing && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => setEditing(true)}
                        >
                          <FaEdit className="me-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>

                    <Form onSubmit={handleProfileSubmit}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>First Name *</Form.Label>
                            <Form.Control
                              type="text"
                              name="first_name"
                              value={profileData.first_name}
                              onChange={handleProfileChange}
                              disabled={!editing}
                              isInvalid={!!errors.first_name}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.first_name}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Last Name *</Form.Label>
                            <Form.Control
                              type="text"
                              name="last_name"
                              value={profileData.last_name}
                              onChange={handleProfileChange}
                              disabled={!editing}
                              isInvalid={!!errors.last_name}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.last_name}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email Address *</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={profileData.email}
                              onChange={handleProfileChange}
                              disabled={!editing}
                              isInvalid={!!errors.email}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.email}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={profileData.phone}
                              onChange={handleProfileChange}
                              disabled={!editing}
                              placeholder="Optional"
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      {editing && (
                        <div className="d-flex gap-2 justify-content-end">
                          <Button
                            type="button"
                            variant="outline-secondary"
                            onClick={() => {
                              setEditing(false);
                              setErrors({});
                              // Reset to original values
                              setProfileData({
                                first_name: user.first_name || "",
                                last_name: user.last_name || "",
                                email: user.email || "",
                                phone: user.phone || "",
                              });
                            }}
                            disabled={loading}
                          >
                            <FaTimes className="me-2" />
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="me-2"
                                />
                                Saving...
                              </>
                            ) : (
                              <>
                                <FaSave className="me-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </Form>
                  </div>
                </Tab>

                <Tab eventKey="password" title="Change Password">
                  <div className="p-4">
                    <h5 className="mb-3">Change Password</h5>
                    <Alert variant="info">
                      <FaKey className="me-2" />
                      <strong>Password Requirements:</strong> Your new password
                      must be at least 6 characters long.
                    </Alert>

                    <Form onSubmit={handlePasswordSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Current Password *</Form.Label>
                        <Form.Control
                          type="password"
                          name="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          isInvalid={!!errors.current_password}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.current_password}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>New Password *</Form.Label>
                            <Form.Control
                              type="password"
                              name="new_password"
                              value={passwordData.new_password}
                              onChange={handlePasswordChange}
                              isInvalid={!!errors.new_password}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.new_password}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Confirm New Password *</Form.Label>
                            <Form.Control
                              type="password"
                              name="confirm_password"
                              value={passwordData.confirm_password}
                              onChange={handlePasswordChange}
                              isInvalid={!!errors.confirm_password}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.confirm_password}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-end">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Changing Password...
                            </>
                          ) : (
                            <>
                              <FaKey className="me-2" />
                              Change Password
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;









