import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
                <span className="nav-user">
                  <span className="nav-name">{user.name}</span>
                  <button type="button" className="btn btn-ghost" onClick={logout}>
                    Logout
                  </button>
                </span>
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
