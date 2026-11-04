import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { getApiErrorMessage } from '../../utils/format';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
          <Link to="/" className="admin-login__logo">
            <Logo variant="dark" />
          </Link>
          <h1 className="admin-login__title">Admin login</h1>
          <p className="admin-login__sub">
            Sign in to manage apartments and enquiries.
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <form className="admin-login__form" onSubmit={handleSubmit}>
          <div className="enquiry-form__field">
            <label htmlFor="admin-email" className="enquiry-form__label">Email</label>
            <input
              id="admin-email"
              type="email"
              className="enquiry-form__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="enquiry-form__field">
            <label htmlFor="admin-password" className="enquiry-form__label">Password</label>
            <div className="password-field">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="enquiry-form__input password-field__input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-field__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  /* Eye-off icon */
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  /* Eye icon */
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" loading={loading} className="enquiry-form__submit">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <Link to="/" className="admin-login__back">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
