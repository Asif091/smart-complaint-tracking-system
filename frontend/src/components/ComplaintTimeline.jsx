import { useState } from "react";

// Helper function to get icon based on action type
const getActionIcon = (action) => {
  const icons = {
    created: "📝",
    assigned: "👤",
    status_changed: "🔄",
    commented: "💬",
    resolved: "✅"
  };
  return icons[action] || "📌";
};

// Helper function to get action description text
const getActionText = (log) => {
  const { action, oldStatus, newStatus, performedByName, performedByRole } = log;
  
  switch (action) {
    case "created":
      return `${performedByName} created this complaint`;
    
    case "assigned":
      return `${performedByName} assigned this complaint to a staff member`;
    
    case "status_changed":
      return `${performedByName} changed status from "${oldStatus}" to "${newStatus}"`;
    
    case "commented":
      return `${performedByName} added a comment`;
    
    case "resolved":
      return `${performedByName} marked this complaint as resolved`;
    
    default:
      return `${performedByName} performed an action`;
  }
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// Helper function to get status badge color
const getStatusColor = (status) => {
  const colors = {
    pending: "#ff9800",
    assigned: "#2196f3",
    "in-progress": "#9c27b0",
    resolved: "#4caf50"
  };
  return colors[status] || "#757575";
};

export default function ComplaintTimeline({ logs, compact = false }) {
  const [expanded, setExpanded] = useState(!compact);
  const [showAllComments, setShowAllComments] = useState(false);

  if (!logs || logs.length === 0) {
    return (
      <div className="timeline-empty">
        <p>No activity yet</p>
      </div>
    );
  }

  // Filter comments if compact mode
  const displayLogs = compact && !expanded 
    ? logs.slice(0, 3) 
    : logs;

  const hiddenCount = logs.length - displayLogs.length;

  return (
    <div className="timeline-container">
      {!compact && (
        <div className="timeline-header">
          <h4>📋 Activity Timeline</h4>
          <span className="timeline-badge">{logs.length} actions</span>
        </div>
      )}

      <div className="timeline">
        {displayLogs.map((log, index) => (
          <div 
            key={log._id || index} 
            className={`timeline-item ${log.action}`}
          >
            <div className="timeline-icon-wrapper">
              <span className="timeline-icon">{getActionIcon(log.action)}</span>
              {index < displayLogs.length - 1 && <div className="timeline-line"></div>}
            </div>

            <div className="timeline-content">
              <div className="timeline-header-row">
                <span className="timeline-action-text">
                  <strong>{log.performedByName}</strong>
                  <span className="timeline-role-badge">{log.performedByRole}</span>
                </span>
                <span className="timeline-time">{formatDate(log.createdAt)}</span>
              </div>

              <p className="timeline-description">
                {getActionText(log)}
              </p>

              {log.oldStatus && log.newStatus && (
                <div className="timeline-status-change">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(log.oldStatus) }}
                  >
                    {log.oldStatus}
                  </span>
                  <span className="status-arrow">→</span>
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(log.newStatus) }}
                  >
                    {log.newStatus}
                  </span>
                </div>
              )}

              {log.comment && (
                <div className="timeline-comment">
                  <span className="comment-icon">💬</span>
                  <p className="comment-text">{log.comment}</p>
                </div>
              )}

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="timeline-metadata">
                  {log.metadata.category && (
                    <span className="metadata-tag">📂 {log.metadata.category}</span>
                  )}
                  {log.metadata.priority && (
                    <span className="metadata-tag">⚡ {log.metadata.priority}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {compact && hiddenCount > 0 && !expanded && (
        <button 
          className="timeline-expand-btn"
          onClick={() => setExpanded(true)}
        >
          View {hiddenCount} more {hiddenCount === 1 ? "activity" : "activities"} ↓
        </button>
      )}

      {compact && expanded && hiddenCount === 0 && (
        <button 
          className="timeline-expand-btn"
          onClick={() => setExpanded(false)}
        >
          Show less ↑
        </button>
      )}
    </div>
  );
}