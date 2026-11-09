import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import { getMyApplications } from '../../api/tenant';
import { initializePaystackPayment } from '../../api/payments';
import { formatDate, formatPrice, getPrimaryImage, getImageUrl, getApiErrorMessage } from '../../utils/format';

/**
 * DashboardApplicationsPage — tenant's rental applications.
 *
 * Surfaces the payment workflow for approved applications:
 *  - Approved + payment pending   → "Pay Now" button
 *  - Approved + payment processing → disabled "Processing…" button
 *  - payment_completed            → "Apartment secured" success state
 *  - Payment failed               → "Retry payment" option
 *  - Pending / under_review       → status badge only
 *  - Rejected                     → rejected badge + note
 */
export default function DashboardApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [payingId, setPayingId]         = useState(null); // payment_id currently being initiated
  const [payError, setPayError]         = useState({});   // { [app.id]: errorMessage }
  const navigate = useNavigate();

  useEffect(() => {
    getMyApplications()
      .then((data) => setApplications(data.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePayNow = async (app) => {
    // Find the pending/processing payment for this application
    const payment = (app.payments || [])[0];
    if (!payment) return;

    setPayError((prev) => ({ ...prev, [app.id]: null }));
    setPayingId(payment.id);

    try {
      const result = await initializePaystackPayment({ payment_id: payment.id });
      // Redirect to Paystack checkout
      window.location.href = result.authorization_url;
    } catch (err) {
      setPayError((prev) => ({ ...prev, [app.id]: getApiErrorMessage(err) }));
      setPayingId(null);
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: 'Deadline passed', urgent: true };
    if (diffDays === 0) return { text: 'Due today', urgent: true };
    if (diffDays === 1) return { text: '1 day remaining', urgent: true };
    return { text: `${diffDays} days remaining`, urgent: diffDays <= 3 };
  };

  if (loading) {
    return <div className="page-loader"><Spinner size={40} /></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1>My Applications</h1>
          <p className="admin-page__sub">Track the status of your rental applications.</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="dashboard-section">
          <p className="dashboard-section__empty">
            No applications yet.{' '}
            <Link to="/apartments" className="auth-card__link">Browse apartments →</Link>
          </p>
        </div>
      ) : (
        <div className="record-grid">
          {applications.map((app) => {
            const apartment   = app.apartment;
            const thumbUrl    = getImageUrl(getPrimaryImage(apartment));
            const location    = [apartment?.city, apartment?.state].filter(Boolean).join(', ');
            const ref         = `#APP-${String(app.id).padStart(5, '0')}`;
            const message     = app.message
              ? app.message.length > 100 ? app.message.substring(0, 100).trimEnd() + '…' : app.message
              : null;

            // Active payment obligation (first item from the server-side limited list)
            const payment     = (app.payments || [])[0] || null;
            const isApproved  = app.status === 'approved';
            const isCompleted = app.status === 'payment_completed';
            const deadline    = app.payment_deadline ? formatDeadline(app.payment_deadline) : null;

            // Determine Pay Now availability
            const canPay      = isApproved && payment && payment.status === 'pending' && app.payment_status === 'unpaid';
            const isProcessing = isApproved && payment && payment.status === 'processing';
            const isPaid      = isCompleted || (payment && payment.status === 'paid');

            const isInitiating = payingId === payment?.id;

            return (
              <div key={app.id} className={`record-card${isApproved && !isPaid ? ' record-card--highlight' : ''}`}>
                {/* Thumbnail */}
                {thumbUrl ? (
                  <img src={thumbUrl} alt="" className="record-card__thumb" />
                ) : (
                  <div className="record-card__thumb" aria-hidden="true" />
                )}

                {/* Body */}
                <div className="record-card__body">
                  <div className="record-card__title">
                    {apartment?.slug ? (
                      <a href={`/apartments/${apartment.slug}`}>{apartment?.title ?? '—'}</a>
                    ) : (
                      <span>{apartment?.title ?? app.apartment_title ?? '—'}</span>
                    )}
                  </div>

                  {location && <div className="record-card__location">{location}</div>}

                  <div className="record-card__meta">
                    <span className="record-card__meta-item">
                      <strong>Ref:</strong> {ref}
                    </span>
                    <span className="record-card__meta-item">
                      <strong>Submitted:</strong> {formatDate(app.created_at)}
                    </span>
                    {app.intended_move_in_date && (
                      <span className="record-card__meta-item">
                        <strong>Move-in:</strong> {formatDate(app.intended_move_in_date)}
                      </span>
                    )}
                  </div>

                  {message && <div className="record-card__message">"{message}"</div>}

                  {/* ── PAYMENT COMPLETED STATE ── */}
                  {isPaid && (
                    <div className="payment-obligation payment-obligation--success">
                      <div className="payment-obligation__title">
                        <span className="payment-obligation__icon">✓</span> Apartment Secured
                      </div>
                      <p className="payment-obligation__note">
                        Your payment has been confirmed and your apartment is reserved.
                      </p>
                      {payment && (
                        <p className="payment-obligation__ref">
                          <strong>Reference:</strong> {payment.reference}
                        </p>
                      )}
                      <Link to="/dashboard/payments" className="auth-card__link" style={{ fontSize: 'var(--text-sm)' }}>
                        View receipt →
                      </Link>
                    </div>
                  )}

                  {/* ── APPROVED — PAYMENT REQUIRED ── */}
                  {isApproved && !isPaid && payment && (
                    <div className="payment-obligation">
                      <div className="payment-obligation__title">
                        Payment Required to Secure Apartment
                      </div>

                      <div className="payment-obligation__breakdown">
                        <div className="payment-obligation__row">
                          <span>{payment.purpose}</span>
                          <span className="payment-obligation__amount">
                            {formatPrice(payment.amount)}
                          </span>
                        </div>
                        <div className="payment-obligation__row payment-obligation__total">
                          <span>Total due</span>
                          <span className="payment-obligation__amount">
                            {formatPrice(payment.amount)} {payment.currency}
                          </span>
                        </div>
                      </div>

                      {deadline && (
                        <p className={`payment-obligation__deadline${deadline.urgent ? ' payment-obligation__deadline--urgent' : ''}`}>
                          ⏰ {deadline.text} — {formatDate(app.payment_deadline)}
                        </p>
                      )}

                      <p className="payment-obligation__ref">
                        <strong>Invoice ref:</strong> {payment.reference}
                      </p>

                      {payError[app.id] && (
                        <Alert variant="error" style={{ marginTop: '8px' }}>
                          {payError[app.id]}
                        </Alert>
                      )}

                      {isProcessing && !isInitiating ? (
                        <div className="payment-obligation__processing">
                          <Spinner size={16} />
                          <span>Payment in progress — awaiting confirmation</span>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          loading={isInitiating}
                          disabled={!canPay || isInitiating}
                          onClick={() => handlePayNow(app)}
                          className="payment-obligation__btn"
                          aria-label={`Pay ${formatPrice(payment.amount)} for ${apartment?.title ?? 'apartment'}`}
                        >
                          {isInitiating ? 'Redirecting to payment…' : `Pay Now — ${formatPrice(payment.amount)}`}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* ── APPROVED but no payment record yet ── */}
                  {isApproved && !isPaid && !payment && (
                    <div className="payment-obligation payment-obligation--pending">
                      <p className="payment-obligation__note">
                        Your application has been approved. A payment request will be set up shortly — check back soon.
                      </p>
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <div className="record-card__badge">
                  <StatusBadge status={app.status} />
                  {app.payment_status && app.payment_status !== 'paid' && isApproved && (
                    <StatusBadge status={app.payment_status} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
