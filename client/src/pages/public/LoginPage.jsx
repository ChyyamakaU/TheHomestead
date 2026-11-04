import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { getApiErrorMessage } from '../../utils/format';

/**
 * LoginPage — public tenant/user login.
 *
 * Separate from /admin/login.
 * After successful login, redirects to the originally intended page
 * (stored in location.state.from) or /dashboard.
 */
export default function LoginPage() {
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
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(email, password);
      // Admins who happen to hit /login go to the admin dashboard
      const defaultDest = (data.user.role === 'admin' || data.user.role === 'superadmin')
        ? '/admin/dashboard'
        : '/dashboard';
      const from = location.state?.from?.pathname || defaultDest;
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo"><Logo variant="dark" /></Link>
          <h1 className="auth-card__title">Welcome back</h1>
          <p className="auth-card__sub">
            Don't have an account?{' '}
            <Link to="/register" state={location.state} className="auth-card__link">Register</Link>
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="enquiry-form__field">
            <label htmlFor="login-email" className="enquiry-form__label">Email address</label>
            <input id="login-email" type="email" className="enquiry-form__input"
              value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" required />
          </div>

          <div className="enquiry-form__field">
            <label htmlFor="login-password" className="enquiry-form__label">Password</label>
            <div className="password-field">
              <input id="login-password" type={showPassword ? 'text' : 'password'}
                className="enquiry-form__input password-field__input"
                value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password" required />
              <button type="button" className="password-field__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="auth-form__forgot">
            <Link to="/forgot-password" className="auth-card__link auth-card__link--small">
              Forgot your password?
            </Link>
          </div>

          <Button type="submit" variant="primary" loading={loading} className="auth-form__submit">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="auth-card__footer-note">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="auth-card__link">Terms</Link> and{' '}
          <Link to="/privacy" className="auth-card__link">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
