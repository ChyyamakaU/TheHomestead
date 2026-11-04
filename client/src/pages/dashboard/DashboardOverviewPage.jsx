import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  getDashboardStats,
  getMyApplications,
  getMyViewingRequests,
} from '../../api/tenant';
import { formatRelativeTime, getPrimaryImage, getImageUrl } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [recentViewings, setRecentViewings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getMyApplications(),
      getMyViewingRequests(),
    ])
      .then(([statsData, appsData, viewingsData]) => {
        setStats(statsData.stats);
        setRecentApps((appsData.applications || []).slice(0, 3));
        setRecentViewings((viewingsData.viewingRequests || []).slice(0, 3));
      })
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
          <h1>Welcome back, {user?.first_name}.</h1>
          <p className="admin-page__sub">Here's an overview of your activity.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card__label">Applications</div>
          <div className="summary-card__value">{stats?.applications?.total ?? 0}</div>
          <div className="summary-card__detail">
            {stats?.applications?.pending ?? 0} pending &middot;{' '}
            {stats?.applications?.approved ?? 0} approved
          </div>
          <Link to="/dashboard/applications" className="summary-card__link">
            View all →
          </Link>
        </div>

        <div className="summary-card">
          <div className="summary-card__label">Viewing requests</div>
          <div className="summary-card__value">{stats?.viewings?.total ?? 0}</div>
          <div className="summary-card__detail">
            {stats?.viewings?.pending ?? 0} pending &middot;{' '}
            {stats?.viewings?.confirmed ?? 0} confirmed
          </div>
          <Link to="/dashboard/viewings" className="summary-card__link">
            View all →
          </Link>
        </div>

        <div className="summary-card">
          <div className="summary-card__label">Saved apartments</div>
          <div className="summary-card__value">{stats?.saved ?? 0}</div>
          <div className="summary-card__detail">apartments in your list</div>
          <Link to="/dashboard/saved" className="summary-card__link">
            View all →
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      <div className="dashboard-grid">
        {/* Recent applications */}
        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h2>Recent applications</h2>
            <Link to="/dashboard/applications" className="dashboard-section__link">
              View all →
            </Link>
          </div>

          {recentApps.length > 0 ? (
            <div className="activity-list">
              {recentApps.map((app) => {
                const thumbUrl = getImageUrl(getPrimaryImage(app.apartment));
                return (
                  <div key={app.id} className="activity-item">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt=""
                        className="activity-item__thumb"
                      />
                    ) : (
                      <div className="activity-item__thumb" aria-hidden="true" />
                    )}
                    <div className="activity-item__info">
                      <p className="activity-item__title">
                        {app.apartment?.title ?? app.apartment_title ?? '—'}
                      </p>
                      <p className="activity-item__meta">
                        {formatRelativeTime(app.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="dashboard-section__empty">
              No applications yet.{' '}
              <Link to="/apartments" className="auth-card__link">
                Browse apartments →
              </Link>
            </p>
          )}
        </div>

        {/* Recent viewings */}
        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h2>Recent viewing requests</h2>
            <Link to="/dashboard/viewings" className="dashboard-section__link">
              View all →
            </Link>
          </div>

          {recentViewings.length > 0 ? (
            <div className="activity-list">
              {recentViewings.map((vr) => {
                const thumbUrl = getImageUrl(getPrimaryImage(vr.apartment));
                return (
                  <div key={vr.id} className="activity-item">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt=""
                        className="activity-item__thumb"
                      />
                    ) : (
                      <div className="activity-item__thumb" aria-hidden="true" />
                    )}
                    <div className="activity-item__info">
                      <p className="activity-item__title">
                        {vr.apartment?.title ?? vr.apartment_title ?? '—'}
                      </p>
                      <p className="activity-item__meta">
                        {formatRelativeTime(vr.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={vr.status} />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="dashboard-section__empty">
              No viewing requests yet.{' '}
              <Link to="/apartments" className="auth-card__link">
                Browse apartments →
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
