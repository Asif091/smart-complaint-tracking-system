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

  // Department report state
  const [deptStats, setDeptStats] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chartMetric, setChartMetric] = useState("total");
  const [avgUnit, setAvgUnit] = useState("days");

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
    fetchDepartmentStats();
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

  const fetchDepartmentStats = async (applyDate = false) => {
    setDeptLoading(true);
    try {
      const token = getToken();
      let url = "/api/reports/department-stats";
      if (applyDate && startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setDeptStats(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDeptLoading(false);
    }
  };

  const applyDateFilter = () => {
    fetchDepartmentStats(true);
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    fetchDepartmentStats(false);
  };

  const chartData = deptStats.map(dept => ({
    department: dept.department,
    value: dept[chartMetric]
  }));

  if (loading) return <div className="loading-screen">Loading dashboard...</div>;
  if (error) return <div style={{ color: "var(--danger)", padding: "2rem" }}>{error}</div>;
  if (!data) return null;

  const { summary } = data;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Admin Dashboard
      </h1>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <StatCard label="Total Complaints" value={summary.totalComplaints} color="#2196f3" />
        <StatCard label="Pending" value={summary.pendingComplaints} color="#ff9800" />
        <StatCard label="Assigned" value={summary.assignedComplaints} color="#9c27b0" />
        <StatCard label="In Progress" value={summary.inProgressComplaints} color="#ff5722" />
        <StatCard label="Resolved" value={summary.resolvedComplaints} color="#4caf50" />
        <StatCard label="Avg Time" value={`${summary.averageResolutionTime}d`} color="#00bcd4" />
      </div>

      {/* DEPARTMENT-WISE REPORT */}
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

        {/* Date filter */}
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap" }}>
          <div>
            <div>Start Date</div>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: "6px" }} />
          </div>
          <div>
            <div>End Date</div>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: "6px" }} />
          </div>
          <button onClick={applyDateFilter} style={{ padding: "6px 12px" }}>Apply</button>
          <button onClick={clearDateFilter} style={{ padding: "6px 12px" }}>Clear</button>
        </div>

        {deptLoading ? (
          <p>Loading department stats...</p>
        ) : (
          <>
            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f2f2f2" }}>
                    <th style={{ padding: "10px", border: "1px solid #ddd" }}>Department</th>
                    <th style={{ padding: "10px", border: "1px solid #ddd" }}>Total</th>
                    <th style={{ padding: "10px", border: "1px solid #ddd" }}>Pending</th>
                    <th style={{ padding: "10px", border: "1px solid #ddd" }}>Assigned</th>
                    <th style={{ padding: "10px", border: "1px solid #ddd" }}>In Progress</th>
                    <th style={{ padding: "10px", border: "1px solid #ddd" }}>Resolved</th>
                    <th style={{ padding: "10px", border: "1px solid #ddd" }}>Avg Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {deptStats.map(dept => (
                    <tr key={dept.department}>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{dept.department}</td>
                      <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{dept.total}</td>
                      <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{dept.pending}</td>
                      <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{dept.assigned}</td>
                      <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{dept.inProgress}</td>
                      <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>{dept.resolved}</td>
                      <td style={{ textAlign: "center", padding: "8px", border: "1px solid #ddd" }}>
                        {avgUnit === "days"
                          ? (dept.avgResolutionDays ?? "N/A")
                          : (dept.avgResolutionHours ?? "N/A")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Unit toggle buttons (instead of inside th) */}
            <div style={{ marginBottom: "15px" }}>
              <span>Show avg resolution in: </span>
              <button
                onClick={() => setAvgUnit("days")}
                style={{
                  padding: "4px 8px",
                  marginRight: "5px",
                  backgroundColor: avgUnit === "days" ? "#4CAF50" : "#f0f0f0",
                  color: avgUnit === "days" ? "white" : "black",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Days
              </button>
              <button
                onClick={() => setAvgUnit("hours")}
                style={{
                  padding: "4px 8px",
                  backgroundColor: avgUnit === "hours" ? "#4CAF50" : "#f0f0f0",
                  color: avgUnit === "hours" ? "white" : "black",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Hours
              </button>
            </div>

            {/* Chart */}
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
                <Bar dataKey="value" fill="#8884d8" name={metricLabels[chartMetric]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* PRIORITY-WISE STATISTICS placeholder */}
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
          [Template] Add priority-wise statistics here.
        </p>
      </div>

      {/* AVERAGE RESOLUTION TIME ANALYTICS placeholder */}
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