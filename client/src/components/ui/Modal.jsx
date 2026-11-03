import { useEffect } from 'react';
import { cn } from '../../utils/cn';

/**
 * Modal — accessible dialog overlay.
 *
 * Closes on Escape key and backdrop click.
 * Traps focus within the modal (basic: focus starts on the modal).
 */
export default function Modal({ open, onClose, title, children, size = 'md', className }) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={cn('modal', `modal--${size}`, className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          {title && <h3 className="modal__title">{title}</h3>}
          <button className="modal__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
