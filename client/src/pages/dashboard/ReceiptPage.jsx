import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyPaymentById } from '../../api/payments';
import Spinner from '../../components/ui/Spinner';
import { formatDate, formatDateTime, getApiErrorMessage } from '../../utils/format';

/**
 * ReceiptPage — printable payment confirmation.
 *
 * Route: /dashboard/payments/:id/receipt
 * Only accessible by the tenant who owns the payment AND only for paid payments.
 *
 * Branding: Homestead palette — Midnight header, white body, Brass accents.
 * The print stylesheet hides the browser chrome and nav buttons.
 */
export default function ReceiptPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyPaymentById(id)
      .then((data) => {
        if (data.payment.status !== 'paid') {
          setError('A receipt is only available for confirmed payments.');
        } else {
          setPayment(data.payment);
        }
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const formatAmount = (amount) =>
    `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="page-loader"><Spinner size={40} /></div>;

  if (error) {
    return (
      <div className="receipt-error">
        <p>{error}</p>
        <Link to="/dashboard/payments" className="btn btn--secondary">Back to payments</Link>
      </div>
    );
  }

  return (
    <div className="receipt-page">
      {/* Print / back actions — hidden when printing */}
      <div className="receipt-actions no-print">
        <button className="btn btn--secondary" onClick={() => navigate(-1)}>← Back</button>
        <button className="btn btn--primary" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      {/* Receipt document */}
      <div className="receipt">
        {/* Header */}
        <div className="receipt__header">
          <div className="receipt__brand">
            {/* Inline SVG house mark */}
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
              <path d="M18 4L4 15.5V31a1 1 0 001 1h8V23h10v9h8a1 1 0 001-1V15.5L18 4Z" fill="#EEF2F5"/>
              <rect x="15" y="23" width="6" height="9" fill="#C9A24D" rx="1"/>
            </svg>
            <span className="receipt__brand-name">Homestead</span>
          </div>
          <div className="receipt__header-right">
            <p className="receipt__doc-title">Payment Receipt</p>
            <p className="receipt__doc-ref">{payment.reference}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className="receipt__status">
          <span className="receipt__status-badge">PAID</span>
        </div>

        {/* Two-column details */}
        <div className="receipt__body">
          <div className="receipt__section">
            <h3 className="receipt__section-title">Payment details</h3>
            <div className="receipt__row">
              <span className="receipt__label">Reference</span>
              <span className="receipt__value">{payment.reference}</span>
            </div>
            <div className="receipt__row">
              <span className="receipt__label">Purpose</span>
              <span className="receipt__value">{payment.purpose}</span>
            </div>
            <div className="receipt__row">
              <span className="receipt__label">Amount</span>
              <span className="receipt__value receipt__value--amount">
                {formatAmount(payment.amount)} {payment.currency}
              </span>
            </div>
            <div className="receipt__row">
              <span className="receipt__label">Payment method</span>
              <span className="receipt__value" style={{ textTransform: 'capitalize' }}>
                {payment.payment_method === 'paystack' ? 'Paystack (Online)' : 'Cash'}
              </span>
            </div>
            <div className="receipt__row">
              <span className="receipt__label">Date initiated</span>
              <span className="receipt__value">{formatDate(payment.created_at)}</span>
            </div>
            <div className="receipt__row">
              <span className="receipt__label">Date confirmed</span>
              <span className="receipt__value">{formatDateTime(payment.verified_at)}</span>
            </div>
            {payment.paystack_reference && (
              <div className="receipt__row">
                <span className="receipt__label">Transaction reference</span>
                <span className="receipt__value receipt__value--mono">
                  {payment.paystack_reference}
                </span>
              </div>
            )}
          </div>

          <div className="receipt__section">
            <h3 className="receipt__section-title">Customer details</h3>
            <div className="receipt__row">
              <span className="receipt__label">Name</span>
              <span className="receipt__value">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
            <div className="receipt__row">
              <span className="receipt__label">Email</span>
              <span className="receipt__value">{user?.email}</span>
            </div>
            {payment.apartment && (
              <div className="receipt__row">
                <span className="receipt__label">Apartment</span>
                <span className="receipt__value">
                  {payment.apartment.title}
                  {payment.apartment.city && `, ${payment.apartment.city}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="receipt__footer">
          <p>Thank you for your payment. Please retain this receipt for your records.</p>
          <p className="receipt__footer-tagline">Homestead — A place to call home.</p>
        </div>
      </div>
    </div>
  );
}
