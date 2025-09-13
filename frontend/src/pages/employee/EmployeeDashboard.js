import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Badge,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const EmployeeDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/v1/leave/my");
      setLeaves(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/v1/leave/create", formData);
      toast.success("Leave request submitted successfully");
      setFormData({ leave_type: "", start_date: "", end_date: "", reason: "" });
      fetchMyLeaves();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to submit leave");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave request?")) return;
    try {
      await axios.delete(`/api/v1/leave/${id}/delete`);
      toast.success("Leave request deleted");
      fetchMyLeaves();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to delete leave");
    }
  };

  const handleEditLeave = (leave) => {
    setFormData({
      leave_type: leave.leave_type,
      start_date: leave.start_date,
      end_date: leave.end_date,
      reason: leave.reason,
      id: leave.id, // store id to differentiate update
    });
  };

  const handleUpdateLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/api/v1/leave/${formData.id}/update`, formData);
      toast.success("Leave request updated");
      setFormData({ leave_type: "", start_date: "", end_date: "", reason: "" });
      fetchMyLeaves();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Failed to update leave");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4">
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>{formData.id ? "Edit Leave Request" : "Apply for Leave"}</Card.Title>
              <Form onSubmit={formData.id ? handleUpdateLeave : handleApplyLeave}>
                <Form.Group className="mb-2">
                  <Form.Label>Leave Type</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.leave_type}
                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </Form.Group>
                <Button type="submit" disabled={submitting} className="mt-2">
                  {submitting ? "Processing..." : formData.id ? "Update Leave" : "Apply Leave"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>My Leaves</Card.Title>
              {loading ? (
                <Spinner animation="border" />
              ) : leaves.length === 0 ? (
                <p>No leave requests submitted yet.</p>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td>{leave.leave_type}</td>
                        <td>{leave.start_date} to {leave.end_date}</td>
                        <td>{leave.reason}</td>
                        <td>
                          <Badge bg={
                            leave.status === "pending" ? "warning" :
                            leave.status === "approved" ? "success" :
                            "danger"
                          }>
                            {leave.status}
                          </Badge>
                        </td>
                        <td>
                          {leave.status === "pending" && (
                            <>
                              <Button size="sm" variant="info" onClick={() => handleEditLeave(leave)}>Edit</Button>{" "}
                              <Button size="sm" variant="danger" onClick={() => handleDeleteLeave(leave.id)}>Delete</Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EmployeeDashboard;
