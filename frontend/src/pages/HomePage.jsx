import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="frontpage">
      <section className="hero">
        <h1 className="hero-title">
          Smart Complaint <span className="hero-accent">Tracking System</span>
        </h1>
        <p className="hero-subtitle">
          Report, track, and resolve complaints in one place. Built for continuous improvement.
        </p>
        {!user && (
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary btn-lg">
              Login
            </Link>
            <p className="hero-hint">
              Access your account to manage complaints and system activities.
              </p>
          </div>
        )}
      </section>
      <section className="features">
        <div className="feature-card">
          <span className="feature-icon">📋</span>
          <h3>Complaint management</h3>
          <p>Submit and track complaints with status updates.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">👤</span>
          <h3>Roles & access</h3>
          <p>Admin, employee, and staff roles with secure login.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">🔧</span>
          <h3>Modular design</h3>
          <p>Prototype-first; new features integrated step by step.</p>
        </div>
      </section>
    </div>
  );
}
