import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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

  // State for chart metric
  const [chartMetric, setChartMetric] = useState("total");

  const metricLabels = {
    total: "Total Complaints",
    pending: "Pending",
    assigned: "Assigned",
    inProgress: "In Progress",
    resolved: "Resolved"
  };

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

  const { summary, priorityReport, departmentReport } = data;
  const totalComplaints = summary.totalComplaints;

  // Priority colors
  const priorityColors = {
    low: "#4caf50",
    medium: "#2196f3",
    high: "#ff9800",
    critical: "#f44336"
  };

  // Prepare chart data
  const chartData = departmentReport ? departmentReport.map(dept => ({
    department: dept.department,
    total: dept.total,
    pending: dept.pending,
    assigned: dept.assigned,
    inProgress: dept.inProgress,
    resolved: dept.resolved
  })) : [];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Admin Dashboard
      </h1>

      {/* ============================================ */}
      {/* DEPARTMENT-WISE REPORT WITH CHART */}
      {/* ============================================ */}
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

        {/* Table */}
        <div style={{ overflowX: "auto", marginBottom: "30px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Department</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Total</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Pending</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Assigned</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>In Progress</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Resolved</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Avg Resolution (Hours)</th>
              </tr>
            </thead>
            <tbody>
              {departmentReport && departmentReport.map(dept => (
                <tr key={dept.department}>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{dept.department}</td>
                  <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{dept.total}</td>
                  <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{dept.pending}</td>
                  <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{dept.assigned}</td>
                  <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{dept.inProgress}</td>
                  <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{dept.resolved}</td>
                  <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>
                    {dept.averageResolutionTime ? `${dept.averageResolutionTime} ` : "N/A"} 
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chart Section */}
        <h4>Visual Chart</h4>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "15px" }}>
          {Object.keys(metricLabels).map(metric => (
            <button
              key={metric}
              onClick={() => setChartMetric(metric)}
              style={{
                padding: "6px 12px",
                backgroundColor: chartMetric === metric ? "#4CAF50" : "#f0f0f0",
                color: chartMetric === metric ? "white" : "black",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              {metricLabels[metric]}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={chartMetric} fill="#8884d8" name={metricLabels[chartMetric]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ============================================ */}
      {/* PRIORITY-WISE STATISTICS */}
      {/* ============================================ */}
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

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Priority</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Count</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {priorityReport && priorityReport.map(p => {
                const percentage = totalComplaints > 0 ? ((p.total / totalComplaints) * 100).toFixed(1) : 0;
                return (
                  <tr key={p.priority}>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      <span style={{
                        backgroundColor: priorityColors[p.priority],
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px"
                      }}>
                        {p.priority}
                      </span>
                    </td>
                    <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{p.total}</td>
                    <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{percentage}%</td>
                  </tr>
                );
              })}
              <tr style={{ backgroundColor: "#000000", fontWeight: "bold" }}>
                <td style={{ padding: "8px", border: "1px solid #ddd" }}>Total</td>
                <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{totalComplaints}</td>
                <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================ */}
      {/* AVERAGE RESOLUTION TIME ANALYTICS */}
      {/* ============================================ */}
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
        <p style={{ margin: "0 0 1rem 0", color: "var(--text-muted)" }}>
          This analytics section shows average resolution times for complaints overall, by department, and by priority.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <StatCard label="Overall Avg Resolution" value={`${summary.averageResolutionTime} hours`} color="#00bcd4" />
          <StatCard label="Resolved Complaints" value={summary.resolvedComplaints} color="#4caf50" />
          <StatCard label="Resolution Rate" value={`${summary.resolutionRate}%`} color="#795548" />
        </div>

        {/* Average Resolution by Department */}
        <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Average Resolution by Department</h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Department</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Avg Resolution Time (Hours)</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Resolved</th>
              </tr>
            </thead>
            <tbody>
              {departmentReport && departmentReport.map(dept => (
                <tr key={dept.department}>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{dept.department}</td>
                  <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>
                    {dept.averageResolutionTime ? `${dept.averageResolutionTime} ` : "N/A"}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{dept.resolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Average Resolution by Priority */}
        <div style={{ overflowX: "auto" }}>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Average Resolution by Priority</h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Priority</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Avg Resolution Time (Hours) </th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Resolved</th>
              </tr>
            </thead>
            <tbody>
              {priorityReport && priorityReport.map(p => (
                <tr key={p.priority}>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{p.priority}</td>
                  <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>
                    {p.averageResolutionTime ? `${p.averageResolutionTime} ` : "N/A"}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{p.resolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}