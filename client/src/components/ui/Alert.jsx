import { cn } from '../../utils/cn';

/**
 * Alert — inline feedback message for forms and pages.
 *
 * Variants: success, error, warning, info
 * Colours per brand brief:
 *   success — #2E7D52
 *   error   — #B23B3B
 *   warning — #C98A1B
 *   info    — Midnight
 */
export default function Alert({ variant = 'info', children, className }) {
  return <div className={cn('alert', `alert--${variant}`, className)}>{children}</div>;
}
