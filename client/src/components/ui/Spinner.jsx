/**
 * Spinner — small inline loading indicator.
 * Uses the Midnight brand colour for consistency.
 */
export default function Spinner({ size = 24, className }) {
  return (
    <span
      className={className ? `spinner ${className}` : 'spinner'}
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
    >
      <span className="spinner__inner" />
    </span>
  );
}
