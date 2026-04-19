import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SubmitComplaint() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + attachments.length > 5) {
      setError("Maximum 5 files allowed");
      return;
    }

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`File too large: ${file.name} (max 10MB)`);
        return false;
      }
      return true;
    });

    setAttachments([...attachments, ...validFiles]);
  };

  const removeFile = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

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
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      attachments.forEach(file => {
        formData.append("attachments", file);
      });

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
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
      setAttachments([]);
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

        <div style={{ margin: "10px 0" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Attachments (optional)
          </label>
          <p style={{ fontSize: "12px", color: "#666", margin: "0 0 5px 0" }}>
            Images (JPG, PNG, GIF, WEBP), PDF, DOC, DOCX - Max 10MB each, up to 5 files
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
            style={{ width: "100%", padding: "8px", margin: "5px 0" }}
          />
          
          {attachments.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              {attachments.map((file, index) => (
                <div key={index} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: "5px 10px",
                  marginBottom: "5px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px"
                }}>
                  <span style={{ fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px" }}>
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    style={{
                      backgroundColor: "#ff4444",
                      color: "white",
                      border: "none",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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