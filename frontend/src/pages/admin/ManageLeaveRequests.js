import React, { useEffect, useState, useContext } from "react";
import { Table, Button, Spinner, Alert } from "react-bootstrap";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const ManageLeaveRequests = () => {
  const { token } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://127.0.0.1:8000/api/v1/leave/requests/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      setError("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/v1/leave/requests/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(requests.filter((req) => req.id !== id));
    } catch (err) {
      alert("Failed to approve leave request");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/v1/leave/requests/${id}/reject`,
        { rejection_reason: reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(requests.filter((req) => req.id !== id));
    } catch (err) {
      alert("Failed to reject leave request");
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="container mt-4">
      <h2>Pending Leave Requests</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Leave Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Reason</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.length > 0 ? (
            requests.map((req) => (
              <tr key={req.id}>
                <td>{req.id}</td>
                <td>{req.employee?.first_name} {req.employee?.last_name}</td>
                <td>{req.leave_type?.name}</td>
                <td>{new Date(req.start_date).toLocaleDateString()}</td>
                <td>{new Date(req.end_date).toLocaleDateString()}</td>
                <td>{req.status}</td>
                <td>{req.reason || "N/A"}</td>
                <td>
                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={() => handleApprove(req.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(req.id)}
                  >
                    Reject
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center">
                No pending requests
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default ManageLeaveRequests;
