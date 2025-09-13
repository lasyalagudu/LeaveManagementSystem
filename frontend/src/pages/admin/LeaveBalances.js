import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Form,
  Alert,
  Spinner,
  InputGroup,
  ProgressBar,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaUser,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const LeaveBalances = () => {
  const { user } = useAuth();

  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");

  useEffect(() => {
    fetchAllBalances();
  }, [yearFilter]);

  const fetchAllBalances = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/v1/leave/balances?year=${yearFilter}`
      );
      setBalances(response.data);
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

  const filteredBalances = balances.filter((balance) => {
    const matchesSearch =
      balance.employee?.first_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      balance.employee?.last_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      balance.employee?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" ||
      balance.employee?.department === departmentFilter;
    const matchesLeaveType =
      leaveTypeFilter === "all" || balance.leave_type?.name === leaveTypeFilter;

    return matchesSearch && matchesDepartment && matchesLeaveType;
  });

  const departments = [
    ...new Set(balances.map((b) => b.employee?.department).filter(Boolean)),
  ];
  const leaveTypes = [
    ...new Set(balances.map((b) => b.leave_type?.name).filter(Boolean)),
  ];
  const availableYears = [
    ...new Set(balances.map((b) => new Date(b.created_at).getFullYear())),
  ].sort((a, b) => b - a);

  // Chart data for leave utilization
  const getChartData = () => {
    const employeeData = {};

    filteredBalances.forEach((balance) => {
      const employeeId = balance.employee_id;
      if (!employeeData[employeeId]) {
        employeeData[employeeId] = {
          name: `${balance.employee?.first_name} ${balance.employee?.last_name}`,
          allocated: 0,
          used: 0,
          available: 0,
          pending: 0,
        };
      }

      employeeData[employeeId].allocated += balance.allocated_balance;
      employeeData[employeeId].used += balance.used_balance;
      employeeData[employeeId].available += balance.available_balance;
      employeeData[employeeId].pending += balance.pending_balance;
    });

    return Object.values(employeeData).slice(0, 10); // Show top 10 employees
  };

  // Chart data for leave type distribution
  const getLeaveTypeData = () => {
    const typeData = {};

    filteredBalances.forEach((balance) => {
      const typeName = balance.leave_type?.name || "Unknown";
      if (!typeData[typeName]) {
        typeData[typeName] = {
          name: typeName,
          allocated: 0,
          used: 0,
          available: 0,
        };
      }

      typeData[typeName].allocated += balance.allocated_balance;
      typeData[typeName].used += balance.used_balance;
      typeData[typeName].available += balance.available_balance;
    });

    return Object.values(typeData);
  };

  const getTotalStats = () => {
    return filteredBalances.reduce(
      (stats, balance) => ({
        allocated: stats.allocated + balance.allocated_balance,
        used: stats.used + balance.used_balance,
        available: stats.available + balance.available_balance,
        pending: stats.pending + balance.pending_balance,
      }),
      { allocated: 0, used: 0, available: 0, pending: 0 }
    );
  };

  const totalStats = getTotalStats();

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading leave balances...</p>
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
                Leave Balances Overview
              </h2>
              <p className="text-muted mb-0">
                Monitor and manage employee leave balances across the
                organization
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={fetchAllBalances}>
                <FaClock className="me-2" />
                Refresh
              </Button>
              <Button variant="outline-success">
                <FaDownload className="me-2" />
                Export Report
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={3}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={2}>
          <Form.Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select
            value={yearFilter}
            onChange={(e) => setYearFilter(parseInt(e.target.value))}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Select
            value={leaveTypeFilter}
            onChange={(e) => setLeaveTypeFilter(e.target.value)}
          >
            <option value="all">All Leave Types</option>
            {leaveTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setSearchTerm("");
              setDepartmentFilter("all");
              setLeaveTypeFilter("all");
            }}
          >
            <FaFilter className="me-2" />
            Clear Filters
          </Button>
        </Col>
      </Row>

      {/* Results Summary */}
      <Row className="mb-3">
        <Col>
          <Alert variant="info" className="mb-0">
            Showing {filteredBalances.length} of {balances.length} leave balance
            records for {yearFilter}
          </Alert>
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
              <h3 className="fw-bold mb-1">{totalStats.allocated}</h3>
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
              <h3 className="fw-bold mb-1">{totalStats.available}</h3>
              <p className="text-muted mb-0">Total Available</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-info bg-opacity-10 rounded-circle p-3 mb-3">
                <FaClock className="text-info" size={24} />
              </div>
              <h3 className="fw-bold mb-1">{totalStats.used}</h3>
              <p className="text-muted mb-0">Total Used</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle p-3 mb-3">
                <FaExclamationTriangle className="text-warning" size={24} />
              </div>
              <h3 className="fw-bold mb-1">{totalStats.pending}</h3>
              <p className="text-muted mb-0">Total Pending</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaUser className="me-2 text-primary" />
                Top 10 Employee Leave Utilization
              </h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="allocated" fill="#007bff" name="Allocated" />
                  <Bar dataKey="used" fill="#28a745" name="Used" />
                  <Bar dataKey="available" fill="#ffc107" name="Available" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaInfoCircle className="me-2 text-primary" />
                Leave Type Distribution
              </h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getLeaveTypeData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="allocated"
                    label={({ name, allocated }) => `${name}: ${allocated}`}
                  >
                    {getLeaveTypeData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#0088FE",
                            "#00C49F",
                            "#FFBB28",
                            "#FF8042",
                            "#8884D8",
                          ][index % 5]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Balances Table */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0">
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2 text-primary" />
                Detailed Leave Balances
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {filteredBalances.length > 0 ? (
                <Table responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Allocated</th>
                      <th>Used</th>
                      <th>Pending</th>
                      <th>Available</th>
                      <th>Carry Forward</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBalances.map((balance) => (
                      <tr key={balance.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <FaUser size={14} />
                            </div>
                            <div>
                              <div className="fw-semibold">
                                {balance.employee?.first_name}{" "}
                                {balance.employee?.last_name}
                              </div>
                              <small className="text-muted">
                                {balance.employee?.department} •{" "}
                                {balance.employee?.position}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold">
                            {balance.leave_type?.name}
                          </div>
                          <small className="text-muted">
                            {balance.leave_type?.category}
                          </small>
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
                        <td>
                          <Button variant="outline-primary" size="sm">
                            <FaEye />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5">
                  <FaCalendarAlt className="text-muted mb-3" size={48} />
                  <h6 className="text-muted">No leave balances found</h6>
                  <p className="text-muted small">
                    {searchTerm ||
                    departmentFilter !== "all" ||
                    leaveTypeFilter !== "all"
                      ? "Try adjusting your filters or search terms"
                      : "No leave balance records available for the selected criteria"}
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LeaveBalances;









