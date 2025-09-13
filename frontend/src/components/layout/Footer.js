import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { FaHeart, FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <Container>
        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start">
            <p className="mb-0">
              © 2024 Leave Management System. Made with{" "}
              <FaHeart className="text-danger" /> for better workplace
              management.
            </p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <p className="mb-0">
              <FaGithub className="me-2" />
              Built with React & Bootstrap
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;









