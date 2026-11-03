import { cn } from '../../utils/cn';

/**
 * Badge — small status/label chip.
 *
 * Variants:
 *   available  — Success green (#2E7D52) background
 *   occupied    — Warning amber (#C98A1B) background
 *   unavailable — Error red (#B23B3B) background
 *   new         — Midnight background, Brass Light text
 *   neutral     — Stone Light background, Stone Deep text
 *   draft       — Stone Light background, Stone Dark text
 *   pending     — Warning amber
 *   confirmed   — Success green
 *   completed   — Midnight background, mist text
 *   cancelled   — Error red
 *   approved    — Success green
 *   rejected    — Error red
 *   under_review— Warning amber
 *
 * Per brand brief, functional status colours are only used for their intended purpose.
 */
const VARIANT_CLASSES = {
  available: 'badge--success',
  occupied: 'badge--warning',
  unavailable: 'badge--error',
  rented: 'badge--error',
  new: 'badge--new',
  neutral: 'badge--neutral',
  draft: 'badge--draft',
  pending: 'badge--warning',
  confirmed: 'badge--success',
  completed: 'badge--completed',
  cancelled: 'badge--error',
  approved: 'badge--success',
  rejected: 'badge--error',
  under_review: 'badge--warning',
  published: 'badge--success',
};

export default function Badge({ variant = 'neutral', children, className }) {
  return (
    <span className={cn('badge', VARIANT_CLASSES[variant] || 'badge--neutral', className)}>
      {children}
    </span>
  );
}
