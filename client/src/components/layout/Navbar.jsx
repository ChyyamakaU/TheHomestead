import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';

/**
 * Navbar — public site navigation.
 * Shows different right-side actions depending on auth state:
 *   - Unauthenticated:  Login | Register | Explore Apartments (CTA)
 *   - Tenant:           Dashboard | Logout | Explore Apartments (CTA)
 *   - Admin/Superadmin: Admin Dashboard | Logout
 */
const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Apartments', path: '/apartments' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isTenant, user, logout } = useAuth();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={cn('navbar', scrolled && 'navbar--scrolled')}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" aria-label="The Homestead — Home">
          <Logo variant="light" />
        </Link>

        {/* Desktop nav links */}
        <nav className="navbar__links" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.path} to={link.path} end={link.path === '/'}
              className={({ isActive }) => cn('navbar__link', isActive && 'navbar__link--active')}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop right-side actions */}
        <div className="navbar__actions">
          {!isAuthenticated && (
            <>
              <Link to="/login" className="navbar__link">Sign in</Link>
              <Link to="/register" className="navbar__cta">Create account</Link>
            </>
          )}
          {isTenant && (
            <>
              <Link to="/dashboard" className="navbar__link">My dashboard</Link>
              <button className="navbar__link navbar__link--btn" onClick={handleLogout}>
                Sign out
              </button>
              <Link to="/apartments" className="navbar__cta">Explore apartments</Link>
            </>
          )}
          {isAdmin && (
            <>
              <span className="navbar__username">{user?.first_name}</span>
              <Link to="/admin/dashboard" className="navbar__link">Admin</Link>
              <button className="navbar__link navbar__link--btn" onClick={handleLogout}>
                Sign out
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className={cn('navbar__toggle', mobileOpen && 'navbar__toggle--open')}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation menu" aria-expanded={mobileOpen}>
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="navbar__mobile-menu" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.path} to={link.path} end={link.path === '/'}
              className={({ isActive }) => cn('navbar__mobile-link', isActive && 'navbar__mobile-link--active')}>
              {link.label}
            </NavLink>
          ))}

          {!isAuthenticated && (
            <>
              <Link to="/login" className="navbar__mobile-link">Sign in</Link>
              <Link to="/register" className="navbar__mobile-cta">Create account</Link>
            </>
          )}
          {isTenant && (
            <>
              <Link to="/dashboard" className="navbar__mobile-link">My dashboard</Link>
              <Link to="/apartments" className="navbar__mobile-cta">Explore apartments</Link>
              <button className="navbar__mobile-link" onClick={handleLogout} style={{ textAlign: 'left' }}>
                Sign out
              </button>
            </>
          )}
          {isAdmin && (
            <>
              <Link to="/admin/dashboard" className="navbar__mobile-link">Admin dashboard</Link>
              <button className="navbar__mobile-link" onClick={handleLogout} style={{ textAlign: 'left' }}>
                Sign out
              </button>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
