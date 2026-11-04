import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

/**
 * SaveButton — heart/bookmark toggle for saving apartments.
 *
 * If the user is not authenticated, clicking redirects to /login
 * with the current location stored as the return destination.
 *
 * Props:
 *   apartmentId  — the apartment's numeric ID
 *   isSaved      — boolean, current saved state
 *   onToggle     — function(apartmentId) called when clicked (authenticated)
 *   variant      — 'card' (overlaid on image) | 'panel' (inline in enquiry panel)
 */
export default function SaveButton({ apartmentId, isSaved, onToggle, variant = 'card' }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    onToggle(apartmentId);
  };

  return (
    <button
      className={cn('save-btn', `save-btn--${variant}`, isSaved && 'save-btn--saved')}
      onClick={handleClick}
      aria-label={isSaved ? 'Remove from saved apartments' : 'Save apartment'}
      title={isSaved ? 'Remove from saved' : 'Save apartment'}
      type="button"
    >
      {/* Heart icon */}
      <svg
        viewBox="0 0 24 24"
        fill={isSaved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="20"
        height="20"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {variant === 'panel' && (
        <span>{isSaved ? 'Saved' : 'Save apartment'}</span>
      )}
    </button>
  );
}
