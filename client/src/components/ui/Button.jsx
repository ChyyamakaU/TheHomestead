import { cn } from '../../utils/cn';

/**
 * Button — the single reusable button component for the entire app.
 *
 * Variants per brand brief:
 *   primary   — Midnight background, Cool Mist text, hover #1F2F52
 *   brass     — Brass background, Midnight text (main CTA, used sparingly)
 *   secondary — Transparent, Stone Gray border, Midnight text, hover greige
 *   danger    — Error red background, white text (destructive admin actions)
 *   ghost     — No background or border, Midnight text
 *
 * Sizes:
 *   sm, md (default), lg
 *
 * All buttons get 3px Brass focus outline with 2px offset (via global :focus-visible).
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  disabled,
  loading = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn('btn', `btn--${variant}`, `btn--${size}`, className)}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
