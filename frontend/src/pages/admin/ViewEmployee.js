import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Modal,
  Form,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaRedo, FaArrowLeft } from "react-icons/fa";

const ViewEmployee = () => {
  const navigate = useNavigate(); // <-- Add this
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    phone: "",
    department: "",
    designation: "",
    joining_date: "",
    manager_id: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/v1/users/employees/list");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Form change & validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.department) newErrors.department = "Department required";
    if (!formData.designation) newErrors.designation = "Designation required";
    if (!formData.joining_date)
      newErrors.joining_date = "Joining date required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update Employee
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingEmployee) {
        await axios.put(`/api/v1/users/${editingEmployee.id}`, formData);
        toast.success("Employee updated successfully!");
      }
      fetchEmployees();
      handleCloseModal();
    } catch (error) {
      const msg = error.response?.data?.detail || "Failed to update employee";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    try {
      await axios.delete(`/api/v1/users/${deletingEmployee.id}`);
      toast.success("Employee deactivated successfully!");
      fetchEmployees();
      setShowDeleteModal(false);
      setDeletingEmployee(null);
    } catch (error) {
      const msg = error.response?.data?.detail || "Failed to deactivate";
      toast.error(msg);
    }
  };

  const handleReactivate = async (employee) => {
    try {
      await axios.post(`/api/v1/users/${employee.id}/activate`);
      toast.success("Employee reactivated successfully!");
      fetchEmployees();
    } catch (error) {
      const msg = error.response?.data?.detail || "Failed to reactivate";
      toast.error(msg);
    }
  };

  const handleOpenModal = (employee) => {
    setEditingEmployee(employee);
    setFormData(
      employee || {
        phone: "",
        department: "",
        designation: "",
        joining_date: "",
        manager_id: "",
      }
    );
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingEmployee(null);
    setFormData({
      phone: "",
      department: "",
      designation: "",
      joining_date: "",
      manager_id: "",
    });
    setErrors({});
    setShowModal(false);
  };

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          <Button
            variant="secondary"
            onClick={() => navigate("/admin/employees")}
          >
            <FaArrowLeft className="me-2" />
            Back
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <h2 className="mb-4">All Employees</h2>
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.id}</td>
                      <td>{emp.employee_id}</td> {/* employee_id */}
                      <td>
                        {emp.first_name} {emp.last_name}
                      </td>
                      <td>{emp.user?.email || "N/A"}</td>{" "}
                      {/* email from linked user */}
                      <td>{emp.department}</td>
                      <td>{emp.designation}</td>
                      <td>
                        {emp.joining_date
                          ? new Date(emp.joining_date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>{emp.is_active ? "Active" : "Inactive"}</td>
                      <td>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleOpenModal(emp)}
                        >
                          <FaEdit />
                        </Button>
                        {emp.is_active ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setDeletingEmployee(emp);
                              setShowDeleteModal(true);
                            }}
                          >
                            <FaTrash />
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleReactivate(emp)}
                          >
                            <FaRedo />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>

      {/* Modals here (Edit & Delete) same as before */}
    </Container>
  );
};

export default ViewEmployee;
