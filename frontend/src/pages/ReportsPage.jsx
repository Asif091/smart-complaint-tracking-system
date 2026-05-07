import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "1.25rem",
      textAlign: "center",
      flex: "1",
      minWidth: "130px"
    }}>
      <div style={{ fontSize: "2rem", fontWeight: 700, color: color || "var(--accent)" }}>
        {value}
      </div>
      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
        {label}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { getToken, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/");
      return;
    }
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = getToken();
      const res = await fetch("/api/complaints/stats/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;
  if (error) return <div style={{ color: "var(--danger)", padding: "2rem" }}>{error}</div>;
  if (!data) return null;

  const { summary } = data;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Admin Dashboard
      </h1>

      {/* ══════════════════════════════════════
          FEATURE 2: ADMIN DASHBOARD SUMMARY ✅
          ══════════════════════════════════════ */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <StatCard label="Total Complaints" value={summary.totalComplaints} color="#2196f3" />
        <StatCard label="Pending" value={summary.pendingComplaints} color="#ff9800" />
        <StatCard label="Assigned" value={summary.assignedComplaints} color="#9c27b0" />
        <StatCard label="In Progress" value={summary.inProgressComplaints} color="#ff5722" />
        <StatCard label="Resolved" value={summary.resolvedComplaints} color="#4caf50" />
        <StatCard label="Avg Time" value={`${summary.averageResolutionTime}d`} color="#00bcd4" />
      </div>

      {/* ══════════════════════════════════════
          FEATURE 3: DEPARTMENT-WISE REPORT
          (Template - Edit here)
          ══════════════════════════════════════ */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "1.5rem",
        marginBottom: "2rem"
      }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>
          Department-wise Report
        </h3>
        <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          [Template] Add department-wise report table here.
        </p>
      </div>

      {/* ══════════════════════════════════════
          FEATURE 4: PRIORITY-WISE STATISTICS
          (Template - Edit here)
          ══════════════════════════════════════ */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "1.5rem",
        marginBottom: "2rem"
      }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>
          Priority-wise Statistics
        </h3>
        <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          [Template] Add priority-wise statistics cards here.
        </p>
      </div>

      {/* ══════════════════════════════════════
          FEATURE 5: AVG RESOLUTION TIME
          (Template - Edit here)
          ══════════════════════════════════════ */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "1.5rem",
        marginBottom: "2rem"
      }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>
          Average Resolution Time Analytics
        </h3>
        <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          [Template] Add average resolution time analytics here.
        </p>
      </div>
    </div>
  );
}