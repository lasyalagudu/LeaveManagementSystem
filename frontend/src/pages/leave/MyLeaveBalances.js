import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  ProgressBar,
  Badge,
  Table,
  Alert,
  Spinner,
  Button,
  Form,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaDownload,
  FaHistory,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const MyLeaveBalances = () => {
  const { user } = useAuth();

  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    fetchMyBalances();
  }, [selectedYear]);

  const fetchMyBalances = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/v1/leave/my-balances`);

      setBalances(response.data);

      // Extract unique years from balances
      const years = [
        ...new Set(
          response.data.map((b) => new Date(b.created_at).getFullYear())
        ),
      ];
      setAvailableYears(years.length > 0 ? years : [selectedYear]);
    } catch (error) {
      console.error("Error fetching balances:", error);
      toast.error("Failed to load leave balances");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (balance) => {
    const percentage =
      (balance.available_balance / balance.allocated_balance) * 100;
    if (percentage >= 70) return "success";
    if (percentage >= 40) return "warning";
    return "danger";
  };

  const getStatusText = (balance) => {
    const percentage =
      (balance.available_balance / balance.allocated_balance) * 100;
    if (percentage >= 70) return "Good";
    if (percentage >= 40) return "Moderate";
    return "Low";
  };

  const getProgressVariant = (balance) => {
    const percentage =
      (balance.available_balance / balance.allocated_balance) * 100;
    if (percentage >= 70) return "success";
    if (percentage >= 40) return "warning";
    return "danger";
  };

  const getChartData = () => {
    return balances.map((balance) => ({
      name: balance.leave_type?.name || "Unknown",
      value: balance.available_balance,
      allocated: balance.allocated_balance,
      used: balance.used_balance,
      pending: balance.pending_balance,
      color:
        getStatusColor(balance) === "success"
          ? "#28a745"
          : getStatusColor(balance) === "warning"
          ? "#ffc107"
          : "#dc3545",
    }));
  };

  const getTotalBalance = () => {
    return balances.reduce(
      (total, balance) => total + balance.available_balance,
      0
    );
  };

  const getTotalAllocated = () => {
    return balances.reduce(
      (total, balance) => total + balance.allocated_balance,
      0
    );
  };

  const getTotalUsed = () => {
    return balances.reduce((total, balance) => total + balance.used_balance, 0);
  };

  const getTotalPending = () => {
    return balances.reduce(
      (total, balance) => total + balance.pending_balance,
      0
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your leave balances...</p>
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
                <FaCalendarAlt className="me-2 text-primary" />
                My Leave Balances
              </h2>
              <p className="text-muted mb-0">
                View your current leave balances and usage history
              </p>
            </div>
            <div className="d-flex gap-2">
              <Form.Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{ width: "auto" }}
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Form.Select>
              <Button variant="outline-primary" onClick={fetchMyBalances}>
                <FaClock className="me-2" />
                Refresh
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle p-3 mb-3">
                <FaCalendarAlt className="text-primary" size={24} />
              </div>
              <h3 className="fw-bold mb-1">{getTotalAllocated()}</h3>
              <p className="text-muted mb-0">Total Allocated</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle p-3 mb-3">
                <FaCheckCircle className="text-success" size={24} />
              </div>
              <h3 className="fw-bold mb-1">{getTotalBalance()}</h3>
              <p className="text-muted mb-0">Available Balance</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-info bg-opacity-10 rounded-circle p-3 mb-3">
                <FaHistory className="text-info" size={24} />
              </div>
              <h3 className="fw-bold mb-1">{getTotalUsed()}</h3>
              <p className="text-muted mb-0">Used Leave</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle p-3 mb-3">
                <FaExclamationTriangle className="text-warning" size={24} />
              </div>
              <h3 className="fw-bold mb-1">{getTotalPending()}</h3>
              <p className="text-muted mb-0">Pending Requests</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts and Balances */}
      <Row className="mb-4">
        <Col lg={4} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaInfoCircle className="me-2 text-primary" />
                Balance Overview
              </h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getChartData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {getChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2 text-primary" />
                Leave Type Balances
              </h5>
            </Card.Header>
            <Card.Body>
              {balances.length > 0 ? (
                balances.map((balance) => (
                  <div key={balance.id} className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <h6 className="mb-1">{balance.leave_type?.name}</h6>
                        <small className="text-muted">
                          {balance.leave_type?.category} •{" "}
                          {balance.leave_type?.description}
                        </small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold">
                          {balance.available_balance} /{" "}
                          {balance.allocated_balance} days
                        </div>
                        <Badge bg={getStatusColor(balance)}>
                          {getStatusText(balance)}
                        </Badge>
                      </div>
                    </div>

                    <ProgressBar
                      variant={getProgressVariant(balance)}
                      now={
                        (balance.available_balance /
                          balance.allocated_balance) *
                        100
                      }
                      className="mb-2"
                    />

                    <div className="d-flex justify-content-between small text-muted">
                      <span>Available: {balance.available_balance} days</span>
                      <span>Used: {balance.used_balance} days</span>
                      <span>Pending: {balance.pending_balance} days</span>
                      {balance.carry_forward_balance > 0 && (
                        <span>
                          Carry Forward: {balance.carry_forward_balance} days
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <FaCalendarAlt className="text-muted mb-3" size={48} />
                  <h6 className="text-muted">No leave balances found</h6>
                  <p className="text-muted small">
                    Your leave balances for {selectedYear} will appear here
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Balance Table */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaHistory className="me-2 text-primary" />
                Detailed Balance History
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {balances.length > 0 ? (
                <Table responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Leave Type</th>
                      <th>Category</th>
                      <th>Allocated</th>
                      <th>Used</th>
                      <th>Pending</th>
                      <th>Available</th>
                      <th>Carry Forward</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((balance) => (
                      <tr key={balance.id}>
                        <td>
                          <div className="fw-semibold">
                            {balance.leave_type?.name}
                          </div>
                          <small className="text-muted">
                            {balance.leave_type?.description}
                          </small>
                        </td>
                        <td>
                          <Badge bg="info">
                            {balance.leave_type?.category}
                          </Badge>
                        </td>
                        <td>
                          <span className="fw-semibold">
                            {balance.allocated_balance}
                          </span>
                          <small className="text-muted d-block">days</small>
                        </td>
                        <td>
                          <span className="text-info">
                            {balance.used_balance}
                          </span>
                          <small className="text-muted d-block">days</small>
                        </td>
                        <td>
                          <span className="text-warning">
                            {balance.pending_balance}
                          </span>
                          <small className="text-muted d-block">days</small>
                        </td>
                        <td>
                          <span className="fw-bold text-success">
                            {balance.available_balance}
                          </span>
                          <small className="text-muted d-block">days</small>
                        </td>
                        <td>
                          {balance.carry_forward_balance > 0 ? (
                            <span className="text-primary">
                              {balance.carry_forward_balance}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                          <small className="text-muted d-block">days</small>
                        </td>
                        <td>
                          <Badge bg={getStatusColor(balance)}>
                            {getStatusText(balance)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5">
                  <FaCalendarAlt className="text-muted mb-3" size={48} />
                  <h6 className="text-muted">No balance history available</h6>
                  <p className="text-muted small">
                    Your leave balance history for {selectedYear} will appear
                    here
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mt-4">
        <Col>
          <Alert variant="info" className="mb-0">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <FaInfoCircle className="me-2" />
                <strong>Quick Actions:</strong>
                <span className="ms-2">
                  <Link to="/leave/create" className="text-decoration-none">
                    Apply for Leave
                  </Link>{" "}
                  •
                  <Link
                    to="/leave/my-requests"
                    className="text-decoration-none ms-2"
                  >
                    View My Requests
                  </Link>{" "}
                  •
                  <Link to="/profile" className="text-decoration-none ms-2">
                    Update Profile
                  </Link>
                </span>
              </div>
              <Button variant="outline-primary" size="sm">
                <FaDownload className="me-2" />
                Export Report
              </Button>
            </div>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};

export default MyLeaveBalances;









