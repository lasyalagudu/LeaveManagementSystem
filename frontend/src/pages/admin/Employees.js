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
  InputGroup,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaUserPlus,
  FaSave,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";

const Employees = () => {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    hire_date: "",
    salary: "",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/v1/employees");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
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

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.department.trim()) {
      newErrors.department = "Department is required";
    }

    if (!formData.position.trim()) {
      newErrors.position = "Position is required";
    }

    if (!formData.hire_date) {
      newErrors.hire_date = "Hire date is required";
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
      if (editingEmployee) {
        // Update existing
        await axios.put(`/api/v1/employees/${editingEmployee.id}`, formData);
        toast.success("Employee updated successfully!");
      } else {
        // Create new
        await axios.post("/api/v1/employees", formData);
        toast.success("Employee created successfully!");
      }

      fetchEmployees();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving employee:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to save employee";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department || "",
      position: employee.position || "",
      hire_date: employee.hire_date || "",
      salary: employee.salary || "",
      is_active: employee.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;

    try {
      await axios.delete(`/api/v1/employees/${deletingEmployee.id}`);
      toast.success("Employee deleted successfully!");
      fetchEmployees();
      setShowDeleteModal(false);
      setDeletingEmployee(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to delete employee";
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      hire_date: "",
      salary: "",
      is_active: true,
    });
    setErrors({});
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge bg="success">Active</Badge>
    ) : (
      <Badge bg="secondary">Inactive</Badge>
    );
  };

  const getDepartmentBadge = (department) => {
    const departmentColors = {
      IT: "primary",
      HR: "info",
      Finance: "success",
      Marketing: "warning",
      Sales: "danger",
      Operations: "secondary",
    };

    const color = departmentColors[department] || "secondary";
    return <Badge bg={color}>{department}</Badge>;
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || employee.department === departmentFilter;
    const matchesStatus =
      statusFilter === "all" ||
      employee.is_active === (statusFilter === "active");

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [
    ...new Set(employees.map((emp) => emp.department).filter(Boolean)),
  ];

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading employees...</p>
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
                <FaUsers className="me-2 text-primary" />
                Employees Management
              </h2>
              <p className="text-muted mb-0">
                Manage employee information and profiles
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <FaUserPlus className="me-2" />
              Add Employee
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Row className="mb-4">
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setSearchTerm("");
              setDepartmentFilter("all");
              setStatusFilter("all");
            }}
          >
            <FaFilter className="me-2" />
            Clear
          </Button>
        </Col>
      </Row>

      {/* Results Summary */}
      <Row className="mb-3">
        <Col>
          <Alert variant="info" className="mb-0">
            Showing {filteredEmployees.length} of {employees.length} employees
          </Alert>
        </Col>
      </Row>

      {/* Employees Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {filteredEmployees.length > 0 ? (
            <Table responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Contact</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                          style={{ width: "32px", height: "32px" }}
                        >
                          <FaUsers size={14} />
                        </div>
                        <div>
                          <div className="fw-semibold">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <small className="text-muted">
                            ID: {employee.id}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{getDepartmentBadge(employee.department)}</td>
                    <td>
                      <div className="fw-semibold">{employee.position}</div>
                      {employee.salary && (
                        <small className="text-muted">
                          ${employee.salary.toLocaleString()}
                        </small>
                      )}
                    </td>
                    <td>
                      <div>{employee.email}</div>
                      {employee.phone && (
                        <small className="text-muted">{employee.phone}</small>
                      )}
                    </td>
                    <td>
                      {employee.hire_date
                        ? new Date(employee.hire_date).toLocaleDateString()
                        : "Not specified"}
                    </td>
                    <td>{getStatusBadge(employee.is_active)}</td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-primary"
                          onClick={() => handleEdit(employee)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => {
                            setDeletingEmployee(employee);
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
              <FaUsers className="text-muted mb-3" size={48} />
              <h5 className="text-muted">No employees found</h5>
              <p className="text-muted small">
                {searchTerm ||
                departmentFilter !== "all" ||
                statusFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Add your first employee to get started"}
              </p>
              {!searchTerm &&
                departmentFilter === "all" &&
                statusFilter === "all" && (
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    <FaUserPlus className="me-2" />
                    Add Employee
                  </Button>
                )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEmployee ? "Edit Employee" : "Add New Employee"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    isInvalid={!!errors.first_name}
                    placeholder="Enter first name"
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
                    value={formData.last_name}
                    onChange={handleInputChange}
                    isInvalid={!!errors.last_name}
                    placeholder="Enter last name"
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
                    value={formData.email}
                    onChange={handleInputChange}
                    isInvalid={!!errors.email}
                    placeholder="Enter email address"
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
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number (optional)"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department *</Form.Label>
                  <Form.Control
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    isInvalid={!!errors.department}
                    placeholder="Enter department"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.department}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Position *</Form.Label>
                  <Form.Control
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    isInvalid={!!errors.position}
                    placeholder="Enter position"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.position}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hire Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    isInvalid={!!errors.hire_date}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.hire_date}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Salary</Form.Label>
                  <Form.Control
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="Enter annual salary (optional)"
                    min="0"
                    step="1000"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                label="Employee is active"
              />
            </Form.Group>
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
                  {editingEmployee ? "Update" : "Create"} Employee
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this employee?</p>
          {deletingEmployee && (
            <div className="bg-light p-3 rounded">
              <strong>Name:</strong> {deletingEmployee.first_name}{" "}
              {deletingEmployee.last_name}
              <br />
              <strong>Department:</strong> {deletingEmployee.department}
              <br />
              <strong>Position:</strong> {deletingEmployee.position}
            </div>
          )}
          <Alert variant="warning" className="mt-3">
            <FaExclamationTriangle className="me-2" />
            <strong>Warning:</strong> This action cannot be undone. The employee
            will be permanently removed from the system.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <FaTrash className="me-2" />
            Delete Employee
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Employees;





