import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import Logo from '../ui/Logo';

/**
 * Navbar — public site navigation.
 *
 * Per brand brief:
 * - Midnight #14213D background
 * - Logo + nav links (Home, Apartments, About Us, Contact)
 * - Brass "Explore Apartments" CTA button
 * - Active/hover states in Brass #C9A24D
 * - Sticky on scroll with subtle shadow
 * - No public admin login link
 * - Mobile: hamburger menu
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Add shadow on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn('navbar', scrolled && 'navbar--scrolled')}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo" aria-label="The Homestead — Home">
          <Logo variant="light" />
        </Link>

        {/* Desktop nav */}
        <nav className="navbar__links" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                cn('navbar__link', isActive && 'navbar__link--active')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/apartments" className="navbar__cta">
          Explore apartments
        </Link>

        {/* Mobile menu toggle */}
        <button
          className={cn('navbar__toggle', mobileOpen && 'navbar__toggle--open')}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="navbar__mobile-menu" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                cn('navbar__mobile-link', isActive && 'navbar__mobile-link--active')
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link to="/apartments" className="navbar__mobile-cta">
            Explore apartments
          </Link>
        </nav>
      )}
    </header>
  );
}
