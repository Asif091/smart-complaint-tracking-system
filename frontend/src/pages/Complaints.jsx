import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Complaints() {
  const { user } = useAuth();
  const [success, setSuccess] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
  });

  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchComplaints();
    if (user?.role === "employee") {
      fetchMyComplaints();
    }
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/complaints", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("API DATA:", res.data);
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyComplaints = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/complaints/my-complaints", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("MY COMPLAINTS:", res.data);
      setMyComplaints(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ ADD THIS FUNCTION - Assign to Department
  const assignToDepartment = async (complaintId) => {
    try {
      const departmentSelect = document.getElementById(`dept-${complaintId}`);
      const department = departmentSelect?.value;

      if (!department) {
        alert("Please select a department");
        return;
      }

      const res = await axios.put(
        `http://localhost:5000/api/complaints/${complaintId}/assign-department`,
        { department },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data.message);
      fetchComplaints();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to assign department");
    }
  };

  const handleCreate = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/complaints",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Response:", res.data);
      setSuccess(res.data || form);
      setForm({ title: "", description: "" });
      fetchMyComplaints();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (complaint) => {
    setEditingId(complaint._id);
    setEditForm({
      title: complaint.title,
      description: complaint.description,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", description: "" });
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/complaints/${id}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Updated complaint:", res.data);
      fetchMyComplaints();
      setEditingId(null);
      setEditForm({ title: "", description: "" });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update complaint");
    }
  };

  return (
    <div>
      <h2>Complaints</h2>

      {/* EMPLOYEE VIEW - Create Complaint */}
      {user?.role === "employee" && location.pathname === "/register" && (
        <div>
          <h3>Create Complaint</h3>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button onClick={handleCreate}>Submit</button>
        </div>
      )}

      {/* EMPLOYEE VIEW - Personal Complaint History */}
      {user?.role === "employee" && location.pathname === "/track" && (
        <div style={{ marginTop: "20px" }}>
          <h3>My Complaint History</h3>
          {myComplaints.length === 0 ? (
            <p>No complaints found.</p>
          ) : (
            myComplaints.map((c) => (
              <div key={c._id} style={{ marginBottom: "15px", border: "1px solid #ccc", padding: "10px" }}>
                {editingId === c._id ? (
                  <div>
                    <input
                      placeholder="Title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      style={{ marginBottom: "5px", display: "block", width: "100%" }}
                    />
                    <textarea
                      placeholder="Description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      style={{ marginBottom: "5px", display: "block", width: "100%" }}
                    />
                    <button onClick={() => handleSaveEdit(c._id)}>Save</button>
                    <button onClick={handleCancelEdit} style={{ marginLeft: "5px" }}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    <strong>{c.title}</strong>
                    <p>{c.description}</p>
                    <small>Status: {c.status}</small>
                    {c.status === "pending" && (
                      <button onClick={() => handleEditClick(c)} style={{ marginLeft: "10px" }}>
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ✅ ADMIN VIEW - All Complaints with Assign Button */}
      {user?.role === "admin" && (
        <div style={{ marginTop: "20px" }}>
          <h3>All Complaints</h3>
          {complaints.map((c) => (
            <div key={c._id} style={{ marginBottom: "15px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
              <strong>{c.title}</strong>
              <p>{c.description}</p>
              <small>Status: {c.status}</small>
              <br />
              <small>Created by: {c.createdBy?.name || "Unknown"}</small>
              
              {/* Show assigned department if exists */}
              {c.assignedDepartment && (
                <div style={{ marginTop: "5px", color: "green" }}>
                  <small>✅ Assigned to: {c.assignedDepartment}</small>
                  <br />
                  <small>📅 Assigned on: {new Date(c.assignedAt).toLocaleString()}</small>
                </div>
              )}
              
              {/* ONLY ADMIN sees Assign button (pending complaints only) */}
              {c.status === "pending" && (
                <div style={{ marginTop: "10px" }}>
                  <select
                    id={`dept-${c._id}`}
                    style={{ padding: "5px", marginRight: "10px", borderRadius: "4px" }}
                  >
                    <option value="">Select Department</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing & Sales">Marketing & Sales</option>
                    <option value="Software & Product Development">Software & Product Development</option>
                  </select>
                  <button
                    onClick={() => assignToDepartment(c._id)}
                    style={{ padding: "5px 10px", cursor: "pointer", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px" }}
                  >
                    Assign to Department
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Success Message */}
      {success && location.pathname === "/register" && (
        <div style={{ marginTop: "20px", border: "1px solid green", padding: "10px" }}>
          <h4 style={{ color: "green" }}>✅ Complaint submitted successfully!</h4>
          <p><strong>Title:</strong> {success.title}</p>
          <p><strong>Description:</strong> {success.description}</p>
          <p><strong>Status:</strong> {success.status}</p>
        </div>
      )}
    </div>
  );
}