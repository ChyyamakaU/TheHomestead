import { useState, useEffect, useCallback } from 'react';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  getAllApartments,
  createApartment,
  updateApartment,
  deleteApartment,
  updateApartmentStatus,
  getAllAmenities,
  createAmenity,
  deleteAmenity,
  getApartmentImages,
  uploadImages,
  setPrimaryImage,
  deleteImage,
} from '../../api/admin/apartments';
import {
  formatPrice,
  formatLocation,
  getApiErrorMessage,
  getImageUrl,
  getPrimaryImage,
} from '../../utils/format';

/**
 * AdminApartmentsPage — full apartment management.
 *
 * Per brand brief section 13.2:
 * - Add, edit, delete apartments
 * - Upload images
 * - Publish/unpublish
 * - Update availability
 * - Manage amenities
 */
const EMPTY_FORM = {
  title: '', description: '', address: '', city: '', state: '',
  country: 'Nigeria', apartment_type: '', price: '', payment_period: 'per year',
  bedrooms: '0', bathrooms: '0', size: '', availability: 'available',
  status: 'draft', amenityIds: [],
};

export default function AdminApartmentsPage() {
  const [apartments, setApartments] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingApt, setEditingApt] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  // Image modal state
  const [imageModalApt, setImageModalApt] = useState(null);
  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Amenity modal
  const [amenityModalOpen, setAmenityModalOpen] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchApartments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await getAllApartments(params);
      setApartments(data.apartments || []);
    } catch {
      setApartments([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const fetchAmenities = useCallback(async () => {
    try {
      const data = await getAllAmenities();
      setAmenities(data.amenities || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchApartments();
    fetchAmenities();
  }, [fetchApartments, fetchAmenities]);

  // ── Apartment form handlers ──
  const openCreateForm = () => {
    setEditingApt(null);
    setFormData(EMPTY_FORM);
    setFormErrors([]);
    setFormOpen(true);
  };

  const openEditForm = (apt) => {
    setEditingApt(apt);
    setFormData({
      title: apt.title || '',
      description: apt.description || '',
      address: apt.address || '',
      city: apt.city || '',
      state: apt.state || '',
      country: apt.country || 'Nigeria',
      apartment_type: apt.apartment_type || '',
      price: apt.price || '',
      payment_period: apt.payment_period || 'per year',
      bedrooms: String(apt.bedrooms || 0),
      bathrooms: String(apt.bathrooms || 0),
      size: apt.size || '',
      availability: apt.availability || 'available',
      status: apt.status || 'draft',
      amenityIds: apt.amenities?.map((a) => a.id) || [],
    });
    setFormErrors([]);
    setFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors([]);
    setSaving(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        size: formData.size ? Number(formData.size) : null,
      };

      if (editingApt) {
        await updateApartment(editingApt.id, payload);
      } else {
        await createApartment(payload);
      }
      setFormOpen(false);
      fetchApartments();
    } catch (err) {
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setFormErrors([getApiErrorMessage(err)]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (apt) => {
    const newStatus = apt.status === 'published' ? 'draft' : 'published';
    try {
      await updateApartmentStatus(apt.id, newStatus);
      fetchApartments();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteApartment(deleteTarget.id);
      setDeleteTarget(null);
      fetchApartments();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  // ── Image management ──
  const openImageModal = async (apt) => {
    setImageModalApt(apt);
    setImagesLoading(true);
    try {
      const data = await getApartmentImages(apt.id);
      setImages(data.images || []);
    } catch {
      setImages([]);
    } finally {
      setImagesLoading(false);
    }
  };

  const handleUpload = async (files) => {
    if (!files.length || !imageModalApt) return;
    setUploading(true);
    try {
      await uploadImages(imageModalApt.id, Array.from(files));
      const data = await getApartmentImages(imageModalApt.id);
      setImages(data.images || []);
      fetchApartments();
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await setPrimaryImage(imageModalApt.id, imageId);
      const data = await getApartmentImages(imageModalApt.id);
      setImages(data.images || []);
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await deleteImage(imageModalApt.id, imageId);
      const data = await getApartmentImages(imageModalApt.id);
      setImages(data.images || []);
      fetchApartments();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  // ── Amenity management ──
  const handleCreateAmenity = async (e) => {
    e.preventDefault();
    if (!newAmenity.trim()) return;
    try {
      await createAmenity({ name: newAmenity.trim() });
      setNewAmenity('');
      fetchAmenities();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleDeleteAmenity = async (id) => {
    try {
      await deleteAmenity(id);
      fetchAmenities();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const toggleAmenity = (amenityId) => {
    setFormData((prev) => {
      const ids = prev.amenityIds.includes(amenityId)
        ? prev.amenityIds.filter((id) => id !== amenityId)
        : [...prev.amenityIds, amenityId];
      return { ...prev, amenityIds: ids };
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Apartments</h1>
        <div className="admin-page__actions">
          <Button variant="secondary" onClick={() => setAmenityModalOpen(true)}>
            Manage amenities
          </Button>
          <Button variant="primary" onClick={openCreateForm}>
            + Add apartment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <input
          type="text"
          className="admin-filters__search"
          placeholder="Search apartments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-filters__select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="page-loader"><Spinner size={40} /></div>
      ) : apartments.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Apartment</th>
              <th>Location</th>
              <th>Price</th>
              <th>Status</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apartments.map((apt) => (
              <tr key={apt.id}>
                <td>
                  <div className="admin-apartment-cell">
                    {apt.images?.length > 0 && (
                      <img
                        src={getImageUrl(getPrimaryImage(apt))}
                        alt=""
                        className="admin-apartment-cell__thumb"
                      />
                    )}
                    <span className="admin-apartment-cell__title">{apt.title}</span>
                  </div>
                </td>
                <td>{formatLocation(apt)}</td>
                <td>{formatPrice(apt.price, apt.payment_period)}</td>
                <td><StatusBadge status={apt.status} type="status" /></td>
                <td><StatusBadge status={apt.availability} type="availability" /></td>
                <td>
                  <div className="admin-table__actions">
                    <button className="admin-table__action" onClick={() => openEditForm(apt)} title="Edit">
                      ✎
                    </button>
                    <button className="admin-table__action" onClick={() => openImageModal(apt)} title="Images">
                      📷
                    </button>
                    <button className="admin-table__action" onClick={() => handleStatusToggle(apt)} title={apt.status === 'published' ? 'Unpublish' : 'Publish'}>
                      {apt.status === 'published' ? '⊝' : '⊕'}
                    </button>
                    <button className="admin-table__action admin-table__action--danger" onClick={() => setDeleteTarget(apt)} title="Delete">
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState
          title="No apartments yet"
          message="Create your first apartment listing to get started."
          action={<Button variant="primary" onClick={openCreateForm}>+ Add apartment</Button>}
        />
      )}

      {/* ── Apartment create/edit modal ── */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingApt ? 'Edit apartment' : 'Add apartment'} size="lg">
        <form className="enquiry-form" onSubmit={handleFormSubmit}>
          {formErrors.length > 0 && (
            <Alert variant="error">
              <ul className="enquiry-form__errors">
                {formErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </Alert>
          )}

          <div className="enquiry-form__row">
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-title">Title *</label>
              <input id="apt-title" type="text" className="enquiry-form__input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-type">Apartment type *</label>
              <input id="apt-type" type="text" className="enquiry-form__input" value={formData.apartment_type} onChange={(e) => setFormData({ ...formData, apartment_type: e.target.value })} required />
            </div>
          </div>

          <div className="enquiry-form__field">
            <label className="enquiry-form__label" htmlFor="apt-desc">Description</label>
            <textarea id="apt-desc" className="enquiry-form__input enquiry-form__textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>

          <div className="enquiry-form__row">
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-address">Address</label>
              <input id="apt-address" type="text" className="enquiry-form__input" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
          </div>

          <div className="enquiry-form__row">
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-city">City *</label>
              <input id="apt-city" type="text" className="enquiry-form__input" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
            </div>
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-state">State *</label>
              <input id="apt-state" type="text" className="enquiry-form__input" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
            </div>
          </div>

          <div className="enquiry-form__row">
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-price">Price *</label>
              <input id="apt-price" type="number" className="enquiry-form__input" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required min="0" />
            </div>
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-period">Payment period</label>
              <select id="apt-period" className="enquiry-form__input" value={formData.payment_period} onChange={(e) => setFormData({ ...formData, payment_period: e.target.value })}>
                <option value="per year">per year</option>
                <option value="per month">per month</option>
              </select>
            </div>
          </div>

          <div className="enquiry-form__row">
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-bed">Bedrooms</label>
              <input id="apt-bed" type="number" className="enquiry-form__input" value={formData.bedrooms} onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} min="0" />
            </div>
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-bath">Bathrooms</label>
              <input id="apt-bath" type="number" className="enquiry-form__input" value={formData.bathrooms} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} min="0" />
            </div>
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-size">Size (m²)</label>
              <input id="apt-size" type="number" className="enquiry-form__input" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} min="0" />
            </div>
          </div>

          <div className="enquiry-form__row">
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-avail">Availability</label>
              <select id="apt-avail" className="enquiry-form__input" value={formData.availability} onChange={(e) => setFormData({ ...formData, availability: e.target.value })}>
                <option value="available">Available</option>
                <option value="occupied">Rented</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <div className="enquiry-form__field">
              <label className="enquiry-form__label" htmlFor="apt-status">Status</label>
              <select id="apt-status" className="enquiry-form__input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="enquiry-form__field">
              <label className="enquiry-form__label">Amenities</label>
              <div className="amenity-picker">
                {amenities.map((a) => (
                  <label key={a.id} className="amenity-picker__item">
                    <input
                      type="checkbox"
                      checked={formData.amenityIds.includes(a.id)}
                      onChange={() => toggleAmenity(a.id)}
                    />
                    {a.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" variant="primary" loading={saving} className="enquiry-form__submit">
            {saving ? 'Saving...' : editingApt ? 'Save changes' : 'Create apartment'}
          </Button>
        </form>
      </Modal>

      {/* ── Image management modal ── */}
      <Modal open={!!imageModalApt} onClose={() => setImageModalApt(null)} title={`Images — ${imageModalApt?.title || ''}`} size="lg">
        {imagesLoading ? (
          <div className="page-loader"><Spinner size={32} /></div>
        ) : (
          <>
            {images.length > 0 && (
              <div className="image-manager">
                {images.map((img) => (
                  <div key={img.id} className="image-manager__item">
                    <img src={getImageUrl(img.url)} alt="" className="image-manager__img" />
                    {img.is_primary && <Badge variant="new">Primary</Badge>}
                    <div className="image-manager__actions">
                      {!img.is_primary && (
                        <button className="admin-table__action" onClick={() => handleSetPrimary(img.id)} title="Set as primary">
                          ★
                        </button>
                      )}
                      <button className="admin-table__action admin-table__action--danger" onClick={() => handleDeleteImage(img.id)} title="Delete">
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="image-upload">
              <label className="image-upload__label">
                <input type="file" accept="image/*" multiple onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
                <span className="btn btn--primary">{uploading ? 'Uploading...' : '+ Upload images'}</span>
              </label>
              <p className="text-small">Max 10 images per apartment. JPG, PNG, WebP. Max 5MB each.</p>
            </div>
          </>
        )}
      </Modal>

      {/* ── Amenity management modal ── */}
      <Modal open={amenityModalOpen} onClose={() => setAmenityModalOpen(false)} title="Manage amenities" size="md">
        <form className="enquiry-form__row" onSubmit={handleCreateAmenity}>
          <div className="enquiry-form__field" style={{ flex: 1 }}>
            <input type="text" className="enquiry-form__input" placeholder="New amenity name" value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} />
          </div>
          <Button type="submit" variant="primary">Add</Button>
        </form>
        <div className="amenity-list--admin">
          {amenities.map((a) => (
            <div key={a.id} className="amenity-row">
              <span>{a.name}</span>
              <button className="admin-table__action admin-table__action--danger" onClick={() => handleDeleteAmenity(a.id)}>🗑</button>
            </div>
          ))}
          {amenities.length === 0 && <p className="text-small">No amenities yet.</p>}
        </div>
      </Modal>

      {/* ── Delete confirm modal ── */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete apartment?" size="sm">
        <Alert variant="error">
          Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?
          This will also remove all associated images. This action cannot be undone.
        </Alert>
        <div className="admin-modal-actions">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
