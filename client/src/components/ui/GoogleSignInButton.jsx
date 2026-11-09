import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * GoogleSignInButton — reusable button that triggers Supabase Google OAuth.
 *
 * Renders a branded Google button matching the site design system.
 * On click: calls loginWithGoogle() from AuthContext, which redirects
 * to Google via Supabase. The return flow is handled by AuthCallbackPage.
 *
 * @param {string} label   — button text (default: "Continue with Google")
 * @param {string} className — extra CSS classes
 */
export default function GoogleSignInButton({ label = 'Continue with Google', className = '' }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleClick = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      // loginWithGoogle redirects the page — execution stops here on success
    } catch (err) {
      setError('Google sign-in is currently unavailable. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={`google-btn-wrap ${className}`}>
      <button
        type="button"
        className="btn btn--google"
        onClick={handleClick}
        disabled={loading}
        aria-label="Sign in with Google"
      >
        {/* Google "G" SVG logo */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            fill="#4285F4"
          />
          <path
            d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            fill="#34A853"
          />
          <path
            d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
            fill="#EA4335"
          />
        </svg>
        <span>{loading ? 'Redirecting…' : label}</span>
      </button>
      {error && (
        <p className="google-btn-wrap__error" role="alert">{error}</p>
      )}
    </div>
  );
}
