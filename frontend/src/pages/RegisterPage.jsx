import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed.");
        setLoading(false);
        return;
      }
      // If admin is creating a user, don't auto-login
      if (user?.role === "admin") {
        setSuccess("User created successfully!");
        setName("");
        setEmail("");
        setPassword("");
        setRole("staff");
      } else {
        // Login after register for new users
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          localStorage.setItem("token", loginData.token);
          localStorage.setItem("user", JSON.stringify(loginData.user));
          navigate("/", { replace: true });
          window.location.reload();
        } else {
          navigate("/login");
        }
      }
    } catch (err) {
      setError("Network error. Is the backend running?");
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">{user?.role === "admin" ? "Create User" : "Register"}</h1>
        <p className="login-subtitle">{user?.role === "admin" ? "Create a new staff or employee account" : "Create a new account"}</p>
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          <label className="label">Name</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="staff">Staff</option>
            <option value="employee">Employee</option>
          </select>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Creating account…" : user?.role === "admin" ? "Create User" : "Register"}
          </button>
        </form>
        {user?.role !== "admin" && (
          <p className="login-footer">
            <Link to="/login">Already have an account? Login</Link>
          </p>
        )}
        {user?.role === "admin" && (
          <p className="login-footer">
            <Link to="/">← Back to home</Link>
          </p>
        )}
      </div>
    </div>
  );
}
