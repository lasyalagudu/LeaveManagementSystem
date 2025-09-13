import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { FaUserPlus, FaUsers, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const EmployeesDashboard = () => {
  const navigate = useNavigate();

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Employees Management</h2>
      <Row className="g-4">
        {/* Add Employee */}
        <Col md={4}>
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <FaUserPlus size={50} className="mb-3 text-primary" />
              <Card.Title>Add Employee</Card.Title>
              <Card.Text>Onboard a new employee with all details.</Card.Text>
              <Button
                variant="primary"
                onClick={() => navigate("/admin/employees/add")}
              >
                Add Employee
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* View Employee by ID */}
        <Col md={4}>
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <FaSearch size={50} className="mb-3 text-success" />
              <Card.Title>View Employee by ID</Card.Title>
              <Card.Text>Lookup employee details using their ID.</Card.Text>
              <Button
                variant="success"
                onClick={() => navigate("/admin/employees/view")}
              >
                View Employee
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* View All Employees */}
        <Col md={4}>
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <FaUsers size={50} className="mb-3 text-warning" />
              <Card.Title>View All Employees</Card.Title>
              <Card.Text>See a complete list of all employees.</Card.Text>
              <Button
                variant="warning"
                onClick={() => navigate("/admin/employees/list")}
              >
                All Employees
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EmployeesDashboard;
