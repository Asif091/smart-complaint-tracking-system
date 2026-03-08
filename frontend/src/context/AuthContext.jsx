import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "complaint_token";
const USER_KEY = "complaint_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Optionally validate token with /api/auth/me
        fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((data) => setUser(data.user))
          .catch(() => {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
          });
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
