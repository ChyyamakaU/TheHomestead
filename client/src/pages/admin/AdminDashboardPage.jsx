import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/ui/Spinner';
import {
  getViewingRequestStats,
  getAllViewingRequests,
} from '../../api/admin/viewingRequests';
import {
  getApplicationStats,
  getAllApplications,
} from '../../api/admin/applications';
import { getAllApartments } from '../../api/admin/apartments';
import { formatRelativeTime } from '../../utils/format';

/**
 * AdminDashboardPage — overview with summary cards and recent activity.
 *
 * Per brand brief section 13.1:
 * - Light backgrounds, White content surfaces
 * - Midnight and Brass accents
 * - Simple summary cards, clear status labels
 */
export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [apartments, setApartments] = useState([]);
  const [viewingStats, setViewingStats] = useState(null);
  const [applicationStats, setApplicationStats] = useState(null);
  const [recentViewing, setRecentViewing] = useState([]);
  const [recentApps, setRecentApps] = useState([]);

  useEffect(() => {
    Promise.all([
      getAllApartments(),
      getViewingRequestStats(),
      getApplicationStats(),
      getAllViewingRequests({ limit: 5 }),
      getAllApplications({ limit: 5 }),
    ])
      .then(([aptData, vrStats, appStats, vrList, appList]) => {
        setApartments(aptData.apartments || []);
        setViewingStats(vrStats.stats);
        setApplicationStats(appStats.stats);
        setRecentViewing(vrList.viewingRequests || []);
        setRecentApps(appList.applications || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page-loader"><Spinner size={40} /></div>;
  }

  const publishedCount = apartments.filter((a) => a.status === 'published').length;
  const draftCount = apartments.filter((a) => a.status === 'draft').length;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Dashboard</h1>
        <p className="admin-page__sub">Overview of apartments and enquiries.</p>
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card__label">Total apartments</div>
          <div className="summary-card__value">{apartments.length}</div>
          <div className="summary-card__detail">
            {publishedCount} published · {draftCount} draft
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card__label">Viewing requests</div>
          <div className="summary-card__value">{viewingStats?.total || 0}</div>
          <div className="summary-card__detail">
            {viewingStats?.pending || 0} pending
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card__label">Applications</div>
          <div className="summary-card__value">{applicationStats?.total || 0}</div>
          <div className="summary-card__detail">
            {applicationStats?.pending || 0} pending
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h2>Recent viewing requests</h2>
            <Link to="/admin/viewing-requests" className="dashboard-section__link">
              View all →
            </Link>
          </div>
          {recentViewing.length > 0 ? (
            <div className="admin-table-wrap"><table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Apartment</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {recentViewing.map((vr) => (
                  <tr key={vr.id}>
                    <td>{vr.full_name}</td>
                    <td>{vr.apartment_title}</td>
                    <td><span className={`status-tag status-tag--${vr.status}`}>{vr.status}</span></td>
                    <td>{formatRelativeTime(vr.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : (
            <p className="dashboard-section__empty">No viewing requests yet.</p>
          )}
        </div>

        <div className="dashboard-section">
          <div className="dashboard-section__header">
            <h2>Recent applications</h2>
            <Link to="/admin/applications" className="dashboard-section__link">
              View all →
            </Link>
          </div>
          {recentApps.length > 0 ? (
            <div className="admin-table-wrap"><table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Apartment</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map((app) => (
                  <tr key={app.id}>
                    <td>{app.full_name}</td>
                    <td>{app.apartment_title}</td>
                    <td><span className={`status-tag status-tag--${app.status}`}>{app.status.replace('_', ' ')}</span></td>
                    <td>{formatRelativeTime(app.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : (
            <p className="dashboard-section__empty">No applications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
