import axios from "axios";

const API_URL = "/api/v1/leave";

// Leave Requests
export const getMyLeaveRequests = () => axios.get(`${API_URL}/my-requests`);
export const getLeaveRequests = () => axios.get(`${API_URL}/requests`); // HR/Admin
export const applyLeave = (data) => axios.post(`${API_URL}/requests`, data);
export const approveLeave = (id) => axios.put(`${API_URL}/requests/${id}/approve`);
export const rejectLeave = (id) => axios.put(`${API_URL}/requests/${id}/reject`);

// Leave Balances
export const getMyLeaveBalances = () => axios.get(`${API_URL}/my-balances`);
export const getEmployeeLeaveBalances = (employeeId) =>
  axios.get(`${API_URL}/balances/${employeeId}`);

// Holidays
export const getHolidays = () => axios.get(`${API_URL}/holidays`);
export const addHoliday = (data) => axios.post(`${API_URL}/holidays`, data);
export const updateHoliday = (id, data) =>
  axios.put(`${API_URL}/holidays/${id}`, data);
export const deleteHoliday = (id) =>
  axios.delete(`${API_URL}/holidays/${id}`);
