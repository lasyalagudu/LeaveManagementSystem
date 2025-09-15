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
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaSearch,
  FaEye,
  FaEdit,
  FaTimes,
  FaFilter,
  FaPlus,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const MyLeaveRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/v1/leave/my-requests");
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.leave_type?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          req.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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

  const handleCancelRequest = async () => {
    if (!selectedRequest) return;

    try {
      setCancelling(true);
      await axios.put(`/api/v1/leave/requests/${selectedRequest.id}/cancel`);

      toast.success("Leave request cancelled successfully");
      fetchMyRequests(); // Refresh the list
      setShowCancelModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error cancelling request:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to cancel request";
      toast.error(errorMessage);
    } finally {
      setCancelling(false);
    }
  };

  const openCancelModal = (request) => {
    setSelectedRequest(request);
    setShowCancelModal(true);
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

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your leave requests...</p>
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
                My Leave Requests
              </h2>
              <p className="text-muted mb-0">
                View and manage your leave application history
              </p>
            </div>
            <Button as={Link} to="/leave/create" variant="primary">
              <FaPlus className="me-2" />
              Apply for Leave
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by leave type, reason, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
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
        <Col md={3}>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
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
            Showing {filteredRequests.length} of {requests.length} leave
            requests
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
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.map((request) => (
                  <tr key={request.id}>
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
                            navigate(`/leave/my-requests/${request.id}`)
                          }
                        >
                          <FaEye />
                        </Button>

                        {request.status === "pending" && (
                          <>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() =>
                                navigate(`/leave/edit/${request.id}`)
                              }
                            >
                              <FaEdit />
                            </Button>

                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => openCancelModal(request)}
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
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "You haven't applied for any leave yet"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button as={Link} to="/leave/create" variant="primary">
                  <FaPlus className="me-2" />
                  Apply for Your First Leave
                </Button>
              )}
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

      {/* Cancel Confirmation Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to cancel this leave request?</p>
          <div className="bg-light p-3 rounded">
            <strong>Leave Type:</strong> {selectedRequest?.leave_type?.name}
            <br />
            <strong>Dates:</strong> {selectedRequest?.start_date} to{" "}
            {selectedRequest?.end_date}
            <br />
            <strong>Reason:</strong> {selectedRequest?.reason}
          </div>
          <Alert variant="warning" className="mt-3">
            <strong>Note:</strong> This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Keep Request
          </Button>
          <Button
            variant="danger"
            onClick={handleCancelRequest}
            disabled={cancelling}
          >
            {cancelling ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Cancelling...
              </>
            ) : (
              "Cancel Request"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyLeaveRequests;












