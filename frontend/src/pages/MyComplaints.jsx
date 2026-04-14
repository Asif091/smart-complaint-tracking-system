import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  // STAFF VIEW - Grouped by department, show status, no status change
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
                  <div>Category: {c.category}</div>
                  <div>Status: {c.status}</div>
                  <div>Created by: {c.createdBy?.name || "Unknown"}</div>
                  <div>Created on: {new Date(c.createdAt).toLocaleString()}</div>
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
              <th style={{ textAlign: "left", padding: "8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map(c => (
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
                  {editingId === c._id ? (
                    <div>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows="3"
                        style={{ width: "100%", padding: "4px", marginBottom: "4px" }}
                      />
                      <button onClick={() => handleSaveEdit(c._id)}>Save</button>
                      <button onClick={handleCancelEdit}>Cancel</button>
                    </div>
                  ) : (
                    c.status === "pending" && (
                      <button onClick={() => handleEdit(c)}>Edit</button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}