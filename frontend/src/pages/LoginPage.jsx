import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Login failed.");
        setLoading(false);
        return;
      }
      login(data.token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError("Network error. Is the backend running on port 5000?");
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Sign in</h1>
        <p className="login-subtitle">Smart Complaint Tracking System</p>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="form-error">{error}</div>}
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="login-footer">
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
