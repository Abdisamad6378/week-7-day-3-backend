import { useEffect, useState } from 'react';
import { fetchCurrentUser, useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    fetchCurrentUser(localStorage.getItem('token'))
      .then((data) => {
        if (!ignore) setProfile(data.user);
      })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 401) {
          logout();
        } else {
          setError(err.message);
        }
      });

    return () => {
      ignore = true;
    };
  }, [logout]);

  return (
    <section className="card">
      <h1>Dashboard</h1>
      {error && <p className="error">{error}</p>}
      <dl>
        <dt>Name</dt>
        <dd>{profile.name}</dd>
        <dt>Email</dt>
        <dd>{profile.email}</dd>
        <dt>Member since</dt>
        <dd>{new Date(profile.createdAt).toLocaleDateString()}</dd>
      </dl>
      <button type="button" onClick={logout}>
        Log Out
      </button>
    </section>
  );
}
