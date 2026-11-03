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
import { formatDate, formatDateTime, getApiErrorMessage } from '../../utils/format';

const STATUS_OPTIONS = ['pending', 'under_review', 'approved', 'rejected'];

/**
 * AdminApplicationsPage — manage rental applications.
 *
 * Per brand brief section 13.2:
 * - View submitted applications
 * - Update application statuses
 */
export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await getAllApplications(params);
      setApplications(data.applications || []);
      setPagination(data.pagination);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const openDetail = (app) => {
    setDetail(app);
    setNewStatus(app.status);
    setAdminNotes(app.admin_notes || '');
    setDetailOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateApplication(detail.id, { status: newStatus, admin_notes: adminNotes });
      setDetailOpen(false);
      fetchApplications();
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteApplication(deleteTarget.id);
      setDeleteTarget(null);
      fetchApplications();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

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
            <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-loader"><Spinner size={40} /></div>
      ) : applications.length > 0 ? (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Apartment</th>
                <th>Move-in date</th>
                <th>Status</th>
                <th>Received</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.full_name}</td>
                  <td>{app.email}</td>
                  <td>{app.apartment_title}</td>
                  <td>{formatDate(app.intended_move_in_date)}</td>
                  <td><StatusBadge status={app.status} /></td>
                  <td>{formatDate(app.created_at)}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button className="admin-table__action" onClick={() => openDetail(app)} title="View/edit">✎</button>
                      <button className="admin-table__action admin-table__action--danger" onClick={() => setDeleteTarget(app)} title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Application" size="md">
        {detail && (
          <div className="enquiry-form">
            <div className="admin-detail-grid">
              <div><strong>Name:</strong> {detail.full_name}</div>
              <div><strong>Email:</strong> {detail.email}</div>
              <div><strong>Phone:</strong> {detail.phone}</div>
              <div><strong>Apartment:</strong> {detail.apartment_title}</div>
              <div><strong>Move-in date:</strong> {formatDate(detail.intended_move_in_date)}</div>
              <div><strong>Submitted:</strong> {formatDateTime(detail.created_at)}</div>
            </div>

            {detail.message && (
              <div className="admin-detail-message">
                <strong>Message:</strong>
                <p>{detail.message}</p>
              </div>
            )}

            <form onSubmit={handleUpdate}>
              <div className="enquiry-form__field">
                <label className="enquiry-form__label">Status</label>
                <select className="enquiry-form__input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              <div className="enquiry-form__field">
                <label className="enquiry-form__label">Admin notes</label>
                <textarea className="enquiry-form__input enquiry-form__textarea" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} />
              </div>

              <Button type="submit" variant="primary" loading={saving} className="enquiry-form__submit">
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </form>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete application?" size="sm">
        <Alert variant="error">
          Are you sure you want to delete this application from <strong>{deleteTarget?.full_name}</strong>? This action cannot be undone.
        </Alert>
        <div className="admin-modal-actions">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
