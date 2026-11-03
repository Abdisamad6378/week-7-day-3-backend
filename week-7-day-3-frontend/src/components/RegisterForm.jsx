import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { name: '', email: '', password: '', confirmPassword: '' };

function validate({ name, email, password, confirmPassword }) {
  const errors = {};

  if (name.trim().length < 2) {
    errors.name = 'Name is required and must be at least 2 characters';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = 'Password needs at least 8 characters, one uppercase letter and one number';
  }
  if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

const FIELDS = [
  { name: 'name', label: 'Full Name', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  {
    name: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    autoComplete: 'new-password',
  },
];

export default function RegisterForm() {
  const { user, loading, register } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitted(true);
    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
    } catch (error) {
      setSubmitted(false);
      setApiError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && user && !submitted) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user) {
    return (
      <section className="card">
        <h1>Account created</h1>
        <p className="success">Welcome, {user.name}! You are now signed in.</p>
        <Link to="/dashboard">Go to your dashboard</Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit} noValidate>
        {FIELDS.map(({ name, label, type, autoComplete }) => (
          <div className="field" key={name}>
            <label htmlFor={name}>{label}</label>
            <input
              id={name}
              name={name}
              type={type}
              autoComplete={autoComplete}
              value={form[name]}
              onChange={handleChange}
            />
            {errors[name] && <p className="error">{errors[name]}</p>}
          </div>
        ))}

        {apiError && <p className="error">{apiError}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
