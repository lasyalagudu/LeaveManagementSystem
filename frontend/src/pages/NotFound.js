import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FaExclamationTriangle,
  FaHome,
  FaArrowLeft,
  FaSearch,
  FaQuestionCircle,
} from "react-icons/fa";

const NotFound = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-lg text-center">
            <Card.Body className="p-5">
              {/* Error Icon */}
              <div className="mb-4">
                <div
                  className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "100px", height: "100px" }}
                >
                  <FaExclamationTriangle size={48} />
                </div>
              </div>

              {/* Error Message */}
              <h1 className="display-4 fw-bold text-danger mb-3">404</h1>
              <h3 className="mb-3">Page Not Found</h3>
              <p className="text-muted mb-4">
                Oops! The page you're looking for doesn't exist. It might have
                been moved, deleted, or you entered the wrong URL.
              </p>

              {/* Action Buttons */}
              <div className="d-grid gap-3 d-md-flex justify-content-md-center">
                <Button
                  as={Link}
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  variant="primary"
                  size="lg"
                >
                  <FaHome className="me-2" />
                  {isAuthenticated ? "Go to Dashboard" : "Go to Login"}
                </Button>

                <Button variant="outline-secondary" size="lg" onClick={goBack}>
                  <FaArrowLeft className="me-2" />
                  Go Back
                </Button>
              </div>

              {/* Additional Help */}
              <div className="mt-5 pt-4 border-top">
                <h6 className="mb-3">Need Help?</h6>
                <div className="d-flex justify-content-center gap-3">
                  <Button
                    as={Link}
                    to="/help"
                    variant="link"
                    className="text-decoration-none"
                  >
                    <FaQuestionCircle className="me-2" />
                    Help Center
                  </Button>

                  <Button
                    variant="link"
                    className="text-decoration-none"
                    onClick={() => navigate("/contact")}
                  >
                    <FaSearch className="me-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Navigation */}
          {isAuthenticated && (
            <Card className="border-0 shadow-sm mt-4">
              <Card.Body className="p-3">
                <h6 className="mb-3">Quick Navigation</h6>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  <Button
                    as={Link}
                    to="/leave/create"
                    variant="outline-primary"
                    size="sm"
                  >
                    Apply for Leave
                  </Button>
                  <Button
                    as={Link}
                    to="/leave/my-requests"
                    variant="outline-info"
                    size="sm"
                  >
                    My Requests
                  </Button>
                  <Button
                    as={Link}
                    to="/leave/my-balances"
                    variant="outline-success"
                    size="sm"
                  >
                    My Balances
                  </Button>
                  <Button
                    as={Link}
                    to="/profile"
                    variant="outline-secondary"
                    size="sm"
                  >
                    Profile
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;












