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
  const [staffList, setStaffList] = useState([]);
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
    fetchStaffList();
    if (user?.role === "employee") {
      fetchMyComplaints();
    }
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get("/api/complaints", {
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

  const fetchStaffList = async () => {
    try {
      const res = await axios.get("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const staff = res.data.filter(u => u.role === "staff" && u.status === "active");
      console.log("Staff list:", staff);
      setStaffList(staff);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyComplaints = async () => {
    try {
      const res = await axios.get("/api/complaints/my-complaints", {
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

  const assignToStaff = async (complaintId) => {
    try {
      const staffSelect = document.getElementById(`staff-${complaintId}`);
      const staffId = staffSelect?.value;

      if (!staffId) {
        alert("Please select a staff member");
        return;
      }

      const res = await axios.put(
        `/api/complaints/${complaintId}/assign-staff`,
        { staffId },
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
      alert(err.response?.data?.message || "Failed to assign to staff");
    }
  };


  const updateStatus = async (complaintId, newStatus) => {
    try {
      const res = await axios.patch(
        `/api/complaints/${complaintId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert(res.data.message);
      fetchComplaints(); 
      if (user?.role === "employee") {
        fetchMyComplaints();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update status");
    }
  };


  const handleCreate = async () => {
    try {
      const res = await axios.post(
        "/api/complaints",
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
        `/api/complaints/${id}`,
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
                    <small>Category: {c.category}</small>
                    <br />
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

      {/* ADMIN VIEW - Grouped by Department */}
      {user?.role === "admin" && (
        <div style={{ marginTop: "20px" }}>
          {(() => {
            const grouped = {
              "HR": [],
              "IT": [],
              "Finance": [],
              "Marketing & Sales": [],
              "Software & Product Development": [],
              "Unassigned": []
            };

            complaints.forEach(c => {
              const dept = c.assignedDepartment;
              if (dept && grouped[dept]) {
                grouped[dept].push(c);
              } else {
                grouped["Unassigned"].push(c);
              }
            });

            const departmentsToShow = Object.keys(grouped).filter(dept => grouped[dept].length > 0);

            if (departmentsToShow.length === 0) {
              return <p>No complaints found.</p>;
            }

            return departmentsToShow.map(dept => (
              <div key={dept} style={{ marginBottom: "30px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "10px", padding: "8px 0", borderBottom: "2px solid currentColor", color: "inherit" }}>
                📁 {dept} Department ({grouped[dept].length})
              </h3>
                {grouped[dept].map(c => (
                  <div key={c._id} style={{ marginBottom: "15px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px", marginLeft: "15px" }}>
                    <strong>{c.title}</strong>
                    <p>{c.description}</p>
                    <div>Category: {c.category}</div>
                    <div>Status: {c.status}</div>

                    <div style={{ marginTop: "10px" }}>
                      <label style={{ marginRight: "10px" }}>Update Status: </label>
                      <select
                        value={c.status}
                        onChange={(e) => updateStatus(c._id, e.target.value)}
                        style={{ padding: "5px", borderRadius: "4px", cursor: "pointer" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>Created by: {c.createdBy?.name || "Unknown"}</div>
                    <div>Created on: {new Date(c.createdAt).toLocaleString()}</div>
                    
                    {c.assignedTo && (
                      <div style={{ marginTop: "8px", color: "green" }}>
                        <div>✅ Assigned to: {c.assignedTo?.name || "Staff"}</div>
                        <div>📅 Assigned on: {new Date(c.assignedAt).toLocaleString()}</div>
                      </div>
                    )}
                    
                    {c.status === "pending" && (
                      <div style={{ marginTop: "10px" }}>
                        <select
                          id={`staff-${c._id}`}
                          style={{ padding: "5px", marginRight: "10px" }}
                        >
                          <option value="">Select Staff</option>
                          {staffList.map(staff => (
                            <option key={staff._id} value={staff._id}>{staff.name} ({staff.email})</option>
                          ))}
                        </select>
                        <button
                          onClick={() => assignToStaff(c._id)}
                          style={{ padding: "5px 10px", cursor: "pointer" }}
                        >
                          Assign to Staff
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
      )}


      {user?.role === "staff" && (
        <div style={{ marginTop: "20px" }}>
          <h3>My Assigned Complaints</h3>
          {complaints.filter(c => c.assignedTo?._id === user?.id).length === 0 ? (
            <p>No complaints assigned to you.</p>
          ) : (
            complaints.filter(c => c.assignedTo?._id === user?.id).map((c) => (
              <div key={c._id} style={{ marginBottom: "15px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
                <strong>{c.title}</strong>
                <p>{c.description}</p>
                <div>Category: {c.category}</div>
                <div>Current Status: <strong style={{ color: "#2196f3" }}>{c.status}</strong></div>
                <div>Created by: {c.createdBy?.name || "Unknown"}</div>
                <div>Created on: {new Date(c.createdAt).toLocaleString()}</div>
                
                <div style={{ marginTop: "10px" }}>
                  <label style={{ marginRight: "10px" }}>Update Status: </label>
                  <select
                    value={c.status}
                    onChange={(e) => updateStatus(c._id, e.target.value)}
                    style={{ padding: "5px", borderRadius: "4px", cursor: "pointer" }}
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            ))
          )}
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