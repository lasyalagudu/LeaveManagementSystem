import React, { useState } from "react";
import { Container, Form, Button, Card } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const EmployeeById = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState(null);

  const handleFetch = async () => {
    if (!employeeId) return toast.error("Please enter Employee ID");

    try {
      // Fetch employee by employee_id (string like E1001)
      const response = await axios.get(`http://localhost:8000/api/v1/users/employees/${employeeId}`);
      setEmployee(response.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to fetch employee");
      setEmployee(null);
    }
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4">View Employee by ID</h2>
      <Form className="mb-3 d-flex gap-2" onSubmit={(e) => e.preventDefault()}>
        <Form.Control
          type="text"   // 🔹 allow string IDs like E1001
          placeholder="Enter Employee ID (e.g., EMP1001)"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
        <Button variant="primary" onClick={handleFetch}>
          Fetch
        </Button>
      </Form>

      {employee && (
        <Card>
          <Card.Body>
            <Card.Title>
              {employee.first_name} {employee.last_name}
            </Card.Title>
            <Card.Text><b>Employee ID:</b> {employee.employee_id}</Card.Text>
            <Card.Text><b>Email:</b> {employee.user.email}</Card.Text>
            <Card.Text><b>Department:</b> {employee.department}</Card.Text>
            <Card.Text><b>Designation:</b> {employee.designation}</Card.Text>
            <Card.Text><b>Joining Date:</b> {employee.joining_date}</Card.Text>
            <Card.Text><b>Role:</b> {employee.user.role}</Card.Text>
            {/* <Card.Text><b>Status:</b> {employee.is_active ? "Active" : "Inactive"}</Card.Text> */}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default EmployeeById;
