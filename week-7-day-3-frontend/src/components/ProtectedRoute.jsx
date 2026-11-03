import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This only reads the expiry for the UI. The server still verifies the signature on every request.
function isTokenExpired(token) {
  try {
    // JWTs are base64url encoded, which atob can't read until it is converted to plain base64.
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export default function ProtectedRoute({ children }) {
  const { user, loading, logout } = useAuth();
  const token = localStorage.getItem('token');
  const allowed = Boolean(user && token && !isTokenExpired(token));

  useEffect(() => {
    if (!loading && !allowed) {
      logout();
    }
  }, [loading, allowed, logout]);

  if (loading) {
    return <p className="status">Loading...</p>;
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
