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
  FaCalendarDay,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaSave,
  FaExclamationTriangle,
  FaCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";

const Holidays = () => {
  const { user } = useAuth();

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    description: "",
    is_recurring: true,
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/v1/leave/holidays");
      setHolidays(response.data);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Failed to load holidays");
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

    if (!formData.date) {
      newErrors.date = "Holiday date is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Holiday name is required";
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
      if (editingHoliday) {
        // Update existing
        await axios.put(
          `/api/v1/leave/holidays/${editingHoliday.id}`,
          formData
        );
        toast.success("Holiday updated successfully!");
      } else {
        // Create new
        await axios.post("/api/v1/leave/holidays", formData);
        toast.success("Holiday created successfully!");
      }

      fetchHolidays();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving holiday:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to save holiday";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      date: holiday.date || "",
      name: holiday.name || "",
      description: holiday.description || "",
      is_recurring: holiday.is_recurring,
      is_active: holiday.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingHoliday) return;

    try {
      await axios.delete(`/api/v1/leave/holidays/${deletingHoliday.id}`);
      toast.success("Holiday deleted successfully!");
      fetchHolidays();
      setShowDeleteModal(false);
      setDeletingHoliday(null);
    } catch (error) {
      console.error("Error deleting holiday:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to delete holiday";
      toast.error(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingHoliday(null);
    setFormData({
      date: "",
      name: "",
      description: "",
      is_recurring: true,
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

  const getRecurringBadge = (isRecurring) => {
    return isRecurring ? (
      <Badge bg="info">Recurring</Badge>
    ) : (
      <Badge bg="warning">One-time</Badge>
    );
  };

  const getYearFromDate = (dateString) => {
    return new Date(dateString).getFullYear();
  };

  const filteredHolidays = holidays.filter((holiday) => {
    const matchesSearch =
      holiday.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      holiday.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesYear = getYearFromDate(holiday.date) === parseInt(yearFilter);
    const matchesStatus =
      statusFilter === "all" ||
      holiday.is_active === (statusFilter === "active");

    return matchesSearch && matchesYear && matchesStatus;
  });

  const availableYears = [
    ...new Set(holidays.map((h) => getYearFromDate(h.date))),
  ].sort((a, b) => b - a);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading holidays...</p>
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
                <FaCalendarDay className="me-2 text-primary" />
                Holidays Management
              </h2>
              <p className="text-muted mb-0">
                Manage company holidays and public holidays
              </p>
            </div>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <FaPlus className="me-2" />
              Add Holiday
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
              placeholder="Search by holiday name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={yearFilter}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
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
              setYearFilter(new Date().getFullYear());
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
            Showing {filteredHolidays.length} of {holidays.length} holidays for{" "}
            {yearFilter}
          </Alert>
        </Col>
      </Row>

      {/* Holidays Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {filteredHolidays.length > 0 ? (
            <Table responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Holiday</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHolidays.map((holiday) => (
                  <tr key={holiday.id}>
                    <td>
                      <div className="fw-semibold">{holiday.name}</div>
                      <small className="text-muted">ID: {holiday.id}</small>
                    </td>
                    <td>
                      <div className="fw-semibold">
                        {new Date(holiday.date).toLocaleDateString()}
                      </div>
                      <small className="text-muted">
                        {new Date(holiday.date).toLocaleDateString("en-US", {
                          weekday: "long",
                        })}
                      </small>
                    </td>
                    <td>{getRecurringBadge(holiday.is_recurring)}</td>
                    <td>
                      <div
                        className="text-truncate"
                        style={{ maxWidth: "200px" }}
                      >
                        {holiday.description || "No description"}
                      </div>
                    </td>
                    <td>{getStatusBadge(holiday.is_active)}</td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-primary"
                          onClick={() => handleEdit(holiday)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => {
                            setDeletingHoliday(holiday);
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
              <FaCalendarDay className="text-muted mb-3" size={48} />
              <h5 className="text-muted">No holidays found</h5>
              <p className="text-muted small">
                {searchTerm ||
                yearFilter !== new Date().getFullYear() ||
                statusFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Add your first holiday to get started"}
              </p>
              {!searchTerm &&
                yearFilter === new Date().getFullYear() &&
                statusFilter === "all" && (
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    <FaPlus className="me-2" />
                    Add Holiday
                  </Button>
                )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingHoliday ? "Edit Holiday" : "Add New Holiday"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Holiday Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                isInvalid={!!errors.name}
                placeholder="e.g., Independence Day"
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date *</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                isInvalid={!!errors.date}
              />
              <Form.Control.Feedback type="invalid">
                {errors.date}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the holiday (optional)"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="is_recurring"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleInputChange}
                    label="Recurring holiday (every year)"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    label="Holiday is active"
                  />
                </Form.Group>
              </Col>
            </Row>
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
                  {editingHoliday ? "Update" : "Create"} Holiday
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Holiday</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this holiday?</p>
          {deletingHoliday && (
            <div className="bg-light p-3 rounded">
              <strong>Name:</strong> {deletingHoliday.name}
              <br />
              <strong>Date:</strong>{" "}
              {new Date(deletingHoliday.date).toLocaleDateString()}
              <br />
              <strong>Type:</strong>{" "}
              {deletingHoliday.is_recurring ? "Recurring" : "One-time"}
            </div>
          )}
          <Alert variant="warning" className="mt-3">
            <FaExclamationTriangle className="me-2" />
            <strong>Warning:</strong> This action cannot be undone. The holiday
            will be permanently removed from the system.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <FaTrash className="me-2" />
            Delete Holiday
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Holidays;












