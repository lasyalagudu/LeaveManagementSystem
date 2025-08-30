import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  ProgressBar,
  ListGroup,
  Alert,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaChartLine,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    leaveBalance: 0,
    recentRequests: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard statistics based on user role
      if (user?.role === "employee") {
        const [myRequests, myBalances] = await Promise.all([
          axios.get("/api/v1/leave/my-requests"),
          axios.get("/api/v1/leave/my-balances"),
        ]);

        const totalBalance = myBalances.data.reduce(
          (sum, balance) => sum + balance.available_balance,
          0
        );
        const pendingCount = myRequests.data.filter(
          (req) => req.status === "pending"
        ).length;
        const approvedCount = myRequests.data.filter(
          (req) => req.status === "approved"
        ).length;
        const rejectedCount = myRequests.data.filter(
          (req) => req.status === "rejected"
        ).length;

        setStats({
          totalLeaves: myRequests.data.length,
          pendingLeaves: pendingCount,
          approvedLeaves: approvedCount,
          rejectedLeaves: rejectedCount,
          leaveBalance: totalBalance,
          recentRequests: myRequests.data.slice(0, 5),
        });
      } else {
        // HR and Super Admin dashboard
        const [allRequests, allBalances] = await Promise.all([
          axios.get("/api/v1/leave/requests"),
          axios.get("/api/v1/leave/balances"),
        ]);

        const pendingCount = allRequests.data.filter(
          (req) => req.status === "pending"
        ).length;
        const approvedCount = allRequests.data.filter(
          (req) => req.status === "approved"
        ).length;
        const rejectedCount = allRequests.data.filter(
          (req) => req.status === "rejected"
        ).length;

        setStats({
          totalLeaves: allRequests.data.length,
          pendingLeaves: pendingCount,
          approvedLeaves: approvedCount,
          rejectedLeaves: rejectedCount,
          leaveBalance: allBalances.data.length,
          recentRequests: allRequests.data.slice(0, 5),
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      super_admin: "Super Admin",
      hr: "HR Manager",
      employee: "Employee",
    };
    return roleNames[role] || role;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "warning", text: "Pending" },
      approved: { variant: "success", text: "Approved" },
      rejected: { variant: "danger", text: "Rejected" },
      cancelled: { variant: "secondary", text: "Cancelled" },
    };

    const config = statusConfig[status] || {
      variant: "secondary",
      text: status,
    };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const chartData = [
    { name: "Pending", value: stats.pendingLeaves, color: "#ffc107" },
    { name: "Approved", value: stats.approvedLeaves, color: "#198754" },
    { name: "Rejected", value: stats.rejectedLeaves, color: "#dc3545" },
  ];

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Welcome Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">Welcome back, {user?.first_name}! 👋</h1>
              <p className="text-muted mb-0">
                {getRoleDisplayName(user?.role)} •{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button as={Link} to="/leave/create" variant="primary" size="sm">
                <FaPlus className="me-2" />
                Apply Leave
              </Button>
              {user?.role !== "employee" && (
                <Button
                  as={Link}
                  to="/leave/requests"
                  variant="outline-primary"
                  size="sm"
                >
                  <FaCalendarAlt className="me-2" />
                  View Requests
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle p-3 mb-3">
                <FaCalendarAlt className="text-primary" size={24} />
              </div>
              <h3 className="fw-bold mb-1">{stats.totalLeaves}</h3>
              <p className="text-muted mb-0">Total Leaves</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle p-3 mb-3">
                <FaClock className="text-warning" size={24} />
              </div>
              <h3 className="fw-bold mb-1">{stats.pendingLeaves}</h3>
              <p className="text-muted mb-0">Pending</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle p-3 mb-3">
                <FaCheckCircle className="text-success" size={24} />
              </div>
              <h3 className="fw-bold mb-1">{stats.approvedLeaves}</h3>
              <p className="text-muted mb-0">Approved</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 rounded-circle p-3 mb-3">
                <FaTimesCircle className="text-danger" size={24} />
              </div>
              <h3 className="fw-bold mb-1">{stats.rejectedLeaves}</h3>
              <p className="text-muted mb-0">Rejected</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts and Quick Actions */}
      <Row className="mb-4">
        <Col lg={8} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaChartLine className="me-2 text-primary" />
                Leave Statistics
              </h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0d6efd" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaExclamationTriangle className="me-2 text-warning" />
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button
                  as={Link}
                  to="/leave/create"
                  variant="primary"
                  size="sm"
                >
                  <FaPlus className="me-2" />
                  Apply for Leave
                </Button>
                <Button
                  as={Link}
                  to="/leave/my-requests"
                  variant="outline-primary"
                  size="sm"
                >
                  <FaCalendarAlt className="me-2" />
                  View My Requests
                </Button>
                <Button
                  as={Link}
                  to="/leave/my-balances"
                  variant="outline-info"
                  size="sm"
                >
                  <FaUsers className="me-2" />
                  Check Balance
                </Button>
                {user?.role !== "employee" && (
                  <Button
                    as={Link}
                    to="/leave/requests"
                    variant="outline-warning"
                    size="sm"
                  >
                    <FaClock className="me-2" />
                    Review Requests
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Leave Requests */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2 text-primary" />
                Recent Leave Requests
              </h5>
            </Card.Header>
            <Card.Body>
              {stats.recentRequests.length > 0 ? (
                <ListGroup variant="flush">
                  {stats.recentRequests.map((request) => (
                    <ListGroup.Item
                      key={request.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div className="fw-semibold">
                          {request.leave_type?.name || "Leave Request"}
                        </div>
                        <small className="text-muted">
                          {new Date(request.start_date).toLocaleDateString()} -{" "}
                          {new Date(request.end_date).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {getStatusBadge(request.status)}
                        <Button
                          as={Link}
                          to={`/leave/my-requests/${request.id}`}
                          variant="outline-primary"
                          size="sm"
                        >
                          View
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <Alert variant="info" className="mb-0">
                  No recent leave requests found.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;





