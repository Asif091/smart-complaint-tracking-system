import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";  // ADD THIS LINE

export default function Layout({ children }) {
  const { user, loading, logout } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">
          Smart Complaint
        </Link>
        <nav className="nav">
          {!loading && (
            <>
              {user ? (
                <>
                  {/* 🔹 ROLE BASED MENU (unchanged) */}
                  {user.role === "admin" && (
                    <>
                      <Link to="/">Home</Link>
                      <Link to="/users">User Management</Link>
                      <Link to="/complaints">Complaint Management</Link>
                      <Link to="/reports">Reports & Analytics</Link>
                    </>
                  )}

                  {user.role === "employee" && (
                    <>
                      <Link to="/">Home</Link>
                      <Link to="/submit-complaint">Register Complaint</Link>
                      <Link to="/my-complaints">Track Complaint</Link>
                      <Link to="/profile">Profile</Link>
                    </>
                  )}

                  {user.role === "staff" && (
                    <>
                      <Link to="/">Home</Link>
                      <Link to="/complaints">Complaints</Link>
                      <Link to="/profile">Profile</Link>
                    </>
                  )}

                  {/* 🔹 USER INFO + NOTIFICATION BELL */}
                  <span className="nav-name">{user.name} ({user.role})</span>
                  <NotificationBell />  {/* ADD THIS LINE */}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      logout();
                      window.location.href = "/";
                    }}
                  >
                    Logout
                  </button>
                  
                </>
              ) : (
                <Link to="/login" className="btn btn-primary">
                  Login
                </Link>
              )}
            </>
          )}
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}