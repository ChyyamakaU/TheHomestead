import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import {
  getMyPayments,
  verifyPaystackPayment,
} from '../../api/payments';
import { formatDate, getApiErrorMessage } from '../../utils/format';

/**
 * DashboardPaymentsPage — tenant payment history.
 *
 * Also handles the return from Paystack checkout:
 * Paystack redirects to /dashboard/payments?ref=HM-... after payment.
 * On mount, if a ref param is present, we call the backend to verify it.
 */
export default function DashboardPaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null); // { status, message }

  const ref = searchParams.get('ref');

  // On mount: if returning from Paystack, verify then refresh list
  useEffect(() => {
    const init = async () => {
      if (ref) {
        setVerifying(true);
        try {
          const data = await verifyPaystackPayment(ref);
          setVerifyResult({
            type: data.payment?.status === 'paid' ? 'success' : 'error',
            message:
              data.payment?.status === 'paid'
                ? 'Payment confirmed successfully.'
                : 'Payment could not be verified. Please contact support if you were charged.',
          });
        } catch (err) {
          setVerifyResult({ type: 'error', message: getApiErrorMessage(err) });
        } finally {
          setVerifying(false);
          // Remove ref from URL so refresh doesn't re-verify
          setSearchParams({}, { replace: true });
        }
      }

      // Fetch payment list
      try {
        const data = await getMyPayments();
        setPayments(data.payments || []);
      } catch {
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const formatAmount = (amount) =>
    `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  if (loading || verifying) {
    return <div className="page-loader"><Spinner size={40} /></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1>Payments</h1>
          <p className="admin-page__sub">Your payment history and pending charges.</p>
        </div>
      </div>

      {/* Paystack return result */}
      {verifyResult && (
        <Alert variant={verifyResult.type === 'success' ? 'success' : 'error'}>
          {verifyResult.message}
        </Alert>
      )}

      {payments.length === 0 ? (
        <EmptyState
          title="No payment records"
          message="Payments will appear here when they are created by the Homestead team."
          action={<Link to="/apartments" className="btn btn--secondary">Browse apartments</Link>}
        />
      ) : (
        <div className="record-grid">
          {payments.map((payment) => (
            <div key={payment.id} className="record-card">
              <div className="record-card__body">
                <div className="record-card__title">
                  {payment.purpose}
                </div>

                {payment.apartment && (
                  <p className="record-card__location">
                    {payment.apartment.title}
                    {payment.apartment.city && ` — ${payment.apartment.city}`}
                  </p>
                )}

                <div className="record-card__meta">
                  <span className="record-card__meta-item">
                    <strong>Reference:</strong> {payment.reference}
                  </span>
                  <span className="record-card__meta-item">
                    <strong>Amount:</strong> {formatAmount(payment.amount)}
                  </span>
                  <span className="record-card__meta-item">
                    <strong>Method:</strong>{' '}
                    {payment.payment_method === 'cash' ? 'Cash' : 'Paystack'}
                  </span>
                  <span className="record-card__meta-item">
                    <strong>Date:</strong> {formatDate(payment.created_at)}
                  </span>
                  {payment.verified_at && (
                    <span className="record-card__meta-item">
                      <strong>Confirmed:</strong> {formatDate(payment.verified_at)}
                    </span>
                  )}
                </div>

                {/* Pending cash instructions */}
                {payment.payment_method === 'cash' && payment.status === 'pending' && (
                  <div className="record-card__note">
                    This payment is pending. Please follow the cash payment instructions provided
                    by our team. Contact us once payment has been made so we can confirm receipt.
                  </div>
                )}

                {payment.notes && (
                  <p className="record-card__message">{payment.notes}</p>
                )}

                {/* Receipt link — only for paid payments */}
                {payment.status === 'paid' && (
                  <div style={{ marginTop: 'var(--space-xs)' }}>
                    <Link
                      to={`/dashboard/payments/${payment.id}/receipt`}
                      className="auth-card__link"
                    >
                      View receipt →
                    </Link>
                  </div>
                )}
              </div>

              <div className="record-card__badge">
                <StatusBadge status={payment.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
