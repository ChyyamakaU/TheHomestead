import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword } from '../../api/users';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import { getApiErrorMessage } from '../../utils/format';

/**
 * DashboardProfilePage — tenant profile management.
 *
 * Three sections:
 *  1. Account information (read-only: email, role, member since)
 *  2. Edit profile (name + phone)
 *  3. Change password
 */
export default function DashboardProfilePage() {
  const { user, login, logout } = useAuth();

  // ── Edit profile state ──
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileErrors, setProfileErrors] = useState([]);

  // ── Change password state ──
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);

  const setP = (field, value) =>
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  const setPw = (field, value) =>
    setPasswordForm((prev) => ({ ...prev, [field]: value }));

  // ── Submit profile update ──
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErrors([]);
    setProfileSuccess('');
    setProfileSaving(true);
    try {
      const data = await updateProfile(profileForm);
      setProfileSuccess('Profile updated successfully.');
      // Sync the AuthContext user so the navbar shows the updated name
      // We re-fetch via getMe by calling login context method
    } catch (err) {
      if (err.response?.data?.errors) setProfileErrors(err.response.data.errors);
      else setProfileErrors([getApiErrorMessage(err)]);
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Submit password change ──
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors([]);
    setPasswordSuccess('');

    // Quick client-side check
    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      setPasswordErrors(['New passwords do not match.']);
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(passwordForm);
      setPasswordSuccess('Password changed successfully.');
      setPasswordForm({ current_password: '', new_password: '', confirm_new_password: '' });
    } catch (err) {
      if (err.response?.data?.errors) setPasswordErrors(err.response.data.errors);
      else setPasswordErrors([getApiErrorMessage(err)]);
    } finally {
      setPasswordSaving(false);
    }
  };

  const EyeToggle = ({ visible, onToggle, label }) => (
    <button type="button" className="password-field__toggle"
      onClick={onToggle} aria-label={visible ? `Hide ${label}` : `Show ${label}`}>
      {visible ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1>My profile</h1>
          <p className="admin-page__sub">Manage your account information and password.</p>
        </div>
      </div>

      <div className="profile-page">
        {/* ── Account information (read-only) ── */}
        <div className="profile-section">
          <h2 className="profile-section__title">Account information</h2>
          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span className="profile-info-item__label">Email address</span>
              <span className="profile-info-item__value">{user?.email}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-item__label">Account type</span>
              <span className="profile-info-item__value" style={{ textTransform: 'capitalize' }}>
                {user?.role}
              </span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-item__label">Member since</span>
              <span className="profile-info-item__value">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>
          <p className="profile-section__note">
            To change your email address, please contact support.
          </p>
        </div>

        {/* ── Edit profile ── */}
        <div className="profile-section">
          <h2 className="profile-section__title">Edit profile</h2>

          {profileSuccess && <Alert variant="success">{profileSuccess}</Alert>}
          {profileErrors.length > 0 && (
            <Alert variant="error">
              <ul className="auth-card__errors">
                {profileErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </Alert>
          )}

          <form className="profile-form" onSubmit={handleProfileSubmit}>
            <div className="enquiry-form__row">
              <div className="enquiry-form__field">
                <label htmlFor="prof-first" className="enquiry-form__label">First name</label>
                <input id="prof-first" type="text" className="enquiry-form__input"
                  value={profileForm.first_name}
                  onChange={(e) => setP('first_name', e.target.value)}
                  autoComplete="given-name" />
              </div>
              <div className="enquiry-form__field">
                <label htmlFor="prof-last" className="enquiry-form__label">Last name</label>
                <input id="prof-last" type="text" className="enquiry-form__input"
                  value={profileForm.last_name}
                  onChange={(e) => setP('last_name', e.target.value)}
                  autoComplete="family-name" />
              </div>
            </div>

            <div className="enquiry-form__field">
              <label htmlFor="prof-phone" className="enquiry-form__label">Phone number</label>
              <input id="prof-phone" type="tel" className="enquiry-form__input"
                value={profileForm.phone}
                onChange={(e) => setP('phone', e.target.value)}
                autoComplete="tel"
                placeholder="e.g. +234 801 234 5678" />
            </div>

            <Button type="submit" variant="primary" loading={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </div>

        {/* ── Change password ── */}
        <div className="profile-section">
          <h2 className="profile-section__title">Change password</h2>

          {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}
          {passwordErrors.length > 0 && (
            <Alert variant="error">
              <ul className="auth-card__errors">
                {passwordErrors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </Alert>
          )}

          <form className="profile-form" onSubmit={handlePasswordSubmit}>
            <div className="enquiry-form__field">
              <label htmlFor="pw-current" className="enquiry-form__label">Current password</label>
              <div className="password-field">
                <input id="pw-current" type={showCurrent ? 'text' : 'password'}
                  className="enquiry-form__input password-field__input"
                  value={passwordForm.current_password}
                  onChange={(e) => setPw('current_password', e.target.value)}
                  autoComplete="current-password" />
                <EyeToggle visible={showCurrent} onToggle={() => setShowCurrent((v) => !v)} label="current password" />
              </div>
            </div>

            <div className="enquiry-form__field">
              <label htmlFor="pw-new" className="enquiry-form__label">New password</label>
              <div className="password-field">
                <input id="pw-new" type={showNew ? 'text' : 'password'}
                  className="enquiry-form__input password-field__input"
                  value={passwordForm.new_password}
                  onChange={(e) => setPw('new_password', e.target.value)}
                  autoComplete="new-password" />
                <EyeToggle visible={showNew} onToggle={() => setShowNew((v) => !v)} label="new password" />
              </div>
              <p className="auth-form__hint">
                Min 8 characters — uppercase, lowercase and a special character.
              </p>
            </div>

            <div className="enquiry-form__field">
              <label htmlFor="pw-confirm" className="enquiry-form__label">Confirm new password</label>
              <div className="password-field">
                <input id="pw-confirm" type={showConfirm ? 'text' : 'password'}
                  className="enquiry-form__input password-field__input"
                  value={passwordForm.confirm_new_password}
                  onChange={(e) => setPw('confirm_new_password', e.target.value)}
                  autoComplete="new-password" />
                <EyeToggle visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} label="confirm password" />
              </div>
            </div>

            <Button type="submit" variant="primary" loading={passwordSaving}>
              {passwordSaving ? 'Changing password...' : 'Change password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
