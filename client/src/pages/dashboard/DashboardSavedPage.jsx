import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import ApartmentCard from '../../components/apartments/ApartmentCard';
import { getFavourites, unsaveApartment } from '../../api/tenant';

export default function DashboardSavedPage() {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    getFavourites()
      .then((data) => setApartments(data.apartments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (id) => {
    setRemoving(id);
    try {
      await unsaveApartment(id);
      setApartments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silently ignore — user can retry
    } finally {
      setRemoving(null);
    }
  };

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
          <h1>Saved Apartments</h1>
          <p className="admin-page__sub">
            Apartments you've saved for later.
          </p>
        </div>
      </div>

      {apartments.length === 0 ? (
        <div className="dashboard-section">
          <p className="dashboard-section__empty">
            No saved apartments yet.{' '}
            <Link to="/apartments" className="auth-card__link">
              Browse apartments →
            </Link>
          </p>
        </div>
      ) : (
        <div className="apartment-grid">
          {apartments.map((apartment) => (
            <div key={apartment.id} className="saved-card-wrap">
              <ApartmentCard apartment={apartment} />
              <button
                className="saved-card-remove"
                onClick={() => handleRemove(apartment.id)}
                disabled={removing === apartment.id}
                aria-label={`Remove ${apartment.title} from saved`}
              >
                {removing === apartment.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
