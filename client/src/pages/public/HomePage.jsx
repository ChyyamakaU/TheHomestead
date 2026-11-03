import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ApartmentCard from '../../components/apartments/ApartmentCard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { getPublicApartments, getFilterOptions } from '../../api/public';
import heroBg from '../../assets/hero-bg.jpg';

/**
 * HomePage — the main discovery page.
 *
 * Per brand brief section 5:
 * 1. Hero section — headline, supporting text, search interface, photograph
 * 2. Featured apartments — "Find a place you'll love"
 * 3. Browse by apartment type
 * 4. Why choose Homestead
 * 5. How it works (3 steps)
 * 6. Closing call to action
 * 7. About Homestead introduction
 */
export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hero search state
  const [heroSearch, setHeroSearch] = useState({
    city: '',
    apartment_type: '',
    min_price: '',
    max_price: '',
  });

  useEffect(() => {
    // Fetch featured apartments (first 6 published) and filter options in parallel
    Promise.all([
      getPublicApartments({ limit: 6 }),
      getFilterOptions(),
    ])
      .then(([apartmentsData, filtersData]) => {
        setFeatured(apartmentsData.apartments || []);
        setCategories(filtersData.filters?.apartment_types || []);
      })
      .catch(() => {
        // Error state handled by empty featured array
      })
      .finally(() => setLoading(false));
  }, []);

  const handleHeroSearch = useCallback((e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (heroSearch.city) params.set('city', heroSearch.city);
    if (heroSearch.apartment_type) params.set('apartment_type', heroSearch.apartment_type);
    if (heroSearch.min_price) params.set('min_price', heroSearch.min_price);
    if (heroSearch.max_price) params.set('max_price', heroSearch.max_price);
    window.location.href = `/apartments?${params.toString()}`;
  }, [heroSearch]);

  return (
    <div className="home">
      {/* ─── HERO SECTION ─────────────────────────────────── */}
      <section className="hero">
        <div className="hero__bg" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="hero__overlay" />
        <div className="container hero__content">
          <h1 className="hero-heading">A place to call home.</h1>
          <p className="hero__intro text-intro">
            Discover apartments that fit your lifestyle. Find your space,
            explore your options and take the next step towards home.
          </p>

          {/* Search interface */}
          <form className="hero-search" onSubmit={handleHeroSearch}>
            <div className="hero-search__grid">
              <div className="hero-search__field">
                <label className="hero-search__label" htmlFor="hero-city">Location</label>
                <input
                  id="hero-city"
                  type="text"
                  className="hero-search__input"
                  placeholder="City or state"
                  value={heroSearch.city}
                  onChange={(e) => setHeroSearch((s) => ({ ...s, city: e.target.value }))}
                />
              </div>
              <div className="hero-search__field">
                <label className="hero-search__label" htmlFor="hero-type">Apartment type</label>
                <select
                  id="hero-type"
                  className="hero-search__select"
                  value={heroSearch.apartment_type}
                  onChange={(e) => setHeroSearch((s) => ({ ...s, apartment_type: e.target.value }))}
                >
                  <option value="">Any type</option>
                  {categories.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="hero-search__field">
                <label className="hero-search__label" htmlFor="hero-min">Min price</label>
                <input
                  id="hero-min"
                  type="number"
                  className="hero-search__input"
                  placeholder="No min"
                  value={heroSearch.min_price}
                  onChange={(e) => setHeroSearch((s) => ({ ...s, min_price: e.target.value }))}
                />
              </div>
              <div className="hero-search__field">
                <label className="hero-search__label" htmlFor="hero-max">Max price</label>
                <input
                  id="hero-max"
                  type="number"
                  className="hero-search__input"
                  placeholder="No max"
                  value={heroSearch.max_price}
                  onChange={(e) => setHeroSearch((s) => ({ ...s, max_price: e.target.value }))}
                />
              </div>
              <button type="submit" className="hero-search__btn">Search</button>
            </div>
          </form>

          <div className="hero__actions">
            <Link to="/apartments" className="btn btn--brass btn--lg">Explore apartments</Link>
            <a href="#how-it-works" className="hero__secondary-link">How it works</a>
          </div>
        </div>
      </section>

      {/* ─── FEATURED APARTMENTS ──────────────────────────── */}
      <section className="section section--mist">
        <div className="container">
          <div className="section-heading">
            <h2>Find a place you'll love.</h2>
            <p className="text-intro section-heading__sub">
              Explore our selection of available apartments.
            </p>
          </div>

          {loading ? (
            <div className="page-loader"><Spinner size={40} /></div>
          ) : featured.length > 0 ? (
            <>
              <div className="apartment-grid">
                {featured.map((apt) => (
                  <ApartmentCard key={apt.id} apartment={apt} />
                ))}
              </div>
              <div className="section-heading__link">
                <Link to="/apartments" className="btn btn--secondary">
                  View all apartments →
                </Link>
              </div>
            </>
          ) : (
            <EmptyState
              title="No apartments yet"
              message="Apartments will appear here once they are listed and published."
            />
          )}
        </div>
      </section>

      {/* ─── BROWSE BY APARTMENT TYPE ────────────────────── */}
      {categories.length > 0 && (
        <section className="section section--greige">
          <div className="container">
            <div className="section-heading">
              <h2>Browse by apartment type</h2>
              <p className="text-intro section-heading__sub">
                Explore apartments by category to find what suits you.
              </p>
            </div>
            <div className="category-grid">
              {categories.map((type) => (
                <Link
                  key={type}
                  to={`/apartments?apartment_type=${encodeURIComponent(type)}`}
                  className="category-card"
                >
                  <span className="category-card__icon" aria-hidden="true"> home</span>
                  <span className="category-card__label">{type}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── WHY CHOOSE HOMESTEAD ────────────────────────── */}
      <section className="section section--mist-light">
        <div className="container">
          <div className="section-heading">
            <h2>Why choose Homestead?</h2>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-card__icon" aria-hidden="true"> home</div>
              <h3 className="feature-card__title">Easy apartment discovery</h3>
              <p className="feature-card__text">
                Find apartments and explore available options in one place.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">✦</div>
              <h3 className="feature-card__title">Clear property information</h3>
              <p className="feature-card__text">
                Review important details before making an enquiry.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-card__icon" aria-hidden="true">✎</div>
              <h3 className="feature-card__title">Convenient enquiries</h3>
              <p className="feature-card__text">
                Apply for an apartment or request a viewing without unnecessary complications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────── */}
      <section className="section section--mist" id="how-it-works">
        <div className="container">
          <div className="section-heading">
            <h2>How it works</h2>
            <p className="text-intro section-heading__sub">
              Finding your next home is simple.
            </p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <span className="step-card__number">1</span>
              <h3 className="step-card__title">Explore apartments</h3>
              <p className="step-card__text">
                Browse available listings and find properties that interest you.
              </p>
            </div>
            <div className="step-card">
              <span className="step-card__number">2</span>
              <h3 className="step-card__title">View the details</h3>
              <p className="step-card__text">
                Check the price, location, features and availability.
              </p>
            </div>
            <div className="step-card">
              <span className="step-card__number">3</span>
              <h3 className="step-card__title">Take the next step</h3>
              <p className="step-card__text">
                Submit an application or request a viewing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CLOSING CTA ─────────────────────────────────── */}
      <section className="section section--midnight closing-cta">
        <div className="container closing-cta__inner">
          <h2 className="closing-cta__heading">Your next home could be right here.</h2>
          <p className="closing-cta__text">
            Explore available apartments and take the first step towards finding a place you'll love.
          </p>
          <Link to="/apartments" className="btn btn--brass btn--lg">Explore apartments</Link>
        </div>
      </section>

      {/* ─── ABOUT INTRO ─────────────────────────────────── */}
      <section className="section section--mist-light">
        <div className="container about-intro">
          <div className="about-intro__content">
            <h2>About Homestead</h2>
            <p className="text-intro">
              The Homestead is an apartment discovery and rental enquiry platform
              that helps people find suitable apartments through attractive listings,
              clear property information and a straightforward enquiry process.
            </p>
            <p className="about-intro__text">
              Our goal is to make apartment browsing enjoyable and to help you feel
              confident about taking the next step towards finding a home.
            </p>
            <Link to="/about" className="about-intro__link">
              Learn more about us →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
