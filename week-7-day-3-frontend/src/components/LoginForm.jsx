import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.status === 401 ? 'Invalid email or password' : err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Logging in sets the user, which sends them to the dashboard from here.
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="card">
      <h1>Log in</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>

        {error && <p className="error">{error}</p>}
      </form>
      <p className="switch">
        Don&apos;t have an account? <Link to="/register">Create one</Link>
      </p>
    </section>
  );
}
