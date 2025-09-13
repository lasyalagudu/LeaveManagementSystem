import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Spinner, Alert } from "react-bootstrap";
import { FaCheck, FaTimes, FaEdit } from "react-icons/fa";

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/leaves/requests");
      if (res.data && res.data.length > 0) {
        setRequests(res.data);
      } else {
        setRequests([]); // explicitly set empty array
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to fetch leave requests.");
    } finally {
      setLoading(false);
    }
  };

  const getDurationText = (durationType) => {
    if (!durationType) return "N/A";
    switch (durationType) {
      case "full_day":
        return "Full Day";
      case "half_day":
        return "Half Day";
      default:
        return durationType;
    }
  };

  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Leave Requests</h2>

      {requests.length === 0 ? (
        <Alert variant="info">No leave requests found.</Alert>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee ID</th>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.id}</td>
                <td>{req.employee_id}</td>
                <td>{req.leave_type}</td>
                <td>{req.start_date}</td>
                <td>{req.end_date}</td>
                <td>{getDurationText(req.duration_type)}</td>
                <td>{req.status}</td>
                <td>
                  <Button variant="success" size="sm" className="me-2">
                    <FaCheck />
                  </Button>
                  <Button variant="danger" size="sm" className="me-2">
                    <FaTimes />
                  </Button>
                  <Button variant="warning" size="sm">
                    <FaEdit />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default LeaveRequests;
