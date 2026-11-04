import { useState, useEffect, useCallback } from 'react';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import {
  getAllPayments,
  verifyCashPayment,
  cancelPayment,
} from '../../api/payments';
import { formatDate, formatDateTime, getApiErrorMessage } from '../../utils/format';

const STATUS_OPTIONS = ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'];
const METHOD_OPTIONS = ['cash', 'paystack'];

/**
 * AdminPaymentsPage — view and manage all payments.
 */
export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  // Verify modal
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifyError, setVerifyError] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.payment_method = methodFilter;
      const data = await getAllPayments(params);
      setPayments(data.payments || []);
      setPagination(data.pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const formatAmount = (amount) =>
    `₦${Number(amount).toLocaleString('en-NG')}`;

  const formatMethod = (method) =>
    method === 'cash' ? 'Cash' : method === 'paystack' ? 'Paystack' : method;

  // ── Verify cash payment ───────────────────────────────────────────────────
  const handleVerify = async () => {
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      await verifyCashPayment(verifyTarget.id, { notes: verifyNotes || undefined });
      setVerifyTarget(null);
      fetchPayments();
    } catch (err) {
      setVerifyError(getApiErrorMessage(err));
    } finally {
      setVerifyLoading(false);
    }
  };

  // ── Cancel payment ────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelLoading(true);
    setCancelError(null);
    try {
      await cancelPayment(cancelTarget.id);
      setCancelTarget(null);
      fetchPayments();
    } catch (err) {
      setCancelError(getApiErrorMessage(err));
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <h1>Payments</h1>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Filters */}
      <div className="admin-filters">
        <select
          className="admin-filters__select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          className="admin-filters__select"
          value={methodFilter}
          onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
        >
          <option value="">All methods</option>
          {METHOD_OPTIONS.map((m) => (
            <option key={m} value={m}>{formatMethod(m)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-loader"><Spinner size={40} /></div>
      ) : payments.length === 0 ? (
        <EmptyState title="No payments" message="Payments will appear here when they are created." />
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Tenant</th>
                  <th>Purpose</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pmt) => (
                  <tr key={pmt.id}>
                    <td>
                      <code style={{ fontSize: '0.8em' }}>{pmt.reference}</code>
                    </td>
                    <td>
                      {pmt.user
                        ? (<>
                            <span>{pmt.user.first_name} {pmt.user.last_name}</span>
                            <br />
                            <small style={{ color: 'var(--color-text-muted, #666)' }}>{pmt.user.email}</small>
                          </>)
                        : '—'}
                    </td>
                    <td>{pmt.purpose}</td>
                    <td>{formatAmount(pmt.amount)}</td>
                    <td>{formatMethod(pmt.payment_method)}</td>
                    <td><StatusBadge status={pmt.status} /></td>
                    <td>{formatDate(pmt.created_at)}</td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          className="admin-table__action"
                          onClick={() => { setDetail(pmt); setDetailOpen(true); }}
                          title="View details"
                        >
                          👁
                        </button>
                        {pmt.payment_method === 'cash' && pmt.status === 'pending' && (
                          <button
                            className="admin-table__action"
                            onClick={() => { setVerifyTarget(pmt); setVerifyNotes(''); setVerifyError(null); }}
                            title="Verify cash payment"
                            style={{ color: 'green' }}
                          >
                            ✔
                          </button>
                        )}
                        {['pending', 'processing'].includes(pmt.status) && (
                          <button
                            className="admin-table__action admin-table__action--danger"
                            onClick={() => { setCancelTarget(pmt); setCancelError(null); }}
                            title="Cancel payment"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Payment Details"
        size="md"
      >
        {detail && (
          <div className="admin-detail-grid">
            <div><strong>Reference:</strong> <code>{detail.reference}</code></div>
            <div><strong>Purpose:</strong> {detail.purpose}</div>
            <div><strong>Amount:</strong> {formatAmount(detail.amount)}</div>
            <div><strong>Currency:</strong> {detail.currency}</div>
            <div><strong>Method:</strong> {formatMethod(detail.payment_method)}</div>
            <div><strong>Status:</strong> <StatusBadge status={detail.status} /></div>
            <div><strong>Date initiated:</strong> {formatDateTime(detail.created_at)}</div>
            {detail.verified_at && (
              <div><strong>Verified at:</strong> {formatDateTime(detail.verified_at)}</div>
            )}
            {detail.user && (
              <div>
                <strong>Tenant:</strong>{' '}
                {detail.user.first_name} {detail.user.last_name} ({detail.user.email})
              </div>
            )}
            {detail.apartment && (
              <div>
                <strong>Apartment:</strong>{' '}
                {detail.apartment.title}, {detail.apartment.city}
              </div>
            )}
            {detail.application && (
              <div>
                <strong>Application:</strong> #{detail.application.id} ({detail.application.status})
              </div>
            )}
            {detail.notes && (
              <div><strong>Notes:</strong> {detail.notes}</div>
            )}
          </div>
        )}
      </Modal>

      {/* Verify Cash Modal */}
      <Modal
        open={!!verifyTarget}
        onClose={() => setVerifyTarget(null)}
        title="Verify Cash Payment"
        size="sm"
      >
        {verifyError && <Alert variant="error">{verifyError}</Alert>}
        {verifyTarget && (
          <>
            <p>
              Confirm that cash payment <strong>{verifyTarget.reference}</strong>{' '}
              of <strong>{formatAmount(verifyTarget.amount)}</strong> has been received.
            </p>
            <div className="enquiry-form__field" style={{ marginTop: '1rem' }}>
              <label className="enquiry-form__label" htmlFor="verify-notes">
                Notes (optional)
              </label>
              <textarea
                id="verify-notes"
                className="enquiry-form__input enquiry-form__textarea"
                rows={2}
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Any notes about this verification..."
              />
            </div>
            <div className="admin-modal-actions">
              <Button variant="secondary" onClick={() => setVerifyTarget(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleVerify} loading={verifyLoading}>
                {verifyLoading ? 'Verifying...' : 'Verify payment'}
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Payment?"
        size="sm"
      >
        {cancelError && <Alert variant="error">{cancelError}</Alert>}
        {cancelTarget && (
          <>
            <Alert variant="warning">
              Cancel payment <strong>{cancelTarget.reference}</strong>{' '}
              of <strong>{formatAmount(cancelTarget.amount)}</strong>?
              This action cannot be undone.
            </Alert>
            <div className="admin-modal-actions">
              <Button variant="secondary" onClick={() => setCancelTarget(null)}>Keep payment</Button>
              <Button variant="danger" onClick={handleCancel} loading={cancelLoading}>
                {cancelLoading ? 'Cancelling...' : 'Cancel payment'}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
