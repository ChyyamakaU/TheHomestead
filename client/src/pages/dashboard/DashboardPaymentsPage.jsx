import { useState, useEffect } from 'react';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { getMyPayments } from '../../api/payments';
import { formatDate } from '../../utils/format';

/**
 * DashboardPaymentsPage — tenant view of their payment history.
 */
export default function DashboardPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPayments()
      .then((data) => setPayments(data.payments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatAmount = (amount) =>
    `₦${Number(amount).toLocaleString('en-NG')}`;

  const formatMethod = (method) =>
    method === 'cash' ? 'Cash' : method === 'paystack' ? 'Paystack' : method;

  if (loading) {
    return (
      <div className="page-loader">
        <Spinner size={40} />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1>Payments</h1>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="dashboard-section">
          <p className="dashboard-section__empty">
            No payment records yet. Payments will appear here when they are created.
          </p>
        </div>
      ) : (
        <div className="record-cards">
          {payments.map((pmt) => (
            <div key={pmt.id} className="record-card">
              {/* Pending cash payment notice */}
              {pmt.payment_method === 'cash' && pmt.status === 'pending' && (
                <div className="record-card__notice">
                  <strong>Payment pending.</strong>{' '}
                  This payment is pending. Please follow the cash payment instructions provided by our team. Contact us to confirm your payment.
                </div>
              )}

              <div className="record-card__header">
                <div>
                  <p className="record-card__ref">
                    <code>{pmt.reference}</code>
                  </p>
                  <p className="record-card__purpose">{pmt.purpose}</p>
                </div>
                <StatusBadge status={pmt.status} />
              </div>

              <div className="record-card__details">
                <div className="record-card__detail">
                  <span className="record-card__detail-label">Amount</span>
                  <span className="record-card__detail-value">{formatAmount(pmt.amount)}</span>
                </div>
                <div className="record-card__detail">
                  <span className="record-card__detail-label">Method</span>
                  <span className="record-card__detail-value">{formatMethod(pmt.payment_method)}</span>
                </div>
                <div className="record-card__detail">
                  <span className="record-card__detail-label">Date initiated</span>
                  <span className="record-card__detail-value">{formatDate(pmt.created_at)}</span>
                </div>
                {pmt.apartment && (
                  <div className="record-card__detail">
                    <span className="record-card__detail-label">Apartment</span>
                    <span className="record-card__detail-value">{pmt.apartment.title}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
