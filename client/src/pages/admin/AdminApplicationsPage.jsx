import { useState, useEffect, useCallback } from 'react';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import {
  getAllApplications,
  updateApplication,
  deleteApplication,
} from '../../api/admin/applications';
import { formatDate, formatDateTime, formatPrice, getApiErrorMessage } from '../../utils/format';

// Include payment_completed so it can be set back from any UI path
const STATUS_OPTIONS = ['pending', 'under_review', 'approved', 'rejected', 'payment_completed'];

const statusLabel = (s) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * AdminApplicationsPage — manage rental applications.
 * Shows payment status alongside application status; payment details
 * appear in the detail modal when the application has been approved.
 */
export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);

  // Detail modal
  const [detailOpen, setDetailOpen]   = useState(false);
  const [detail, setDetail]           = useState(null);
  const [newStatus, setNewStatus]     = useState('');
  const [adminNotes, setAdminNotes]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError]   = useState('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search)       params.search = search;
      const data = await getAllApplications(params);
      setApplications(data.applications || []);
      setPagination(data.pagination);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const openDetail = (app) => {
    setDetail(app);
    setNewStatus(app.status);
    setAdminNotes(app.admin_notes || '');
    setSaveError('');
    setDetailOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const updated = await updateApplication(detail.id, { status: newStatus, admin_notes: adminNotes });
      // Refresh detail with returned data (includes newly created payment)
      setDetail(updated.application || detail);
      setDetailOpen(false);
      fetchApplications();
    } catch (err) {
      setSaveError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await deleteApplication(deleteTarget.id);
      setDeleteTarget(null);
      fetchApplications();
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    }
  };

  // Derive the pending payment from the included payments array (if any)
  const getPayment = (app) =>
    Array.isArray(app?.payments) ? app.payments[0] : null;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Applications</h1>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="text"
          className="admin-filters__search"
          placeholder="Search by name, email, or apartment..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="admin-filters__select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-loader"><Spinner size={40} /></div>
      ) : applications.length > 0 ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Apartment</th>
                  <th>Move-in date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Received</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const payment = getPayment(app);
                  return (
                    <tr key={app.id}>
                      <td>{app.full_name}</td>
                      <td>{app.email}</td>
                      <td>{app.apartment_title}</td>
                      <td>{formatDate(app.intended_move_in_date)}</td>
                      <td><StatusBadge status={app.status} /></td>
                      <td>
                        {app.payment_status ? (
                          <StatusBadge status={app.payment_status} />
                        ) : (
                          <span className="admin-table__muted">—</span>
                        )}
                        {payment && (
                          <span className="admin-table__amount">
                            {formatPrice(payment.amount)}
                          </span>
                        )}
                      </td>
                      <td>{formatDate(app.created_at)}</td>
                      <td>
                        <div className="admin-table__actions">
                          <button className="admin-table__action" onClick={() => openDetail(app)} title="View/edit">✎</button>
                          <button className="admin-table__action admin-table__action--danger" onClick={() => setDeleteTarget(app)} title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </>
      ) : (
        <EmptyState title="No applications" message="Applications will appear here when visitors submit them." />
      )}

      {/* Detail / edit modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Application Details" size="md">
        {detail && (
          <div className="enquiry-form">
            {/* ── Applicant info ── */}
            <div className="admin-detail-grid">
              <div><strong>Name:</strong> {detail.full_name}</div>
              <div><strong>Email:</strong> {detail.email}</div>
              <div><strong>Phone:</strong> {detail.phone}</div>
              <div><strong>Apartment:</strong> {detail.apartment_title}</div>
              <div><strong>Move-in date:</strong> {formatDate(detail.intended_move_in_date)}</div>
              <div><strong>Submitted:</strong> {formatDateTime(detail.created_at)}</div>
              {detail.approved_at && (
                <div><strong>Approved:</strong> {formatDateTime(detail.approved_at)}</div>
              )}
            </div>

            {detail.message && (
              <div className="admin-detail-message">
                <strong>Message:</strong>
                <p>{detail.message}</p>
              </div>
            )}

            {/* ── Payment info (shown once application is approved) ── */}
            {detail.payment_status && (
              <div className="admin-payment-summary">
                <h3 className="admin-payment-summary__title">Payment Information</h3>
                <div className="admin-detail-grid">
                  <div>
                    <strong>Payment status:</strong>{' '}
                    <StatusBadge status={detail.payment_status} />
                  </div>
                  {detail.payment_deadline && (
                    <div><strong>Payment deadline:</strong> {formatDate(detail.payment_deadline)}</div>
                  )}
                  {(() => {
                    const payment = getPayment(detail);
                    if (!payment) return null;
                    return (
                      <>
                        <div><strong>Amount:</strong> {formatPrice(payment.amount)} {payment.currency}</div>
                        <div><strong>Invoice ref:</strong> {payment.reference}</div>
                        <div><strong>Payment status:</strong> <StatusBadge status={payment.status} /></div>
                        {payment.paystack_reference && (
                          <div><strong>Paystack ref:</strong> {payment.paystack_reference}</div>
                        )}
                        {payment.verified_at && (
                          <div><strong>Paid on:</strong> {formatDateTime(payment.verified_at)}</div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── Status update form ── */}
            {saveError && <Alert variant="error">{saveError}</Alert>}

            <form onSubmit={handleUpdate}>
              <div className="enquiry-form__field">
                <label className="enquiry-form__label">Application status</label>
                <select
                  className="enquiry-form__input"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={detail.status === 'payment_completed'}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{statusLabel(s)}</option>
                  ))}
                </select>
                {detail.status === 'payment_completed' && (
                  <p className="auth-form__hint">
                    Status cannot be changed — payment has been completed and the apartment has been allocated.
                  </p>
                )}
              </div>

              <div className="enquiry-form__field">
                <label className="enquiry-form__label">Admin notes</label>
                <textarea
                  className="enquiry-form__input enquiry-form__textarea"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {detail.status !== 'payment_completed' && (
                <Button type="submit" variant="primary" loading={saving} className="enquiry-form__submit">
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              )}
            </form>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete application?" size="sm">
        {deleteError && <Alert variant="error">{deleteError}</Alert>}
        <Alert variant="error">
          Are you sure you want to delete this application from{' '}
          <strong>{deleteTarget?.full_name}</strong>? This action cannot be undone.
        </Alert>
        <div className="admin-modal-actions">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
