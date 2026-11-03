import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ImageGallery from '../../components/apartments/ImageGallery';
import AmenityList from '../../components/apartments/AmenityList';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import ViewingRequestForm from '../../components/forms/ViewingRequestForm';
import ApplicationForm from '../../components/forms/ApplicationForm';
import { getPublicApartmentBySlug } from '../../api/public';
import { formatPrice, formatLocation, getImageUrl } from '../../utils/format';

/**
 * ApartmentDetailPage — full apartment details with enquiry panel.
 *
 * Per brand brief section 7:
 * - Two-column layout on desktop (main content + enquiry panel)
 * - Main: gallery, title, location, description, amenities, specs
 * - Sidebar: price, payment period, availability, apply + viewing buttons
 * - Mobile: stacked vertically
 */
export default function ApartmentDetailPage() {
  const { slug } = useParams();
  const [apartment, setApartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalType, setModalType] = useState(null); // 'viewing' | 'application' | null

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPublicApartmentBySlug(slug)
      .then((data) => setApartment(data.apartment))
      .catch((err) => {
        setError(err.response?.status === 404 ? 'not-found' : 'error');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container">
        <div className="page-loader"><Spinner size={40} /></div>
      </div>
    );
  }

  if (error === 'not-found') {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-xl)' }}>
        <EmptyState
          title="Apartment not found"
          message="This apartment may have been removed or is no longer available."
          action={<Link to="/apartments" className="btn btn--primary">Browse apartments</Link>}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-xl)' }}>
        <EmptyState
          title="Something went wrong"
          message="We couldn't load this apartment. Please try again later."
          action={<Link to="/apartments" className="btn btn--secondary">Back to apartments</Link>}
        />
      </div>
    );
  }

  const location = formatLocation(apartment);
  const isAvailable = apartment.availability === 'available';

  return (
    <div className="apartment-detail">
      <div className="container">
        <Link to="/apartments" className="apartment-detail__back">
          ← Back to apartments
        </Link>

        <h1 className="apartment-detail__title">{apartment.title}</h1>
        <p className="apartment-detail__location">{location}</p>

        <div className="apartment-detail__layout">
          {/* Main content */}
          <div className="apartment-detail__main">
            {/* Image gallery */}
            <ImageGallery images={apartment.images} />

            {/* Specs */}
            <div className="apartment-detail__section">
              <h3>Property details</h3>
              <div className="apartment-detail__specs">
                <div className="apartment-detail__spec">
                  <span className="apartment-detail__spec-value">{apartment.bedrooms}</span>
                  <span className="apartment-detail__spec-label">Bedrooms</span>
                </div>
                <div className="apartment-detail__spec">
                  <span className="apartment-detail__spec-value">{apartment.bathrooms}</span>
                  <span className="apartment-detail__spec-label">Bathrooms</span>
                </div>
                {apartment.size && (
                  <div className="apartment-detail__spec">
                    <span className="apartment-detail__spec-value">{apartment.size}</span>
                    <span className="apartment-detail__spec-label">m²</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {apartment.description && (
              <div className="apartment-detail__section">
                <h3>About this apartment</h3>
                <p className="apartment-detail__description">{apartment.description}</p>
              </div>
            )}

            {/* Amenities */}
            {apartment.amenities?.length > 0 && (
              <div className="apartment-detail__section">
                <h3>Amenities and facilities</h3>
                <AmenityList amenities={apartment.amenities} />
              </div>
            )}
          </div>

          {/* Enquiry panel (sidebar) */}
          <aside className="apartment-detail__sidebar">
            <div className="enquiry-panel">
              <div className="enquiry-panel__price">
                {formatPrice(apartment.price, apartment.payment_period)}
              </div>
              <div className="enquiry-panel__divider" />
              <div className="enquiry-panel__detail">
                <span className="enquiry-panel__detail-label">Availability</span>
                <StatusBadge status={apartment.availability} type="availability" />
              </div>
              <div className="enquiry-panel__detail">
                <span className="enquiry-panel__detail-label">Type</span>
                <span className="enquiry-panel__detail-value">{apartment.apartment_type}</span>
              </div>
              {apartment.address && (
                <div className="enquiry-panel__detail">
                  <span className="enquiry-panel__detail-label">Address</span>
                  <span className="enquiry-panel__detail-value">{apartment.address}</span>
                </div>
              )}
              <div className="enquiry-panel__divider" />
              <div className="enquiry-panel__actions">
                <Button
                  variant="brass"
                  onClick={() => setModalType('application')}
                  disabled={!isAvailable}
                >
                  Apply for this apartment
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setModalType('viewing')}
                  disabled={!isAvailable}
                >
                  Request a viewing
                </Button>
              </div>
              {!isAvailable && (
                <p className="text-small" style={{ marginTop: '8px', color: 'var(--stone-deep)', textAlign: 'center' }}>
                  This apartment is currently {apartment.availability === 'occupied' ? 'rented' : 'unavailable'}.
                  Enquiries are temporarily disabled.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Modals for forms */}
      <Modal
        open={modalType === 'viewing'}
        onClose={() => setModalType(null)}
        title="Request a viewing"
        size="md"
      >
        <ViewingRequestForm apartmentId={apartment.id} apartmentTitle={apartment.title} />
      </Modal>

      <Modal
        open={modalType === 'application'}
        onClose={() => setModalType(null)}
        title="Apply for this apartment"
        size="md"
      >
        <ApplicationForm apartmentId={apartment.id} apartmentTitle={apartment.title} />
      </Modal>
    </div>
  );
}
