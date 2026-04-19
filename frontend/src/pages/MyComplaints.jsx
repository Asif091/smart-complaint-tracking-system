import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ComplaintTimeline from "../components/ComplaintTimeline";

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
                href={`/uploads/${file.filename}`} 
                target="_blank" 
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

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // NEW: States for history
  const [expandedHistory, setExpandedHistory] = useState({});
  const [complaintHistory, setComplaintHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  
  const { getToken, user } = useAuth();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = getToken();
      
      if (user?.role === "staff") {
        const res = await fetch("/api/complaints/staff/grouped", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        setComplaints(data);
      } else {
        const res = await fetch("/api/complaints/my-complaints", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        setComplaints(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch complaint history
  const fetchComplaintHistory = async (complaintId) => {
    setLoadingHistory(prev => ({ ...prev, [complaintId]: true }));
    try {
      const token = getToken();
      const res = await fetch(`/api/complaints/${complaintId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setComplaintHistory(prev => ({ ...prev, [complaintId]: data.history }));
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

  const handleEdit = (complaint) => {
    setEditingId(complaint._id);
    setEditTitle(complaint.title);
    setEditDescription(complaint.description);
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setError("");
  };

  const handleSaveEdit = async (id) => {
    if (!editTitle || !editDescription) {
      setError("Title and description are required");
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`/api/complaints/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle, description: editDescription })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to update complaint");
        return;
      }

      setSuccess("Complaint updated successfully!");
      setEditingId(null);
      setEditTitle("");
      setEditDescription("");
      fetchComplaints();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Network error");
    }
  };

  if (loading) return <div>Loading...</div>;

  // STAFF VIEW - Grouped by department
  if (user?.role === "staff") {
    const departments = Object.keys(complaints);
    const hasComplaints = departments.some(dept => complaints[dept]?.length > 0);

    if (!hasComplaints) {
      return (
        <div>
          <h1>Assigned Complaints</h1>
          <p>No complaints assigned to you.</p>
        </div>
      );
    }

    return (
      <div>
        <h1>Assigned Complaints</h1>
        {departments.map(dept => (
          complaints[dept]?.length > 0 && (
            <div key={dept} style={{ marginBottom: "30px" }}>
              <h3>{dept} Department ({complaints[dept].length})</h3>
              {complaints[dept].map(c => (
                <div key={c._id} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px", borderRadius: "4px" }}>
                  <strong>{c.title}</strong>
                  <p>{c.description}</p>
                  <AttachmentList attachments={c.attachments} />
                  <div>Category: {c.category}</div>
                  <div>Status: {c.status}</div>
                  <div>Created by: {c.createdBy?.name || "Unknown"}</div>
                  <div>Created on: {new Date(c.createdAt).toLocaleString()}</div>
                  
                  {/* NEW: History Toggle for Staff */}
                  <div style={{ marginTop: "10px" }}>
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
                          compact={true}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ))}
      </div>
    );
  }

  // EMPLOYEE VIEW
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>My Complaints</h1>
        <Link to="/submit-complaint">+ New</Link>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {complaints.length === 0 ? (
        <p>No complaints yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px" }}>Title</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Category</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Department</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Date</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Attachments</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map(c => (
              <>
                <tr key={c._id}>
                  <td style={{ padding: "8px", borderTop: "1px solid #ddd" }}>
                    {editingId === c._id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{ width: "100%", padding: "4px" }}
                      />
                    ) : (
                      c.title
                    )}
                  </td>
                  <td style={{ padding: "8px", borderTop: "1px solid #ddd" }}>{c.category}</td>
                  <td style={{ padding: "8px", borderTop: "1px solid #ddd" }}>{c.assignedDepartment || "Not assigned"}</td>
                  <td style={{ padding: "8px", borderTop: "1px solid #ddd" }}>{c.status}</td>
                  <td style={{ padding: "8px", borderTop: "1px solid #ddd" }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "8px", borderTop: "1px solid #ddd" }}>
                    {c.attachments?.length > 0 ? (
                      <span style={{ color: "#0066cc" }}>{c.attachments.length} file(s)</span>
                    ) : (
                      <span style={{ color: "#999" }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: "8px", borderTop: "1px solid #ddd" }}>
                    {editingId === c._id ? (
                      <div>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows="3"
                          style={{ width: "100%", padding: "4px", marginBottom: "4px" }}
                        />
                        <button onClick={() => handleSaveEdit(c._id)}>Save</button>
                        <button onClick={handleCancelEdit} style={{ marginLeft: "5px" }}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        {c.status === "pending" && (
                          <button onClick={() => handleEdit(c)}>Edit</button>
                        )}
                        <button
                          className="history-toggle-btn"
                          onClick={() => toggleHistory(c._id)}
                        >
                          {expandedHistory[c._id] ? "Hide History" : "View History"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                
                {/* NEW: History Timeline Row */}
                {expandedHistory[c._id] && (
                  <tr>
                    <td colSpan="7" style={{ padding: "10px", borderTop: "1px solid #ddd", background: "var(--surface)" }}>
                      <AttachmentList attachments={c.attachments} />
                      {loadingHistory[c._id] ? (
                        <p style={{ textAlign: "center", padding: "20px" }}>Loading history...</p>
                      ) : (
                        <ComplaintTimeline 
                          logs={complaintHistory[c._id] || []} 
                          compact={false}
                        />
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}