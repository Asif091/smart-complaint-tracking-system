import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = getToken();
        const res = await fetch("/api/complaints/my", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        setComplaints(data.complaints);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>My Complaints</h1>
        <Link to="/submit-complaint">+ New</Link>
      </div>

      {complaints.length === 0 ? (
        <p>No complaints yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px" }}>Title</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Category</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Status</th>
              <th style={{ textAlign: "left", padding: "8px" }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map(c => (
              <tr key={c._id}>
                <td style={{ padding: "8px", borderTop: "1px solid #ddd" }}>{c.title}</td>
                <td style={{ padding: "8px", borderTop: "1px solid #ddd" }}>{c.category}</td>
                <td style={{ padding: "8px", borderTop: "1px solid #ddd" }}>{c.status}</td>
                <td style={{ padding: "8px", borderTop: "1px solid #ddd" }}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}