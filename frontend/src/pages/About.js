import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import { FaCalendarAlt, FaUsers, FaCheckCircle, FaCog, FaBell, FaLock } from "react-icons/fa";

const features = [
  {
    icon: <FaCalendarAlt size={30} className="text-primary" />,
    title: "Leave Management",
    description:
      "Employees can apply for leaves, check leave status, and manage their balances easily.",
  },
  {
    icon: <FaUsers size={30} className="text-success" />,
    title: "Employee Management",
    description:
      "HR and Admin can manage employee records, view leave histories, and track attendance.",
  },
  {
    icon: <FaCheckCircle size={30} className="text-warning" />,
    title: "Approvals & Audits",
    description:
      "HR and Super Admin can approve or reject leave requests and maintain an audit trail.",
  },
  {
    icon: <FaCog size={30} className="text-danger" />,
    title: "Leave Types & Policies",
    description:
      "Configure multiple leave types, set policies, and manage company holidays efficiently.",
  },
  {
    icon: <FaBell size={30} className="text-info" />,
    title: "Notifications",
    description:
      "Get real-time notifications for pending requests, approvals, and upcoming leaves.",
  },
  {
    icon: <FaLock size={30} className="text-secondary" />,
    title: "Role-Based Access",
    description:
      "Secure and role-based system ensures employees, HR, and Admins access only what they need.",
  },
];

const About = () => {
  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-center">About LMS</h2>
      <p className="text-center mb-5">
        Our Leave Management System (LMS) is designed to simplify leave tracking and approvals for employees, HR, and Admins. Explore its key features below:
      </p>

      <Row xs={1} md={2} lg={3} className="g-4">
        {features.map((feature, idx) => (
          <Col key={idx}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="d-flex flex-column align-items-center text-center">
                <div className="mb-3">{feature.icon}</div>
                <Card.Title>{feature.title}</Card.Title>
                <Card.Text>{feature.description}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default About;
