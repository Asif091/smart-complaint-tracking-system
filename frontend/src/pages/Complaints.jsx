import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Complaints() {
  const { user } = useAuth();
  const [success, setSuccess] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchComplaints();
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

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Complaints</h2>

      {/* ✅ EMPLOYEE VIEW */}
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
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <button onClick={handleCreate}>Submit</button>
        </div>
      )}

      {(user?.role !== "employee" || location.pathname === "/track") && (
        <div style={{ marginTop: "20px" }}>
          <h3>Complaints</h3>

          {complaints.map((c) => (
            <div key={c._id} style={{ marginBottom: "10px" }}>
              <strong>{c.title}</strong>
              <p>{c.description}</p>
              <small>Status: {c.status}</small>
            </div>
          ))}
        </div>
      )}
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