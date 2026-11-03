import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const API_URL = 'http://localhost:4000/api/auth';

const AuthContext = createContext(null);

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    const error = new Error('Could not reach the server. Is the backend running?');
    error.isNetworkError = true;
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error ?? 'Something went wrong');
    error.status = response.status;
    throw error;
  }

  return data;
}

const postJson = (path, body) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export function fetchCurrentUser(token) {
  return request('/me', { headers: { Authorization: `Bearer ${token}` } });
}

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function saveSession({ token, user }) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) return;

    fetchCurrentUser(token)
      .then((data) => {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch((error) => {
        // A server outage shouldn't log anyone out, so only clear the token if it was rejected.
        if (error.isNetworkError) {
          setUser(readStoredUser());
        } else {
          clearSession();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await postJson('/login', { email, password });
    saveSession(data);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await postJson('/register', { email, password, name });
    saveSession(data);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
