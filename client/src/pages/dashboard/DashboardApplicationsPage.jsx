import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { getMyApplications } from '../../api/tenant';
import { formatDate, getPrimaryImage, getImageUrl } from '../../utils/format';

export default function DashboardApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyApplications()
      .then((data) => setApplications(data.applications || []))
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
          <h1>My Applications</h1>
          <p className="admin-page__sub">
            Track the status of your rental applications.
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="dashboard-section">
          <p className="dashboard-section__empty">
            No applications yet.{' '}
            <Link to="/apartments" className="auth-card__link">
              Browse apartments →
            </Link>
          </p>
        </div>
      ) : (
        <div className="record-grid">
          {applications.map((app) => {
            const apartment = app.apartment;
            const thumbUrl = getImageUrl(getPrimaryImage(apartment));
            const location = [apartment?.city, apartment?.state]
              .filter(Boolean)
              .join(', ');
            const ref = `#APP-${String(app.id).padStart(5, '0')}`;
            const message = app.message
              ? app.message.length > 100
                ? app.message.substring(0, 100).trimEnd() + '…'
                : app.message
              : null;

            return (
              <div key={app.id} className="record-card">
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
                      <strong>Submitted:</strong> {formatDate(app.created_at)}
                    </span>
                    {app.intended_move_in_date && (
                      <span className="record-card__meta-item">
                        <strong>Move-in:</strong>{' '}
                        {formatDate(app.intended_move_in_date)}
                      </span>
                    )}
                  </div>

                  {message && (
                    <div className="record-card__message">"{message}"</div>
                  )}
                </div>

                {/* Status badge */}
                <div className="record-card__badge">
                  <StatusBadge status={app.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
