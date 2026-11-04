import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';

/**
 * TenantRoute — guards tenant-only dashboard routes.
 *
 * If auth is still loading: shows a spinner.
 * If not authenticated: redirects to /login, preserving the intended destination.
 * If authenticated but not a tenant (e.g. admin): redirects to /admin/dashboard.
 * If authenticated tenant: renders children.
 */
export default function TenantRoute({ children }) {
  const { isAuthenticated, isTenant, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-loader">
        <Spinner size={40} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // An admin who lands on a tenant route gets sent to the admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!isTenant) {
    return <Navigate to="/" replace />;
  }

  return children;
}
