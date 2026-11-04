import { useAuth } from '../../context/AuthContext';

/**
 * DashboardOverviewPage — placeholder for Phase 4.
 * Displays a welcome message so the route works now.
 */
export default function DashboardOverviewPage() {
  const { user } = useAuth();
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1>Welcome, {user?.first_name}.</h1>
          <p className="admin-page__sub">
            Your dashboard is being built. Full functionality arrives in Phase 4.
          </p>
        </div>
      </div>
      <div className="dashboard-coming-soon">
        <p>Overview, applications, viewings, saved apartments and payments will appear here.</p>
      </div>
    </div>
  );
}
