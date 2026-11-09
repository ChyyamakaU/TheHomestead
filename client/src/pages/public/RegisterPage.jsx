import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import GoogleSignInButton from '../../components/ui/GoogleSignInButton';
import { getApiErrorMessage } from '../../utils/format';

/**
 * RegisterPage — tenant registration.
 *
 * Fields: first name, last name, email, phone, password, confirm password,
 *         terms agreement.
 * On success: user is immediately logged in and redirected.
 */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', confirm_password: '', agree_terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState([]);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Client-side validation mirrors backend rules
  const validate = () => {
    const errs = [];
    if (!form.first_name.trim()) errs.push('First name is required.');
    if (!form.last_name.trim()) errs.push('Last name is required.');
    const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      errs.push('A valid email address is required.');
    }
    const digits = form.phone.replace(/\D/g, '');
    if (!form.phone.trim() || digits.length < 7 || digits.length > 15) {
      errs.push('A valid phone number is required (7–15 digits).');
    }
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) ||
        !/[a-z]/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
      errs.push('Password must be at least 8 characters with an uppercase letter, lowercase letter and special character.');
    }
    if (form.password !== form.confirm_password) errs.push('Passwords do not match.');
    if (!form.agree_terms) errs.push('You must agree to the Terms and Conditions and Privacy Policy.');
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setApiError('');

    const errs = validate();
    if (errs.length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register(form);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setApiError(getApiErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ visible }) => visible ? (
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
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo"><Logo variant="dark" /></Link>
          <h1 className="auth-card__title">Create your account</h1>
          <p className="auth-card__sub">
            Already have an account?{' '}
            <Link to="/login" state={location.state} className="auth-card__link">Sign in</Link>
          </p>
        </div>

        {apiError && <Alert variant="error">{apiError}</Alert>}
        {errors.length > 0 && (
          <Alert variant="error">
            <ul className="auth-card__errors">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </Alert>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__row">
            <div className="enquiry-form__field">
              <label htmlFor="reg-first" className="enquiry-form__label">First name *</label>
              <input id="reg-first" type="text" className="enquiry-form__input"
                value={form.first_name} onChange={(e) => set('first_name', e.target.value)}
                autoComplete="given-name" />
            </div>
            <div className="enquiry-form__field">
              <label htmlFor="reg-last" className="enquiry-form__label">Last name *</label>
              <input id="reg-last" type="text" className="enquiry-form__input"
                value={form.last_name} onChange={(e) => set('last_name', e.target.value)}
                autoComplete="family-name" />
            </div>
          </div>

          <div className="enquiry-form__field">
            <label htmlFor="reg-email" className="enquiry-form__label">Email address *</label>
            <input id="reg-email" type="email" className="enquiry-form__input"
              value={form.email} onChange={(e) => set('email', e.target.value)}
              autoComplete="email" />
          </div>

          <div className="enquiry-form__field">
            <label htmlFor="reg-phone" className="enquiry-form__label">Phone number *</label>
            <input id="reg-phone" type="tel" className="enquiry-form__input"
              value={form.phone} onChange={(e) => set('phone', e.target.value)}
              autoComplete="tel" placeholder="e.g. +234 801 234 5678" />
          </div>

          <div className="enquiry-form__field">
            <label htmlFor="reg-password" className="enquiry-form__label">Password *</label>
            <div className="password-field">
              <input id="reg-password" type={showPassword ? 'text' : 'password'}
                className="enquiry-form__input password-field__input"
                value={form.password} onChange={(e) => set('password', e.target.value)}
                autoComplete="new-password" />
              <button type="button" className="password-field__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <EyeIcon visible={showPassword} />
              </button>
            </div>
            <p className="auth-form__hint">
              Min 8 characters, including uppercase, lowercase and a special character.
            </p>
          </div>

          <div className="enquiry-form__field">
            <label htmlFor="reg-confirm" className="enquiry-form__label">Confirm password *</label>
            <div className="password-field">
              <input id="reg-confirm" type={showConfirm ? 'text' : 'password'}
                className="enquiry-form__input password-field__input"
                value={form.confirm_password} onChange={(e) => set('confirm_password', e.target.value)}
                autoComplete="new-password" />
              <button type="button" className="password-field__toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                <EyeIcon visible={showConfirm} />
              </button>
            </div>
          </div>

          <label className="auth-form__checkbox">
            <input type="checkbox" checked={form.agree_terms}
              onChange={(e) => set('agree_terms', e.target.checked)} />
            <span>
              I agree to the{' '}
              <Link to="/terms" target="_blank" className="auth-card__link">Terms and Conditions</Link>
              {' '}and{' '}
              <Link to="/privacy" target="_blank" className="auth-card__link">Privacy Policy</Link>
            </span>
          </label>

          <Button type="submit" variant="primary" loading={loading} className="auth-form__submit">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <div className="auth-divider">or</div>
        <GoogleSignInButton label="Sign up with Google" />
      </div>
    </div>
  );
}
