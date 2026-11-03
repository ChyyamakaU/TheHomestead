import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';

/**
 * AdminSidebar — navigation for the admin dashboard.
 *
 * Per brand brief section 13:
 * - Light backgrounds, White content surfaces
 * - Midnight and Brass brand accents
 * - Clear sidebar navigation
 */
const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: '▤' },
  { label: 'Apartments', path: '/admin/apartments', icon: ' home' },
  { label: 'Viewing requests', path: '/admin/viewing-requests', icon: '◇' },
  { label: 'Applications', path: '/admin/applications', icon: '✎' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className={cn('admin-sidebar__mobile-toggle', mobileOpen && 'admin-sidebar__mobile-toggle--open')}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle admin navigation"
        aria-expanded={mobileOpen}
      >
        <span className="admin-sidebar__toggle-bar" />
        <span className="admin-sidebar__toggle-bar" />
        <span className="admin-sidebar__toggle-bar" />
      </button>

      {mobileOpen && (
        <div className="admin-sidebar__backdrop" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn('admin-sidebar', mobileOpen && 'admin-sidebar--open')}>
        <div className="admin-sidebar__header">
          <Link to="/admin/dashboard" className="admin-sidebar__logo">
            <Logo variant="light" />
          </Link>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn('admin-sidebar__link', isActive && 'admin-sidebar__link--active')
              }
            >
              <span className="admin-sidebar__icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          {user && (
            <p className="admin-sidebar__user">
              {user.first_name} {user.last_name}
            </p>
          )}
          <Link to="/" className="admin-sidebar__link admin-sidebar__link--public">
            <span className="admin-sidebar__icon" aria-hidden="true">↩</span>
            View public site
          </Link>
          <button className="admin-sidebar__link admin-sidebar__link--logout" onClick={handleLogout}>
            <span className="admin-sidebar__icon" aria-hidden="true">⏻</span>
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
