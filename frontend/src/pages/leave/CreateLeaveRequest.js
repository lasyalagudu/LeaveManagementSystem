import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import {
  FaCalendarAlt,
  FaFileAlt,
  FaSave,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CreateLeaveRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    leave_type_id: "",
    start_date: null,
    end_date: null,
    duration_type: "full_day",
    start_half: "",
    hours: "",
    reason: "",
    medical_proof: "",
    documentation: "",
  });

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [calculatedDays, setCalculatedDays] = useState(0);

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      calculateDays();
    } else {
      setCalculatedDays(0);
    }
  }, [formData.start_date, formData.end_date, formData.duration_type, formData.hours]);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/v1/leave-types");
      console.log("Fetched leave types:", response.data);
      setLeaveTypes(response.data);

      if (response.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          leave_type_id: response.data[0].id,
        }));
      }
    } catch (error) {
      console.error("Error fetching leave types:", error);
      toast.error("Failed to load leave types");
    } finally {
      setLoading(false);
    }
  };

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.leave_type_id) {
      newErrors.leave_type_id = "Please select a leave type";
    }

    if (!formData.start_date) {
      newErrors.start_date = "Start date is required";
    } else if (isDateInPast(formData.start_date)) {
      newErrors.start_date = "Start date cannot be in the past";
    }

    if (!formData.end_date) {
      newErrors.end_date = "End date is required";
    } else if (
      formData.start_date &&
      new Date(formData.end_date).setHours(0, 0, 0, 0) <
        new Date(formData.start_date).setHours(0, 0, 0, 0)
    ) {
      newErrors.end_date = "End date must be after start date";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Reason is required";
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters";
    }

    if (formData.duration_type === "half_day" && !formData.start_half) {
      newErrors.start_half = "Please select half day period";
    }

    if (
      formData.duration_type === "hourly" &&
      (!formData.hours || Number(formData.hours) <= 0 || Number(formData.hours) > 8)
    ) {
      newErrors.hours = "Please enter valid hours (1-8)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) {
      setCalculatedDays(0);
      return;
    }

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);

    if (start > end) {
      setCalculatedDays(0);
      return;
    }

    let days = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    if (formData.duration_type === "half_day") {
      days = days * 0.5;
    } else if (formData.duration_type === "hourly") {
      const hours = Number(formData.hours) || 0;
      days = hours / 8;
    }

    setCalculatedDays(days);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "leave_type_id" || name === "hours"
          ? value === ""
            ? null  // <-- Changed here: empty string to null for hours and leave_type_id
            : Number(value)
          : value,
    }));
  
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  

  const handleDateChange = (date, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const requestData = {
        ...formData,
        start_date: formData.start_date.toISOString().split("T")[0],
        end_date: formData.end_date.toISOString().split("T")[0],
        
      };
      if (formData.duration_type === "hourly") {
        requestData.hours = Number(formData.hours);
      } else {
        // Remove hours from requestData to avoid sending invalid data
        delete requestData.hours;
      }

      await axios.post("/api/v1/leave-requests", requestData);

      toast.success("Leave request submitted successfully!");
      navigate("/leave/my-requests");
    }  catch (error) {
      console.error("Error submitting leave request:", error);
    
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      } else if (error.request) {
        console.error("No response received, request made:", error.request);
      } else {
        console.error("Error setting up request:", error.message);
      }
    
      const errorMessage =
        (error.response?.data?.detail &&
          (Array.isArray(error.response.data.detail)
            ? error.response.data.detail.map((err) => err.msg).join(", ")
            : error.response.data.detail)) ||
        "Failed to submit leave request";
    
      toast.error(errorMessage);
    }
     finally {
      setSubmitting(false);
    }
  };

  const getSelectedLeaveType = () =>
    leaveTypes.find((lt) => lt.id === Number(formData.leave_type_id));

  const selectedLeaveType = getSelectedLeaveType();

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading leave types...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <FaCalendarAlt className="me-2" />
                Apply for Leave
              </h4>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                {/* Leave Type Selection */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Leave Type *</Form.Label>
                  <Form.Select
                    name="leave_type_id"
                    value={formData.leave_type_id}
                    onChange={handleChange}
                    isInvalid={!!errors.leave_type_id}
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.default_balance} days)
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.leave_type_id}
                  </Form.Control.Feedback>

                  {selectedLeaveType && (
                    <div className="mt-2">
                      <Badge bg="info" className="me-2">
                        {selectedLeaveType.category}
                      </Badge>
                      <small className="text-muted">
                        {selectedLeaveType.description}
                      </small>
                    </div>
                  )}
                </Form.Group>

                {/* Duration Type */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Duration Type *</Form.Label>
                  <div className="d-flex gap-3">
                    {["full_day", "half_day", "hourly"].map((type) => {
                      const allowKey =
                        type === "full_day"
                          ? "allow_full_day"
                          : type === "half_day"
                          ? "allow_half_day"
                          : "allow_hourly";

                      return (
                        <Form.Check
                          key={type}
                          type="radio"
                          id={`duration_${type}`}
                          name="duration_type"
                          value={type}
                          checked={formData.duration_type === type}
                          onChange={handleChange}
                          label={type
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                          disabled={
                            selectedLeaveType && !selectedLeaveType[allowKey]
                          }
                        />
                      );
                    })}
                  </div>
                </Form.Group>

                {/* Date Selection */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">Start Date *</Form.Label>
                      <DatePicker
                        selected={formData.start_date}
                        onChange={(date) => handleDateChange(date, "start_date")}
                        selectsStart
                        startDate={formData.start_date}
                        endDate={formData.end_date}
                        minDate={new Date()}
                        className={`form-control ${
                          errors.start_date ? "is-invalid" : ""
                        }`}
                        placeholderText="Select start date"
                        dateFormat="yyyy-MM-dd"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.start_date}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">End Date *</Form.Label>
                      <DatePicker
                        selected={formData.end_date}
                        onChange={(date) => handleDateChange(date, "end_date")}
                        selectsEnd
                        startDate={formData.start_date}
                        endDate={formData.end_date}
                        minDate={formData.start_date}
                        className={`form-control ${
                          errors.end_date ? "is-invalid" : ""
                        }`}
                        placeholderText="Select end date"
                        dateFormat="yyyy-MM-dd"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.end_date}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Duration Specific Fields */}
                {formData.duration_type === "half_day" && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Half Day Period *</Form.Label>
                    <Form.Select
                      name="start_half"
                      value={formData.start_half}
                      onChange={handleChange}
                      isInvalid={!!errors.start_half}
                    >
                      <option value="">Select Period</option>
                      <option value="morning">Morning (AM)</option>
                      <option value="afternoon">Afternoon (PM)</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.start_half}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}

                {formData.duration_type === "hourly" && (
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Hours *</Form.Label>
                    <Form.Control
                      type="number"
                      name="hours"
                      value={formData.hours}
                      onChange={handleChange}
                      min="1"
                      max="8"
                      step="0.5"
                      isInvalid={!!errors.hours}
                      placeholder="Enter number of hours (1-8)"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.hours}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}

                {/* Reason */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Reason *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    isInvalid={!!errors.reason}
                    placeholder="Enter reason for leave"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.reason}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Show calculated days */}
                <Alert variant="info" className="mb-3">
                  Total Leave Days: <strong>{calculatedDays.toFixed(2)}</strong>
                </Alert>

                {/* Submit & Cancel Buttons */}
                <div className="d-flex justify-content-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => navigate("/leave/my-requests")}
                    disabled={submitting}
                  >
                    <FaTimes className="me-1" />
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-1" />
                        Submit
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateLeaveRequest;
