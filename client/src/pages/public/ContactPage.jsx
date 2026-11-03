import { Link } from 'react-router-dom';

/**
 * ContactPage — provides verified business contact information.
 *
 * Per brand brief section 12.5:
 * - Provides verified business contact information
 * - Do not invent contact details
 *
 * NOTE: Contact information will be displayed here once verified by the
 * business owner. The page structure is ready for real data to be added.
 */
export default function ContactPage() {
  return (
    <div className="contact-page">
      <header className="page-header">
        <div className="page-header__inner">
          <h1>Contact</h1>
          <p className="page-header__sub">Get in touch with the Homestead team.</p>
        </div>
      </header>

      <section className="section section--mist">
        <div className="container">
          <div className="contact-page__content">
            <div className="contact-page__note">
              <p>
                Contact information will be displayed here once verified.
                This may include a phone number, email address, and office address.
              </p>
              <p>
                In the meantime, you can browse our{' '}
                <Link to="/apartments" style={{ color: 'var(--brass-dark)', textDecoration: 'underline' }}>
                  available apartments
                </Link>{' '}
                or check our{' '}
                <Link to="/faq" style={{ color: 'var(--brass-dark)', textDecoration: 'underline' }}>
                  frequently asked questions
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
