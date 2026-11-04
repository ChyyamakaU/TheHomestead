import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import Logo from '../../components/ui/Logo';
import { Link } from 'react-router-dom';

/**
 * DashboardLayout — wraps all tenant dashboard pages.
 * Provides the sidebar navigation and top bar.
 * Full content for each section is built in Phase 4.
 */
const DASHBOARD_NAV = [
  { label: 'Overview', path: '/dashboard' },
  { label: 'My Applications', path: '/dashboard/applications' },
  { label: 'My Viewings', path: '/dashboard/viewings' },
  { label: 'Saved Apartments', path: '/dashboard/saved' },
  { label: 'Payments', path: '/dashboard/payments' },
  { label: 'My Profile', path: '/dashboard/profile' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__header">
          <Link to="/" className="dashboard-sidebar__logo">
            <Logo variant="light" />
          </Link>
        </div>

        <div className="dashboard-sidebar__user">
          <p className="dashboard-sidebar__name">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="dashboard-sidebar__email">{user?.email}</p>
        </div>

        <nav className="dashboard-sidebar__nav" aria-label="Dashboard navigation">
          {DASHBOARD_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                cn('dashboard-sidebar__link', isActive && 'dashboard-sidebar__link--active')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="dashboard-sidebar__footer">
          <Link to="/apartments" className="dashboard-sidebar__link">
            ← Browse apartments
          </Link>
          <button className="dashboard-sidebar__link dashboard-sidebar__link--logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}
