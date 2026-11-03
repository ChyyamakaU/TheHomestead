import { Link } from 'react-router-dom';

/**
 * AboutPage — explains what Homestead does.
 *
 * Per brand brief section 12.4:
 * - Communicate the brand's purpose
 * - Do not invent business history, achievements or claims
 */
export default function AboutPage() {
  return (
    <div className="about-page">
      <header className="page-header">
        <div className="page-header__inner">
          <h1>About Homestead</h1>
          <p className="page-header__sub">A place to call home.</p>
        </div>
      </header>

      <section className="section section--mist">
        <div className="container">
          <div className="about-page__content">
            <h2>What we do</h2>
            <p>
              The Homestead is an apartment discovery and rental enquiry platform
              that helps people find suitable apartments through attractive listings,
              clear property information and a straightforward enquiry process.
            </p>
            <p>
              Our goal is to make apartment browsing enjoyable and to help visitors
              feel confident about taking the next step towards finding a home.
            </p>

            <h2>Our purpose</h2>
            <p>
              We aim to provide a simple, convenient way to explore available apartments,
              review important property details, and submit enquiries — all in one place.
            </p>
            <p>
              Whether you're looking for a studio, a one-bedroom, or a larger space,
              Homestead is designed to help you find apartments that fit your lifestyle.
            </p>

            <h2>How it works</h2>
            <p>
              Browse available listings, view detailed property information including
              photographs, pricing, amenities and availability, then submit an
              application or request a viewing — no account required.
            </p>

            <div style={{ marginTop: 'var(--space-lg)' }}>
              <Link to="/apartments" className="btn btn--primary">
                Explore apartments →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
