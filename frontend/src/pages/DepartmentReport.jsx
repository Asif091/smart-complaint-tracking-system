import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function DepartmentReport() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chartMetric, setChartMetric] = useState('total');
  const { getToken } = useAuth();

  const metricLabels = {
    total: 'Total Complaints',
    resolved: 'Resolved',
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
    critical: 'Critical Priority'
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = getToken();
      let url = '/api/reports/department-stats';
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const applyDateFilter = () => {
    fetchStats();
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchStats();
  };

  // Prepare data for bar chart
  const chartData = stats.map(dept => ({
    department: dept.department,
    value: dept[chartMetric]
  }));

  const getMetricDisplay = (dept) => {
    if (chartMetric === 'total') return dept.total;
    if (chartMetric === 'resolved') return dept.resolved;
    if (chartMetric === 'low') return dept.low;
    if (chartMetric === 'medium') return dept.medium;
    if (chartMetric === 'high') return dept.high;
    if (chartMetric === 'critical') return dept.critical;
    return 0;
  };

  if (loading) return <div>Loading report...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Department-wise Report</h1>

      {/* Date filter */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <div>
          <div>Start Date</div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '6px' }}
          />
        </div>
        <div>
          <div>End Date</div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '6px' }}
          />
        </div>
        <button onClick={applyDateFilter} style={{ padding: '6px 12px' }}>Apply</button>
        <button onClick={clearDateFilter} style={{ padding: '6px 12px' }}>Clear</button>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Department</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Total</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Pending</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Assigned</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>In Progress</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Resolved</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Low</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Medium</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>High</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Critical</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Avg Days</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Avg Hours</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(dept => (
            <tr key={dept.department}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{dept.department}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{dept.total}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{dept.pending}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{dept.assigned}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{dept.inProgress}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{dept.resolved}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{dept.low}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{dept.medium}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{dept.high}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{dept.critical}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                {dept.avgResolutionDays ? dept.avgResolutionDays : 'N/A'}
              </td>
              <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                {dept.avgResolutionHours ? dept.avgResolutionHours : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Chart section */}
      <h3>Visual Chart</h3>
      <div style={{ marginBottom: '10px' }}>
        {Object.keys(metricLabels).map(metric => (
          <button
            key={metric}
            onClick={() => setChartMetric(metric)}
            style={{
              marginRight: '10px',
              padding: '6px 12px',
              backgroundColor: chartMetric === metric ? '#4CAF50' : '#f0f0f0',
              color: chartMetric === metric ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
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
    </div>
  );
}