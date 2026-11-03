import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

/**
 * Footer — public site footer.
 *
 * Per brand brief section 9.2:
 * - Midnight #14213D background, Cool Mist text
 * - Brand section: logo + short description
 * - Explore: Explore Apartments, About Us, Contact
 * - Information: FAQ, Privacy Policy, Terms and Conditions, Cookie Policy
 * - Contact: only verified business contact info (none invented)
 * - Social: only verified social links (none invented)
 * - Copyright strip: #0D1528 background, #98A2BD text
 *
 * NOTE: Contact info and social links are intentionally omitted per the
 * brand brief's instruction not to invent contact details or social accounts.
 * Placeholders are provided for the business owner to fill in.
 */
const EXPLORE_LINKS = [
  { label: 'Explore apartments', path: '/apartments' },
  { label: 'About us', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

const INFO_LINKS = [
  { label: 'Frequently asked questions', path: '/faq' },
  { label: 'Privacy policy', path: '/privacy' },
  { label: 'Terms and conditions', path: '/terms' },
  { label: 'Cookie policy', path: '/cookies' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="container footer__inner">
          {/* Brand section */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo" aria-label="The Homestead — Home">
              <Logo variant="light" />
            </Link>
            <p className="footer__description">
              The Homestead is an apartment discovery and rental enquiry
              platform that helps you find suitable apartments through
              attractive listings, clear property information and a
              straightforward enquiry process.
            </p>
          </div>

          {/* Explore links */}
          <nav className="footer__column" aria-label="Explore">
            <h4 className="footer__heading">Explore</h4>
            <ul className="footer__links">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Information links */}
          <nav className="footer__column" aria-label="Information">
            <h4 className="footer__heading">Information</h4>
            <ul className="footer__links">
              {INFO_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact section — only verified contact info */}
          <div className="footer__column">
            <h4 className="footer__heading">Contact</h4>
            <p className="footer__contact-note">
              Contact information will be displayed here once verified.
            </p>
            <Link to="/contact" className="footer__link">
              Visit contact page →
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright strip */}
      <div className="footer__copyright">
        <div className="container footer__copyright-inner">
          <p>© {year} The Homestead. All rights reserved.</p>
          <p>A place to call home.</p>
        </div>
      </div>
    </footer>
  );
}
