import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';

/**
 * AuthCallbackPage — handles the redirect back from Google via Supabase OAuth.
 *
 * Flow:
 *  1. Supabase sets the session from the URL hash/query params automatically.
 *  2. We read the access_token from the session.
 *  3. POST it to Express → /api/auth/google/callback
 *  4. Express verifies with Supabase (service role), finds/creates the user,
 *     and issues the HTTP-only JWT cookie.
 *  5. AuthContext user state is updated, user is redirected to /dashboard.
 *
 * If anything fails, an error is shown with a link back to /login.
 */
export default function AuthCallbackPage() {
  const { completeGoogleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError]   = useState('');
  const ran = useRef(false); // prevent double-run in React StrictMode

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const finish = async () => {
      try {
        // Supabase parses the hash/tokens from the URL automatically
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !data?.session?.access_token) {
          setError('Google sign-in could not be completed. Please try again.');
          return;
        }

        await completeGoogleLogin(data.session.access_token);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Sign-in failed. Please try again.';
        setError(msg);
      }
    };

    finish();
  }, []);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__header">
            <h1 className="auth-card__title">Sign-in failed</h1>
          </div>
          <Alert variant="error">{error}</Alert>
          <p className="auth-card__footer-note" style={{ marginTop: 'var(--space-md)' }}>
            <a href="/login" className="auth-card__link">← Back to login</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <Spinner size={40} />
        <p style={{ marginTop: 'var(--space-sm)', color: 'var(--stone-deep)' }}>
          Completing sign-in…
        </p>
      </div>
    </div>
  );
}
