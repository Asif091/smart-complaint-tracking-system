import { useState } from 'react';

const categories = ["Hardware Issue", "Software Issue", "Network Problem", "Salary Dispute", "Leave Request", "Workplace Harassment", "Policy Suggestion", "Other"];
const statuses = ["pending", "assigned", "in-progress", "resolved"];
const priorities = ["Low", "Medium", "High", "Critical"];
const departments = ["HR", "IT", "Finance", "Marketing & Sales", "Software & Product Development"];

export default function ComplaintSearch({ onSearch, loading }) {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [department, setDepartment] = useState('all');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ keyword, category, status, priority, department });
  };

  const handleReset = () => {
    setKeyword('');
    setCategory('all');
    setStatus('all');
    setPriority('all');
    setDepartment('all');
    onSearch({ keyword: '', category: 'all', status: 'all', priority: 'all', department: 'all' });
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      backgroundColor: '#f5f5f5', 
      padding: '15px', 
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <input
        type="text"
        placeholder="Search by title or description..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
          <option value="all">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
          <option value="all">All Priority</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={department} onChange={(e) => setDepartment(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
          <option value="all">All Departments</option>
          {departments.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <button type="submit" disabled={loading} style={{
          padding: '8px 16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
        <button type="button" onClick={handleReset} style={{
          padding: '8px 16px',
          backgroundColor: '#666',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Reset
        </button>
      </div>
    </form>
  );
}