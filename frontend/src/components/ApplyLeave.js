import { useEffect, useState } from "react";
import axios from "axios";

const ApplyLeave = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/v1/leave-types?active_only=true")
      .then((res) => setLeaveTypes(res.data))
      .catch((err) => console.error("Error fetching leave types", err));
  }, []);

  return (
    <div>
      <h2>Apply Leave</h2>
      <form>
        <label>Leave Type</label>
        <select>
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
};

export default ApplyLeave;
