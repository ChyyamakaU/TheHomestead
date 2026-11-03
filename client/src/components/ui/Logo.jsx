import { cn } from '../../utils/cn';

/**
 * Logo — The Homestead brand mark.
 *
 * A simple house-inspired symbol (geometric, not cartoonish) beside the
 * "Homestead" wordmark in Gloock. Works on both light and dark backgrounds
 * via the `variant` prop.
 *
 * @param {('dark'|'light')} variant — 'dark' = for light backgrounds (Midnight ink), 'light' = for Midnight backgrounds
 * @param {('horizontal'|'symbol')} format — 'horizontal' shows symbol + wordmark, 'symbol' shows just the mark
 */
export default function Logo({ variant = 'dark', format = 'horizontal', className }) {
  const isInkLight = variant === 'light';
  const ink = isInkLight ? 'var(--mist)' : 'var(--midnight)';
  const accent = 'var(--brass)';

  return (
    <span className={cn('logo', `logo--${variant}`, `logo--${format}`, className)}>
      <svg
        className="logo__symbol"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Roof */}
        <path
          d="M18 4L4 15.5V31a1 1 0 001 1h8V23h10v9h8a1 1 0 001-1V15.5L18 4Z"
          fill={ink}
        />
        {/* Door accent */}
        <rect x="15" y="23" width="6" height="9" fill={accent} />
      </svg>
      {format === 'horizontal' && (
        <span className="logo__wordmark">Homestead</span>
      )}
    </span>
  );
}
