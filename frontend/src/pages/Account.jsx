import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Account() {
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const updates = {};
    if (fullName !== (user?.full_name ?? '')) updates.full_name = fullName;
    if (email !== (user?.email ?? '')) updates.email = email;
    if (password.trim()) updates.password = password;
    if (Object.keys(updates).length === 0) {
      setLoading(false);
      return;
    }
    try {
      await updateProfile(updates);
      setPassword('');
      setSuccess('Profile updated successfully!');
    } catch (err) {
      const detail = err.body?.detail;
      const raw = Array.isArray(detail) ? detail.map((x) => x.msg).join(' ') : (detail || 'Update failed.');
      setError(String(raw).replace(/^Value error,?\s*/i, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) logout();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? All your data (orders, cart, reviews) will be permanently removed.')) return;
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      setError(err.body?.detail || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card account-guest-card">
          <h1 className="auth-title">Account</h1>
          <p className="auth-subtitle">Sign in or create an account to continue</p>
          <div className="account-guest-actions">
            <Link to="/login" className="account-guest-btn account-guest-btn--primary">Sign in</Link>
            <Link to="/register" className="account-guest-btn account-guest-btn--secondary">Create account</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <div className="account-page-inner">
        <h1 className="account-page-title">Account</h1>
        <div className="account-card">
        <h2 className="account-section-title">Profile</h2>
        <form onSubmit={handleUpdate} className="account-form">
          {error && <p className="auth-error">{error}</p>}
          {success && <p className="account-success">{success}</p>}
          <label className="auth-label">
            Full name
            <input
              type="text"
              className="auth-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </label>
          <label className="auth-label">
            Email
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="auth-label">
            Password
            <span className="auth-hint">Leave blank to keep current password. To change, enter a new password (8+ chars, upper, lower, number, special).</span>
            <div className="auth-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input auth-input--password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Updating…' : 'Update profile'}
          </button>
          <button
            type="button"
            className="auth-btn account-delete-btn"
            onClick={handleDeleteAccount}
            disabled={loading || deleting}
          >
            {deleting ? 'Deleting…' : 'Delete account'}
          </button>
        </form>

        <div className="account-logout-section">
          <button type="button" className="account-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
