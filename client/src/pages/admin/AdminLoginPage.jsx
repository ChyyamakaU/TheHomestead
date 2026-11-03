import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { getApiErrorMessage } from '../../utils/format';

/**
 * AdminLoginPage — secure admin login.
 *
 * Per brand brief section 13.3:
 * - Separate from public website, accessible at /admin/login
 * - No public admin registration
 * - Backend enforces authentication and authorisation
 */
export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
            <input
              id="admin-password"
              type="password"
              className="enquiry-form__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
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
