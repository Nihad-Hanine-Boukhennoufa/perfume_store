import { createContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

function decodeToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (!saved || saved === "undefined") return null;
    try { return JSON.parse(saved); } catch { return null; }
  });

  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem("token");
    return saved && saved !== "undefined" ? saved : null;
  });

  const login = (data) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  // ── Update user data after profile edit ───────────────────────────────────
  // Called by Profile page after a successful updateUser API call.
  // Merges the returned fields into the existing user object so the
  // Navbar avatar / name reflects the change without a full re-login.
  const updateUserData = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
  }, []);

  const isAdmin = user?.role === "admin";

  // Auto-logout when token expires
  useEffect(() => {
    if (!token) return;
    const decoded = decodeToken(token);
    if (!decoded?.exp) return;
    const expiresIn = decoded.exp * 1000 - Date.now();
    const timer = setTimeout(logout, expiresIn > 0 ? expiresIn : 0);
    return () => clearTimeout(timer);
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;