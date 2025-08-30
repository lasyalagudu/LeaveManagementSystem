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
  InputGroup,
  Modal,
  Alert,
  Spinner,
  Pagination,
  Dropdown,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaSearch,
  FaEye,
  FaCheck,
  FaTimes,
  FaFilter,
  FaUser,
  FaClock,
  FaSort,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const LeaveRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchAllRequests();
  }, []);

  useEffect(() => {
    filterAndSortRequests();
  }, [
    requests,
    searchTerm,
    statusFilter,
    employeeFilter,
    leaveTypeFilter,
    sortBy,
    sortOrder,
  ]);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/v1/leave/requests");
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRequests = () => {
    let filtered = requests;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Employee filter
    if (employeeFilter) {
      filtered = filtered.filter(
        (req) =>
          req.employee?.first_name
            ?.toLowerCase()
            .includes(employeeFilter.toLowerCase()) ||
          req.employee?.last_name
            ?.toLowerCase()
            .includes(employeeFilter.toLowerCase()) ||
          req.employee?.email
            ?.toLowerCase()
            .includes(employeeFilter.toLowerCase())
      );
    }

    // Leave type filter
    if (leaveTypeFilter) {
      filtered = filtered.filter((req) =>
        req.leave_type?.name
          ?.toLowerCase()
          .includes(leaveTypeFilter.toLowerCase())
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.leave_type?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          req.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.employee?.first_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          req.employee?.last_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "employee") {
        aValue = `${a.employee?.first_name} ${a.employee?.last_name}`;
        bValue = `${b.employee?.first_name} ${b.employee?.last_name}`;
      } else if (sortBy === "leave_type") {
        aValue = a.leave_type?.name;
        bValue = b.leave_type?.name;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRequests(filtered);
    setCurrentPage(1);
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

  const getDurationText = (request) => {
    if (request.duration_type === "half_day") {
      return `${request.number_of_days} half day(s)`;
    } else if (request.duration_type === "hourly") {
      return `${request.hours} hour(s)`;
    }
    return `${request.number_of_days} day(s)`;
  };

  const openActionModal = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setRejectionReason("");
    setShowActionModal(true);
  };

  const handleAction = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);

      if (actionType === "approve") {
        await axios.put(`/api/v1/leave/requests/${selectedRequest.id}/approve`);
        toast.success("Leave request approved successfully");
      } else if (actionType === "reject") {
        await axios.put(`/api/v1/leave/requests/${selectedRequest.id}/reject`, {
          rejection_reason: rejectionReason,
        });
        toast.success("Leave request rejected successfully");
      }

      fetchAllRequests(); // Refresh the list
      setShowActionModal(false);
      setSelectedRequest(null);
      setActionType("");
      setRejectionReason("");
    } catch (error) {
      console.error("Error processing request:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to process request";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const getPriorityColor = (request) => {
    const startDate = new Date(request.start_date);
    const today = new Date();
    const daysUntilStart = Math.ceil(
      (startDate - today) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilStart <= 3) return "danger";
    if (daysUntilStart <= 7) return "warning";
    return "success";
  };

  const getPriorityText = (request) => {
    const startDate = new Date(request.start_date);
    const today = new Date();
    const daysUntilStart = Math.ceil(
      (startDate - today) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilStart <= 3) return "Urgent";
    if (daysUntilStart <= 7) return "High";
    return "Normal";
  };

  // Pagination
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = filteredRequests.slice(
    indexOfFirstRequest,
    indexOfLastRequest
  );
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading leave requests...</p>
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
                All Leave Requests
              </h2>
              <p className="text-muted mb-0">
                Review and manage employee leave applications
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                onClick={() => fetchAllRequests()}
              >
                <FaClock className="me-2" />
                Refresh
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Row className="mb-4">
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by employee, leave type, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={2}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Form.Control
            type="text"
            placeholder="Filter by employee..."
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
          />
        </Col>
        <Col md={2}>
          <Form.Control
            type="text"
            placeholder="Filter by leave type..."
            value={leaveTypeFilter}
            onChange={(e) => setLeaveTypeFilter(e.target.value)}
          />
        </Col>
        <Col md={2}>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setEmployeeFilter("");
              setLeaveTypeFilter("");
            }}
          >
            <FaFilter className="me-2" />
            Clear
          </Button>
        </Col>
      </Row>

      {/* Results Summary */}
      <Row className="mb-3">
        <Col>
          <Alert variant="info" className="mb-0">
            Showing {filteredRequests.length} of {requests.length} leave
            requests
            {statusFilter === "pending" && (
              <span className="ms-2">
                •{" "}
                <strong>
                  {
                    filteredRequests.filter((r) => r.status === "pending")
                      .length
                  }{" "}
                  pending approval
                </strong>
              </span>
            )}
          </Alert>
        </Col>
      </Row>

      {/* Leave Requests Table */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {currentRequests.length > 0 ? (
            <Table responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>
                    <Button
                      variant="link"
                      className="p-0 text-decoration-none"
                      onClick={() => handleSort("employee")}
                    >
                      Employee <FaSort className="ms-1" />
                    </Button>
                  </th>
                  <th>
                    <Button
                      variant="link"
                      className="p-0 text-decoration-none"
                      onClick={() => handleSort("leave_type")}
                    >
                      Leave Type <FaSort className="ms-1" />
                    </Button>
                  </th>
                  <th>Duration</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Priority</th>
                  <th>
                    <Button
                      variant="link"
                      className="p-0 text-decoration-none"
                      onClick={() => handleSort("status")}
                    >
                      Status <FaSort className="ms-1" />
                    </Button>
                  </th>
                  <th>
                    <Button
                      variant="link"
                      className="p-0 text-decoration-none"
                      onClick={() => handleSort("created_at")}
                    >
                      Applied On <FaSort className="ms-1" />
                    </Button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.map((request) => (
                  <tr key={request.id}>
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
                            {request.employee?.first_name}{" "}
                            {request.employee?.last_name}
                          </div>
                          <small className="text-muted">
                            {request.employee?.email}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold">
                        {request.leave_type?.name}
                      </div>
                      <small className="text-muted">
                        {request.leave_type?.category}
                      </small>
                    </td>
                    <td>
                      <div>{getDurationText(request)}</div>
                      <small className="text-muted">
                        {request.duration_type?.replace("_", " ")}
                      </small>
                    </td>
                    <td>
                      <div>
                        {new Date(request.start_date).toLocaleDateString()}
                      </div>
                      <div className="text-muted">
                        to {new Date(request.end_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div
                        className="text-truncate"
                        style={{ maxWidth: "200px" }}
                      >
                        {request.reason}
                      </div>
                    </td>
                    <td>
                      <Badge bg={getPriorityColor(request)}>
                        {getPriorityText(request)}
                      </Badge>
                    </td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      <div>
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      <small className="text-muted">
                        {new Date(request.created_at).toLocaleTimeString()}
                      </small>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() =>
                            navigate(`/leave/requests/${request.id}`)
                          }
                        >
                          <FaEye />
                        </Button>

                        {request.status === "pending" && (
                          <>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() =>
                                openActionModal(request, "approve")
                              }
                            >
                              <FaCheck />
                            </Button>

                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => openActionModal(request, "reject")}
                            >
                              <FaTimes />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5">
              <FaCalendarAlt className="text-muted mb-3" size={48} />
              <h5 className="text-muted">No leave requests found</h5>
              <p className="text-muted">
                {searchTerm ||
                statusFilter !== "all" ||
                employeeFilter ||
                leaveTypeFilter
                  ? "Try adjusting your filters or search terms"
                  : "No leave requests have been submitted yet"}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Row className="mt-4">
          <Col className="d-flex justify-content-center">
            <Pagination>
              <Pagination.First
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              />

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <Pagination.Item
                    key={number}
                    active={number === currentPage}
                    onClick={() => paginate(number)}
                  >
                    {number}
                  </Pagination.Item>
                )
              )}

              <Pagination.Next
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </Col>
        </Row>
      )}

      {/* Action Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === "approve"
              ? "Approve Leave Request"
              : "Reject Leave Request"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {actionType === "approve" ? (
            <div>
              <p>Are you sure you want to approve this leave request?</p>
              <div className="bg-light p-3 rounded">
                <strong>Employee:</strong>{" "}
                {selectedRequest?.employee?.first_name}{" "}
                {selectedRequest?.employee?.last_name}
                <br />
                <strong>Leave Type:</strong> {selectedRequest?.leave_type?.name}
                <br />
                <strong>Dates:</strong> {selectedRequest?.start_date} to{" "}
                {selectedRequest?.end_date}
                <br />
                <strong>Duration:</strong> {getDurationText(selectedRequest)}
                <br />
                <strong>Reason:</strong> {selectedRequest?.reason}
              </div>
            </div>
          ) : (
            <div>
              <p>Are you sure you want to reject this leave request?</p>
              <div className="bg-light p-3 rounded mb-3">
                <strong>Employee:</strong>{" "}
                {selectedRequest?.employee?.first_name}{" "}
                {selectedRequest?.employee?.last_name}
                <br />
                <strong>Leave Type:</strong> {selectedRequest?.leave_type?.name}
                <br />
                <strong>Dates:</strong> {selectedRequest?.start_date} to{" "}
                {selectedRequest?.end_date}
                <br />
                <strong>Duration:</strong> {getDurationText(selectedRequest)}
                <br />
                <strong>Reason:</strong> {selectedRequest?.reason}
              </div>
              <Form.Group>
                <Form.Label>Rejection Reason *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Please provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  isInvalid={!rejectionReason.trim()}
                />
                <Form.Control.Feedback type="invalid">
                  Rejection reason is required
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActionModal(false)}>
            Cancel
          </Button>
          <Button
            variant={actionType === "approve" ? "success" : "danger"}
            onClick={handleAction}
            disabled={
              processing || (actionType === "reject" && !rejectionReason.trim())
            }
          >
            {processing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Processing...
              </>
            ) : actionType === "approve" ? (
              "Approve Request"
            ) : (
              "Reject Request"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LeaveRequests;





