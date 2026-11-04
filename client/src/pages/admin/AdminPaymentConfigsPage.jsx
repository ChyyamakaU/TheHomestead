import { useState, useEffect, useCallback } from 'react';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import {
  getAllPaymentConfigs,
  createPaymentConfig,
  updatePaymentConfig,
  deletePaymentConfig,
} from '../../api/payments';
import { formatDateTime, getApiErrorMessage } from '../../utils/format';

/**
 * AdminPaymentConfigsPage — manage payment purposes and amounts.
 */
export default function AdminPaymentConfigsPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add / Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = create mode
  const [formPurpose, setFormPurpose] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState(null);
  const [formSaving, setFormSaving] = useState(false);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllPaymentConfigs();
      setConfigs(data.configs || []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // ── Open add form ────────────────────────────────────────────────────────
  const openAddForm = () => {
    setEditTarget(null);
    setFormPurpose('');
    setFormAmount('');
    setFormDescription('');
    setFormIsActive(true);
    setFormError(null);
    setFormOpen(true);
  };

  // ── Open edit form ───────────────────────────────────────────────────────
  const openEditForm = (config) => {
    setEditTarget(config);
    setFormPurpose(config.purpose);
    setFormAmount(String(config.amount));
    setFormDescription(config.description || '');
    setFormIsActive(config.is_active);
    setFormError(null);
    setFormOpen(true);
  };

  // ── Submit add / edit ────────────────────────────────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSaving(true);
    try {
      const payload = {
        purpose: formPurpose,
        amount: parseFloat(formAmount),
        description: formDescription || undefined,
        is_active: formIsActive,
      };
      if (editTarget) {
        await updatePaymentConfig(editTarget.id, payload);
      } else {
        await createPaymentConfig(payload);
      }
      setFormOpen(false);
      fetchConfigs();
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setFormSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const openDeleteConfirm = (config) => {
    setDeleteTarget(config);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deletePaymentConfig(deleteTarget.id);
      setDeleteTarget(null);
      fetchConfigs();
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Format amount ─────────────────────────────────────────────────────────
  const formatAmount = (amount) =>
    `₦${Number(amount).toLocaleString('en-NG')}`;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h1>Payment Configurations</h1>
          <p className="admin-page__sub">
            Define payment purposes and amounts. These are used when creating payment requests for tenants.
          </p>
        </div>
        <Button variant="primary" onClick={openAddForm}>
          + Add config
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Table */}
      {loading ? (
        <div className="page-loader"><Spinner size={40} /></div>
      ) : configs.length === 0 ? (
        <EmptyState
          title="No payment configurations"
          message="Add your first payment configuration to get started."
          action={<Button variant="primary" onClick={openAddForm}>Add config</Button>}
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Purpose</th>
                <th>Slug</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created by</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.id}>
                  <td><strong>{config.purpose}</strong></td>
                  <td><code>{config.slug}</code></td>
                  <td>{formatAmount(config.amount)}</td>
                  <td>
                    {config.is_active ? (
                      <StatusBadge status="active" />
                    ) : (
                      <span className="badge badge--inactive">Inactive</span>
                    )}
                  </td>
                  <td>
                    {config.creator
                      ? `${config.creator.first_name} ${config.creator.last_name}`
                      : '—'}
                  </td>
                  <td>{formatDateTime(config.created_at)}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        className="admin-table__action"
                        onClick={() => openEditForm(config)}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        className="admin-table__action admin-table__action--danger"
                        onClick={() => openDeleteConfirm(config)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? 'Edit Payment Configuration' : 'Add Payment Configuration'}
        size="md"
      >
        {formError && <Alert variant="error">{formError}</Alert>}
        <form onSubmit={handleFormSubmit}>
          <div className="enquiry-form__field">
            <label className="enquiry-form__label" htmlFor="pc-purpose">
              Purpose <span aria-hidden="true">*</span>
            </label>
            <input
              id="pc-purpose"
              className="enquiry-form__input"
              type="text"
              required
              maxLength={100}
              value={formPurpose}
              onChange={(e) => setFormPurpose(e.target.value)}
              placeholder="e.g. Application Fee"
            />
          </div>

          <div className="enquiry-form__field">
            <label className="enquiry-form__label" htmlFor="pc-amount">
              Amount (NGN) <span aria-hidden="true">*</span>
            </label>
            <input
              id="pc-amount"
              className="enquiry-form__input"
              type="number"
              required
              min="0"
              step="0.01"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="e.g. 5000"
            />
          </div>

          <div className="enquiry-form__field">
            <label className="enquiry-form__label" htmlFor="pc-description">
              Description
            </label>
            <textarea
              id="pc-description"
              className="enquiry-form__input enquiry-form__textarea"
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Optional description of this payment"
            />
          </div>

          <div className="enquiry-form__field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              id="pc-active"
              type="checkbox"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
            />
            <label htmlFor="pc-active" className="enquiry-form__label" style={{ margin: 0 }}>
              Active (tenants can use this config)
            </label>
          </div>

          <div className="admin-modal-actions">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={formSaving}>
              {formSaving ? 'Saving...' : editTarget ? 'Save changes' : 'Create config'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete payment configuration?"
        size="sm"
      >
        {deleteError && <Alert variant="error">{deleteError}</Alert>}
        <Alert variant="warning">
          Are you sure you want to delete <strong>{deleteTarget?.purpose}</strong>?
          If this configuration has been used in any payments, deletion will be blocked — deactivate it instead.
        </Alert>
        <div className="admin-modal-actions">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
