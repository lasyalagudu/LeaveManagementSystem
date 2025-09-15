import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { FaCalendarCheck, FaFileAlt, FaEdit, FaTimesCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  return (
    <Container className="py-4">
      <h2 className="mb-4">Employee Dashboard</h2>

      {/* Action Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card
            className="text-center shadow-sm hover-shadow"
            onClick={() => navigate("/employee/apply-leave")}
            style={{ cursor: "pointer" }}
          >
            <Card.Body>
              <FaCalendarCheck size={40} className="mb-2 text-primary" />
              <Card.Title>Apply Leave</Card.Title>
              <Card.Text>Request leave quickly</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card
            className="text-center shadow-sm hover-shadow"
            onClick={() => navigate("/leave/my-requests")}
            style={{ cursor: "pointer" }}
          >
            <Card.Body>
              <FaFileAlt size={40} className="mb-2 text-success" />
              <Card.Title>My Leaves</Card.Title>
              <Card.Text>View all leave requests</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card
            className="text-center shadow-sm hover-shadow"
            onClick={() => navigate("/leave/modify")}
            style={{ cursor: "pointer" }}
          >
            <Card.Body>
              <FaEdit size={40} className="mb-2 text-warning" />
              <Card.Title>Modify Leave</Card.Title>
              <Card.Text>Edit pending requests</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} sm={6} className="mb-3">
          <Card
            className="text-center shadow-sm hover-shadow"
            onClick={() => navigate("/leave/cancel")}
            style={{ cursor: "pointer" }}
          >
            <Card.Body>
              <FaTimesCircle size={40} className="mb-2 text-danger" />
              <Card.Title>Cancel Leave</Card.Title>
              <Card.Text>Cancel pending requests</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EmployeeDashboard;
