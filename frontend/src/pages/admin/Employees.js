import React, { useState } from "react";
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const AddEmployeeForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    department: "",
    designation: "",
    joining_date: "",
    manager_id: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employee_id)
      newErrors.employee_id = "Employee ID is required";
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required"; // 🔹
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.designation)
      newErrors.designation = "Designation is required";
    if (!formData.joining_date)
      newErrors.joining_date = "Joining date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await axios.post("/api/v1/users/employees/onboard", formData);
      toast.success("Employee added successfully!");
      setFormData({
        employee_id: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        joining_date: "",
        manager_id: "",
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Failed to add employee";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="mt-4">
      <h2>Add New Employee</h2>
      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Employee ID</Form.Label>
              <Form.Control
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                isInvalid={!!errors.employee_id}
              />
              <Form.Control.Feedback type="invalid">
                {errors.employee_id}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                isInvalid={!!errors.first_name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.first_name}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                isInvalid={!!errors.last_name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.last_name}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Department</Form.Label>
              <Form.Control
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                isInvalid={!!errors.department}
              />
              <Form.Control.Feedback type="invalid">
                {errors.department}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Designation</Form.Label>
              <Form.Control
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                isInvalid={!!errors.designation}
              />
              <Form.Control.Feedback type="invalid">
                {errors.designation}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Joining Date</Form.Label>
              <Form.Control
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleChange}
                isInvalid={!!errors.joining_date}
              />
              <Form.Control.Feedback type="invalid">
                {errors.joining_date}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Manager ID</Form.Label>
              <Form.Control
                type="number"
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>

        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add Employee"}
        </Button>
      </Form>
    </Container>
  );
};

export default AddEmployeeForm;



