import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { getMyViewingRequests } from '../../api/tenant';
import { formatDate, getPrimaryImage, getImageUrl } from '../../utils/format';

export default function DashboardViewingsPage() {
  const [viewings, setViewings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyViewingRequests()
      .then((data) => setViewings(data.viewingRequests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          <h1>My Viewings</h1>
          <p className="admin-page__sub">
            Track your viewing requests and scheduled visits.
          </p>
        </div>
      </div>

      {/* Info note */}
      <div className="record-card__note">
        Submitting a request does not automatically confirm a viewing. You will
        be contacted to confirm arrangements.
      </div>

      {viewings.length === 0 ? (
        <div className="dashboard-section">
          <p className="dashboard-section__empty">
            No viewing requests yet.{' '}
            <Link to="/apartments" className="auth-card__link">
              Browse apartments →
            </Link>
          </p>
        </div>
      ) : (
        <div className="record-grid">
          {viewings.map((vr) => {
            const apartment = vr.apartment;
            const thumbUrl = getImageUrl(getPrimaryImage(apartment));
            const location = [apartment?.city, apartment?.state]
              .filter(Boolean)
              .join(', ');
            const ref = `#VR-${String(vr.id).padStart(5, '0')}`;

            return (
              <div key={vr.id} className="record-card">
                {/* Thumbnail */}
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt=""
                    className="record-card__thumb"
                  />
                ) : (
                  <div className="record-card__thumb" aria-hidden="true" />
                )}

                {/* Body */}
                <div className="record-card__body">
                  <div className="record-card__title">
                    {apartment?.slug ? (
                      <a href={`/apartments/${apartment.slug}`}>
                        {apartment?.title ?? '—'}
                      </a>
                    ) : (
                      <span>{apartment?.title ?? '—'}</span>
                    )}
                  </div>

                  {location && (
                    <div className="record-card__location">{location}</div>
                  )}

                  <div className="record-card__meta">
                    <span className="record-card__meta-item">
                      <strong>Ref:</strong> {ref}
                    </span>
                    <span className="record-card__meta-item">
                      <strong>Preferred date:</strong>{' '}
                      {formatDate(vr.preferred_date)}
                    </span>
                    {vr.preferred_time && (
                      <span className="record-card__meta-item">
                        <strong>Preferred time:</strong> {vr.preferred_time}
                      </span>
                    )}
                    <span className="record-card__meta-item">
                      <strong>Submitted:</strong> {formatDate(vr.created_at)}
                    </span>
                  </div>

                  {vr.message && (
                    <div className="record-card__message">"{vr.message}"</div>
                  )}
                </div>

                {/* Status badge */}
                <div className="record-card__badge">
                  <StatusBadge status={vr.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
