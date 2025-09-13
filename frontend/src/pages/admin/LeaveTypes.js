import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Form,
  Modal,
  Alert,
  Spinner,
  ButtonGroup,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaCog,
  FaCheck,
  FaTimes,
  FaSave,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";

const LeaveTypes = () => {
  const { user } = useAuth();

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "casual",
    default_balance: 0,
    allow_carry_forward: false,
    max_carry_forward: 0,
    color_code: "#007bff",
    allow_half_day: true,
    allow_hourly: false,
    max_consecutive_days: 30,
    requires_approval: true,
    can_exceed_balance: false,
    requires_documentation: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingType, setDeletingType] = useState(null);

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/v1/leave/leave-types");
      setLeaveTypes(response.data);
    } catch (error) {
      console.error("Error fetching leave types:", error);
      toast.error("Failed to load leave types");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Leave type name is required";
    }

    if (formData.default_balance < 0) {
      newErrors.default_balance = "Default balance cannot be negative";
    }

    if (formData.max_carry_forward < 0) {
      newErrors.max_carry_forward = "Max carry forward cannot be negative";
    }

    if (formData.max_consecutive_days < 1) {
      newErrors.max_consecutive_days =
        "Max consecutive days must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      if (editingType) {
        // Update existing
        await axios.put(
          `/api/v1/leave/leave-types/${editingType.id}`,
          formData
        );
        toast.success("Leave type updated successfully!");
      } else {
        // Create new
        await axios.post("/api/v1/leave/leave-types", formData);
        toast.success("Leave type created successfully!");
      }

      fetchLeaveTypes();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving leave type:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to save leave type";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (leaveType) => {
    setEditingType(leaveType);
    setFormData({
      name: leaveType.name,
      description: leaveType.description || "",
      category: leaveType.category,
      default_balance: leaveType.default_balance,
      allow_carry_forward: leaveType.allow_carry_forward,
      max_carry_forward: leaveType.max_carry_forward,
      color_code: leaveType.color_code || "#007bff",
      allow_half_day: leaveType.allow_half_day,
      allow_hourly: leaveType.allow_hourly,
      max_consecutive_days: leaveType.max_consecutive_days,
      requires_approval: leaveType.requires_approval,
      can_exceed_balance: leaveType.can_exceed_balance,
      requires_documentation: leaveType.requires_documentation,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingType) return;

    try {
      await axios.delete(`/api/v1/leave/leave-types/${deletingType.id}`);
      toast.success("Leave type deleted successfully!");
      fetchLeaveTypes();
      setShowDeleteModal(false);
      setDeletingType(null);
    } catch (error) {
      console.error("Error deleting leave type:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to delete leave type";
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingType(null);
    setFormData({
      name: "",
      description: "",
      category: "casual",
      default_balance: 0,
      allow_carry_forward: false,
      max_carry_forward: 0,
      color_code: "#007bff",
      allow_half_day: true,
      allow_hourly: false,
      max_consecutive_days: 30,
      requires_approval: true,
      can_exceed_balance: false,
      requires_documentation: false,
    });
    setErrors({});
  };

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      casual: { variant: "info", text: "Casual" },
      sick: { variant: "warning", text: "Sick" },
      paid: { variant: "success", text: "Paid" },
      unpaid: { variant: "secondary", text: "Unpaid" },
      maternity: { variant: "primary", text: "Maternity" },
      paternity: { variant: "primary", text: "Paternity" },
    };

    const config = categoryConfig[category] || {
      variant: "secondary",
      text: category,
    };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge bg="success">Active</Badge>
    ) : (
      <Badge bg="secondary">Inactive</Badge>
    );
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading leave types...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <FaCalendarAlt className="me-2 text-primary" />
                Leave Types Management
              </h2>
              <p className="text-muted mb-0">
                Configure and manage different types of leaves
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <FaPlus className="me-2" />
              Add Leave Type
            </Button>
          </div>
        </Col>
      </Row>

      {/* Leave Types Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {leaveTypes.length > 0 ? (
            <Table responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Default Balance</th>
                  <th>Features</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map((leaveType) => (
                  <tr key={leaveType.id}>
                    <td>
                      <div className="fw-semibold">{leaveType.name}</div>
                      <small className="text-muted">
                        {leaveType.description}
                      </small>
                    </td>
                    <td>{getCategoryBadge(leaveType.category)}</td>
                    <td>
                      <span className="fw-bold">
                        {leaveType.default_balance}
                      </span>
                      <small className="text-muted d-block">days</small>
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {leaveType.allow_half_day && (
                          <Badge bg="info" className="small">
                            Half Day
                          </Badge>
                        )}
                        {leaveType.allow_hourly && (
                          <Badge bg="warning" className="small">
                            Hourly
                          </Badge>
                        )}
                        {leaveType.allow_carry_forward && (
                          <Badge bg="success" className="small">
                            Carry Forward
                          </Badge>
                        )}
                        {leaveType.requires_approval && (
                          <Badge bg="primary" className="small">
                            Approval Required
                          </Badge>
                        )}
                        {leaveType.can_exceed_balance && (
                          <Badge bg="danger" className="small">
                            Can Exceed
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(leaveType.is_active)}</td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-primary"
                          onClick={() => handleEdit(leaveType)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => {
                            setDeletingType(leaveType);
                            setShowDeleteModal(true);
                          }}
                        >
                          <FaTrash />
                        </Button>
                      </ButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <FaCalendarAlt className="text-muted mb-3" size={48} />
              <h5 className="text-muted">No leave types found</h5>
              <p className="text-muted small">
                Create your first leave type to get started
              </p>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                <FaPlus className="me-2" />
                Add Leave Type
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingType ? "Edit Leave Type" : "Add New Leave Type"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    isInvalid={!!errors.name}
                    placeholder="e.g., Casual Leave"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="paid">Paid Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                    <option value="maternity">Maternity Leave</option>
                    <option value="paternity">Paternity Leave</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this leave type"
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Default Balance (days) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="default_balance"
                    value={formData.default_balance}
                    onChange={handleInputChange}
                    min="0"
                    isInvalid={!!errors.default_balance}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.default_balance}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Consecutive Days</Form.Label>
                  <Form.Control
                    type="number"
                    name="max_consecutive_days"
                    value={formData.max_consecutive_days}
                    onChange={handleInputChange}
                    min="1"
                    isInvalid={!!errors.max_consecutive_days}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.max_consecutive_days}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Color Code</Form.Label>
                  <Form.Control
                    type="color"
                    name="color_code"
                    value={formData.color_code}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Features</Form.Label>
                  <div className="d-flex flex-column gap-2">
                    <Form.Check
                      type="checkbox"
                      id="allow_half_day"
                      name="allow_half_day"
                      checked={formData.allow_half_day}
                      onChange={handleInputChange}
                      label="Allow Half Day"
                    />
                    <Form.Check
                      type="checkbox"
                      id="allow_hourly"
                      name="allow_hourly"
                      checked={formData.allow_hourly}
                      onChange={handleInputChange}
                      label="Allow Hourly"
                    />
                    <Form.Check
                      type="checkbox"
                      id="requires_approval"
                      name="requires_approval"
                      checked={formData.requires_approval}
                      onChange={handleInputChange}
                      label="Requires Approval"
                    />
                  </div>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Advanced Options</Form.Label>
                  <div className="d-flex flex-column gap-2">
                    <Form.Check
                      type="checkbox"
                      id="allow_carry_forward"
                      name="allow_carry_forward"
                      checked={formData.allow_carry_forward}
                      onChange={handleInputChange}
                      label="Allow Carry Forward"
                    />
                    <Form.Check
                      type="checkbox"
                      id="can_exceed_balance"
                      name="can_exceed_balance"
                      checked={formData.can_exceed_balance}
                      onChange={handleInputChange}
                      label="Can Exceed Balance"
                    />
                    <Form.Check
                      type="checkbox"
                      id="requires_documentation"
                      name="requires_documentation"
                      checked={formData.requires_documentation}
                      onChange={handleInputChange}
                      label="Requires Documentation"
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {formData.allow_carry_forward && (
              <Form.Group className="mb-3">
                <Form.Label>Max Carry Forward (days)</Form.Label>
                <Form.Control
                  type="number"
                  name="max_carry_forward"
                  value={formData.max_carry_forward}
                  onChange={handleInputChange}
                  min="0"
                  isInvalid={!!errors.max_carry_forward}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.max_carry_forward}
                </Form.Control.Feedback>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (
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
                  {editingType ? "Update" : "Create"} Leave Type
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Leave Type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this leave type?</p>
          {deletingType && (
            <div className="bg-light p-3 rounded">
              <strong>Name:</strong> {deletingType.name}
              <br />
              <strong>Category:</strong> {deletingType.category}
              <br />
              <strong>Default Balance:</strong> {deletingType.default_balance}{" "}
              days
            </div>
          )}
          <Alert variant="warning" className="mt-3">
            <FaExclamationTriangle className="me-2" />
            <strong>Warning:</strong> This action cannot be undone. Any existing
            leave requests using this type will be affected.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <FaTrash className="me-2" />
            Delete Leave Type
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LeaveTypes;









