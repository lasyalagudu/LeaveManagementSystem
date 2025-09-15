import React, { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const CancelLeavePage = () => {
  const [leaveId, setLeaveId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!leaveId) {
      toast.error("Please enter a Leave ID");
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`/api/v1/leave/${leaveId}/cancel`);
      toast.success("Leave cancelled successfully");
      setLeaveId("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to cancel leave");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3">
      <h3>Cancel Leave Request</h3>

      <Form>
        <Form.Group>
          <Form.Label>Enter Leave ID</Form.Label>
          <Form.Control
            type="text"
            value={leaveId}
            onChange={(e) => setLeaveId(e.target.value)}
            placeholder="Leave ID"
          />
        </Form.Group>

        <Button
          className="mt-2"
          variant="danger"
          onClick={handleCancel}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : "Cancel Leave"}
        </Button>
      </Form>
    </div>
  );
};

export default CancelLeavePage;
