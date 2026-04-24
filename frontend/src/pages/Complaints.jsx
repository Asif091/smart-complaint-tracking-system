import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import ComplaintTimeline from "../components/ComplaintTimeline";
import ComplaintSearch from "../components/ComplaintSearch";


function AttachmentList({ attachments }) {
  if (!attachments || attachments.length === 0) return null;

  const isImage = (mimetype) => mimetype?.startsWith("image/");

  return (
    <div style={{ marginTop: "10px" }}>
      <strong>Attachments ({attachments.length}):</strong>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "5px" }}>
        {attachments.map((file, index) => (
          <div key={index} style={{ 
            border: "1px solid #ddd", 
            padding: "5px", 
            borderRadius: "4px",
            maxWidth: "150px"
          }}>
            {isImage(file.mimetype) ? (
              <a href={`/uploads/${file.filename}`} target="_blank" rel="noopener noreferrer">
                <img 
                  src={`/uploads/${file.filename}`} 
                  alt={file.originalName}
                  style={{ width: "100px", height: "100px", objectFit: "cover", cursor: "pointer" }}
                />
              </a>
            ) : (
              <a 
                href={`/api/uploads/${file.filename}`} 
                download={file.originalName}
                rel="noopener noreferrer"
                style={{ display: "block", fontSize: "12px", textDecoration: "none", color: "#0066cc" }}
              >
                📄 {file.originalName}
              </a>
            )}
            <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Complaints() {
  const { user } = useAuth();
  const [success, setSuccess] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // NEW: States for comments and history
  const [commentText, setCommentText] = useState({});
  const [expandedHistory, setExpandedHistory] = useState({});
  const [complaintHistory, setComplaintHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResultCount, setSearchResultCount] = useState(null);


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

  // NEW: Fetch complaint history
  const fetchComplaintHistory = async (complaintId) => {
    setLoadingHistory(prev => ({ ...prev, [complaintId]: true }));
    try {
      const res = await axios.get(`/api/complaints/${complaintId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaintHistory(prev => ({ ...prev, [complaintId]: res.data.history }));
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  // NEW: Toggle history expansion
  const toggleHistory = (complaintId) => {
    if (!expandedHistory[complaintId]) {
      fetchComplaintHistory(complaintId);
    }
    setExpandedHistory(prev => ({ ...prev, [complaintId]: !prev[complaintId] }));
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
      
      // Refresh history if expanded
      if (expandedHistory[complaintId]) {
        fetchComplaintHistory(complaintId);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to assign to staff");
    }
  };

  // MODIFIED: Update status with optional comment
  const updateStatus = async (complaintId, newStatus, comment = null) => {
    try {
      const payload = { status: newStatus };
      if (comment) {
        payload.comment = comment;
      }

      const res = await axios.patch(
        `/api/complaints/${complaintId}/status`,
        payload,
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
      
      // Clear comment input
      setCommentText(prev => ({ ...prev, [complaintId]: "" }));
      
      // Refresh history if expanded
      if (expandedHistory[complaintId]) {
        fetchComplaintHistory(complaintId);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  // NEW: Add comment only (no status change)
  const addComment = async (complaintId) => {
    const comment = commentText[complaintId];
    if (!comment || comment.trim() === "") {
      alert("Please enter a comment");
      return;
    }

    setSubmittingComment(prev => ({ ...prev, [complaintId]: true }));
    try {
      const res = await axios.post(
        `/api/complaints/${complaintId}/comments`,
        { comment },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setCommentText(prev => ({ ...prev, [complaintId]: "" }));
      
      // Refresh history
      if (expandedHistory[complaintId]) {
        fetchComplaintHistory(complaintId);
      }
      
      alert("Comment added successfully");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmittingComment(prev => ({ ...prev, [complaintId]: false }));
    }
  };


  const handleSearch = async (filters) => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.department !== 'all') params.append('department', filters.department);

      const queryString = params.toString();
      const url = `/api/complaints/search${queryString ? `?${queryString}` : ''}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setComplaints(res.data.complaints);
      setSearchResultCount(res.data.count);
    } catch (err) {
      console.error(err);
      alert('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const resetAndFetchAll = () => {
    fetchComplaints();
    setSearchResultCount(null);
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
                    
                    {/* NEW: History Toggle Button */}
                    <button
                      className="history-toggle-btn"
                      onClick={() => toggleHistory(c._id)}
                      style={{ marginLeft: "10px" }}
                    >
                      {expandedHistory[c._id] ? "Hide" : "View"} History
                    </button>

                    {/* NEW: History Timeline */}
                    {expandedHistory[c._id] && (
                      <div style={{ marginTop: "15px" }}>
                        {loadingHistory[c._id] ? (
                          <p>Loading history...</p>
                        ) : (
                          <ComplaintTimeline 
                            logs={complaintHistory[c._id] || []} 
                            compact={true}
                          />
                        )}
                      </div>
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
          
          <div style={{ marginBottom: "20px" }}>
            <ComplaintSearch onSearch={handleSearch} loading={searchLoading} />
            {searchResultCount !== null && (
              <div style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
                Found {searchResultCount} complaint(s)
                <button onClick={resetAndFetchAll} style={{ 
                  marginLeft: "10px", 
                  background: "none", 
                  border: "none", 
                  color: "#2196f3", 
                  cursor: "pointer",
                  textDecoration: "underline"
                }}>
                  Show all
                </button>
              </div>
            )}
          </div>
          
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
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          const comment = commentText[c._id];
                          updateStatus(c._id, newStatus, comment);
                        }}
                        style={{ padding: "5px", borderRadius: "4px", cursor: "pointer" }}
                      >
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    <div>Created by: {c.createdBy?.name || "Unknown"}</div>
                    <div>Created on: {new Date(c.createdAt).toLocaleString()}</div>
                    
                    <AttachmentList attachments={c.attachments} />
                    
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

                    {/* History Toggle */}
                    <div style={{ marginTop: "15px" }}>
                      <button
                        className="history-toggle-btn"
                        onClick={() => toggleHistory(c._id)}
                        style={{ padding: "5px 10px", cursor: "pointer", backgroundColor: "#f0f0f0", border: "1px solid #ccc", borderRadius: "4px" }}
                      >
                        {expandedHistory[c._id] ? "📋 Hide History" : "📋 View History"}
                      </button>
                    </div>

                    {/* History Timeline */}
                    {expandedHistory[c._id] && (
                      <div style={{ marginTop: "15px" }}>
                        {loadingHistory[c._id] ? (
                          <p>Loading history...</p>
                        ) : (
                          <ComplaintTimeline 
                            logs={complaintHistory[c._id] || []} 
                            compact={false}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
      )}


      {/* STAFF VIEW */}
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
                
                <AttachmentList attachments={c.attachments} />
                
                <div style={{ marginTop: "10px" }}>
                  <label style={{ marginRight: "10px" }}>Update Status: </label>
                  <select
                    value={c.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      const comment = commentText[c._id];
                      updateStatus(c._id, newStatus, comment);
                    }}
                    style={{ padding: "5px", borderRadius: "4px", cursor: "pointer" }}
                  >
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                {/* NEW: History Toggle */}
                <div style={{ marginTop: "15px" }}>
                  <button
                    className="history-toggle-btn"
                    onClick={() => toggleHistory(c._id)}
                  >
                    {expandedHistory[c._id] ? "📋 Hide History" : "📋 View History"}
                  </button>
                </div>

                {/* NEW: History Timeline */}
                {expandedHistory[c._id] && (
                  <div style={{ marginTop: "15px" }}>
                    {loadingHistory[c._id] ? (
                      <p>Loading history...</p>
                    ) : (
                      <ComplaintTimeline 
                        logs={complaintHistory[c._id] || []} 
                        compact={false}
                      />
                    )}
                  </div>
                )}
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