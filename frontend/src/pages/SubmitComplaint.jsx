import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SubmitComplaint() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  // <<<<<< NEW - Change these to actual issue categories, not departments
  const categories = [
    "Hardware Issue",
    "Software Issue", 
    "Network Problem",
    "Salary Dispute",
    "Leave Request",
    "Workplace Harassment",
    "Policy Suggestion",
    "Other"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!title || !description || !category) {
      setError("All fields required");
      setLoading(false);
      return;
    }

    try {
      const token = getToken();
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, category })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Submission failed");
        setLoading(false);
        return;
      }

      setSuccess("Complaint submitted!");
      setTitle("");
      setDescription("");
      setCategory("");
      setTimeout(() => navigate("/my-complaints"), 1500);

    } catch (err) {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "auto" }}>
      <h1>Submit Complaint</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", margin: "5px 0" }}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows="4"
          style={{ width: "100%", padding: "8px", margin: "5px 0" }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", margin: "5px 0" }}
        >
          <option value="">Select Category</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: "100%", 
            padding: "10px", 
            marginTop: "10px",
            backgroundColor: "#4CAF50",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}