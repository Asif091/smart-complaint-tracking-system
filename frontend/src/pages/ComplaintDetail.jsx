import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComplaintDetail();
  }, [id]);

  const fetchComplaintDetail = async () => {
    try {
      const token = getToken();
      const res = await fetch(`/api/complaints/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 403 || res.status === 404) navigate("/");
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setComplaint(data.complaint);
      setHistory(data.history);
    } catch (err) {
      console.error(err);
      setError("Could not load complaint details");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    setUpdating(true);
    try {
      const token = getToken();
      const payload = { status: newStatus };
      if (statusComment) payload.comment = statusComment;
      const res = await fetch(`/api/complaints/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      setStatusComment("");
      fetchComplaintDetail(); // refresh
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/complaints/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment: commentText })
      });
      if (!res.ok) throw new Error("Comment failed");
      setCommentText("");
      fetchComplaintDetail();
    } catch (err) {
      console.error(err);
      alert("Failed to add comment");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!complaint) return <div>Complaint not found</div>;

  const canUpdateStatus = 
    user.role === "admin" ||
    (user.role === "staff" && complaint.assignedTo?._id === user.id) ||
    (user.role === "employee" && complaint.createdBy?._id === user.id);

  const canAddComment = canUpdateStatus; // same permissions

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "20px", cursor: "pointer" }}>← Back</button>
      
      <h1>{complaint.title}</h1>
      <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
        <p><strong>Description:</strong> {complaint.description}</p>
        <p><strong>Category:</strong> {complaint.category || "N/A"}</p>
        <p><strong>Priority:</strong> {complaint.priority || "medium"}</p>
        <p><strong>Status:</strong> <span style={{ fontWeight: "bold", color: "#2196f3" }}>{complaint.status}</span></p>
        <p><strong>Created by:</strong> {complaint.createdBy?.name} ({complaint.createdBy?.email})</p>
        <p><strong>Created on:</strong> {new Date(complaint.createdAt).toLocaleString()}</p>
        {complaint.assignedTo && (
          <p><strong>Assigned to:</strong> {complaint.assignedTo.name} ({complaint.assignedTo.email})</p>
        )}
        {complaint.resolutionTime && (
          <p><strong>Resolution time:</strong> {complaint.resolutionTime} days</p>
        )}
        <AttachmentList attachments={complaint.attachments} />
      </div>

      {/* Status update section */}
      {canUpdateStatus && (
        <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
          <h3>Update Status</h3>
          <select 
            value={complaint.status} 
            onChange={(e) => updateStatus(e.target.value)}
            disabled={updating}
            style={{ padding: "5px", marginRight: "10px" }}
          >
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <input
            type="text"
            placeholder="Optional comment with status change"
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            style={{ padding: "5px", width: "300px", marginLeft: "10px" }}
          />
        </div>
      )}

      {/* Add comment section */}
      {canAddComment && (
        <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
          <h3>Add Comment</h3>
          <textarea
            rows="3"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment here..."
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
          <button onClick={addComment}>Post Comment</button>
        </div>
      )}

      {/* Timeline history */}
      <div style={{ border: "1px solid #ddd", padding: "15px", borderRadius: "8px" }}>
        <h3>Activity Timeline</h3>
        <ComplaintTimeline logs={history} compact={false} />
      </div>
    </div>
  );
}