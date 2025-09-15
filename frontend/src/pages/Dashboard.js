import React from "react";
import { Card, Row, Col, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaCalendarAlt, FaUsers, FaCog, FaPlus } from "react-icons/fa";

const HRDashboard = () => {
  return (
    <div className="p-4">
      <h2 className="mb-4">HR Dashboard</h2>

      <Row className="g-3">
        {/* Pending Leave Requests */}
        <Col md={4}>
          <Card
            as={Link}
            to="/hr/leave-requests"
            className="text-decoration-none h-100"
          >
            <Card.Body className="d-flex flex-column align-items-start">
              <FaCalendarAlt size={40} className="mb-3 text-primary" />
              <Card.Title>Leave Requests</Card.Title>
              <Card.Text>Approve, reject, or modify leave requests</Card.Text>
              <Badge bg="warning">3 Pending</Badge>{" "}
              {/* Later make this dynamic */}
            </Card.Body>
          </Card>
        </Col>

        {/* Employee Management */}
        <Col md={4}>
          <Card
            as={Link}
            to="/admin/employees"
            className="text-decoration-none h-100"
          >
            <Card.Body className="d-flex flex-column align-items-start">
              <FaUsers size={40} className="mb-3 text-success" />
              <Card.Title>Employees</Card.Title>
              <Card.Text>Add, edit, and manage employees</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Leave Types */}
        <Col md={4}>
          <Card
            as={Link}
            to="/admin/leave-types"
            className="text-decoration-none h-100"
          >
            <Card.Body className="d-flex flex-column align-items-start">
              <FaCog size={40} className="mb-3 text-warning" />
              <Card.Title>Leave Types</Card.Title>
              <Card.Text>Configure leave categories and policies</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Holidays */}
        <Col md={4}>
          <Card
            as={Link}
            to="/admin/holidays"
            className="text-decoration-none h-100"
          >
            <Card.Body className="d-flex flex-column align-items-start">
              <FaCalendarAlt size={40} className="mb-3 text-danger" />
              <Card.Title>Holidays</Card.Title>
              <Card.Text>Set company and public holidays</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* All Leave Balances */}
        <Col md={4}>
          <Card
            as={Link}
            to="/leave/balances"
            className="text-decoration-none h-100"
          >
            <Card.Body className="d-flex flex-column align-items-start">
              <FaCalendarAlt size={40} className="mb-3 text-info" />
              <Card.Title>Leave Balances</Card.Title>
              <Card.Text>Monitor leave balances for all employees</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HRDashboard;



