import React, { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const ModifyLeavePage = () => {
  const [leaveId, setLeaveId] = useState("");
  const [leaveData, setLeaveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchLeave = async () => {
    if (!leaveId) {
      toast.error("Please enter a Leave ID");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`/api/v1/leave/${leaveId}`);
      setLeaveData(res.data);
      toast.success("Leave loaded successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Leave not found");
      setLeaveData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axios.put(`/api/v1/leave/${leaveId}/update`, leaveData);
      toast.success("Leave updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update leave");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-3">
      <h3>Modify Leave Request</h3>

      {/* Search by Leave ID */}
      <Form className="mb-3">
        <Form.Group>
          <Form.Label>Enter Leave ID</Form.Label>
          <Form.Control
            type="text"
            value={leaveId}
            onChange={(e) => setLeaveId(e.target.value)}
            placeholder="Leave ID"
          />
        </Form.Group>
        <Button className="mt-2" onClick={fetchLeave} disabled={loading}>
          {loading ? <Spinner size="sm" /> : "Fetch Leave"}
        </Button>
      </Form>

      {/* Modify Form */}
      {leaveData && (
        <Form onSubmit={handleUpdate}>
          <Form.Group className="mb-2">
            <Form.Label>Leave Type</Form.Label>
            <Form.Control
              type="text"
              value={leaveData.leave_type || ""}
              onChange={(e) =>
                setLeaveData({ ...leaveData, leave_type: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Reason</Form.Label>
            <Form.Control
              type="text"
              value={leaveData.reason || ""}
              onChange={(e) =>
                setLeaveData({ ...leaveData, reason: e.target.value })
              }
            />
          </Form.Group>

          <Button type="submit" disabled={updating}>
            {updating ? "Updating..." : "Update Leave"}
          </Button>
        </Form>
      )}
    </div>
  );
};

export default ModifyLeavePage;
