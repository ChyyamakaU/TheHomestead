import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ApartmentCard from '../../components/apartments/ApartmentCard';
import SearchBar from '../../components/search/SearchBar';
import FilterPanel from '../../components/search/FilterPanel';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { getPublicApartments, getFilterOptions } from '../../api/public';

/**
 * ApartmentsPage — searchable, filterable apartment listings.
 *
 * Per brand brief section 12.2:
 * - Filter by location, apartment type, price range, bedrooms, availability
 * - Only published listings visible
 */
export default function ApartmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [apartments, setApartments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({});
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  // Initialize filters from URL search params
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    setFilters({
      city: params.city || '',
      apartment_type: params.apartment_type || '',
      bedrooms: params.bedrooms || '',
      min_price: params.min_price || '',
      max_price: params.max_price || '',
      availability: params.availability || '',
      search: params.search || '',
    });
    setSearchValue(params.search || '');
    fetchApartments(params);
    getFilterOptions()
      .then((data) => setOptions(data.filters || {}))
      .catch(() => {});
  }, [searchParams]);

  const fetchApartments = useCallback(async (params) => {
    setLoading(true);
    try {
      const data = await getPublicApartments({
        page: params.page || 1,
        limit: 9,
        ...params,
      });
      setApartments(data.apartments || []);
      setPagination(data.pagination);
    } catch {
      setApartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = { ...newFilters, search: searchValue };
    // Remove empty values
    Object.keys(params).forEach((k) => {
      if (!params[k]) delete params[k];
    });
    setSearchParams(params);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    const params = { ...filters, search: value };
    Object.keys(params).forEach((k) => {
      if (!params[k]) delete params[k];
    });
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    const params = { ...filters, search: searchValue, page };
    Object.keys(params).forEach((k) => {
      if (!params[k]) delete params[k];
    });
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchValue('');
    setSearchParams({});
  };

  const hasFilters = Object.values(filters).some((v) => v) || searchValue;

  return (
    <div className="apartments-page">
      {/* Page header */}
      <header className="page-header">
        <div className="page-header__inner">
          <h1>Apartments</h1>
          <p className="page-header__sub">
            Browse our available apartments and find your next home.
          </p>
        </div>
      </header>

      <section className="section section--mist">
        <div className="container">
          {/* Search bar */}
          <div className="apartments-page__bar">
            <SearchBar initialValue={searchValue} onSearch={handleSearch} />
          </div>

          {/* Filters */}
          <div className="apartments-page__filters">
            <FilterPanel filters={filters} options={options} onFilterChange={handleFilterChange} />
          </div>

          {/* Results bar */}
          <div className="apartments-page__results-bar">
            <span className="apartments-page__count">
              {loading
                ? 'Loading...'
                : `${pagination?.total || 0} apartment${pagination?.total !== 1 ? 's' : ''} found`}
            </span>
            {hasFilters && (
              <button className="apartments-page__clear" onClick={handleClearFilters}>
                Clear all filters
              </button>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="page-loader"><Spinner size={40} /></div>
          ) : apartments.length > 0 ? (
            <>
              <div className="apartment-grid">
                {apartments.map((apt) => (
                  <ApartmentCard key={apt.id} apartment={apt} />
                ))}
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div style={{ marginTop: 'var(--space-lg)' }}>
                  <Pagination pagination={pagination} onPageChange={handlePageChange} />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="No apartments found"
              message={hasFilters
                ? "No apartments match your search criteria. Try adjusting your filters."
                : "Apartments will appear here once they are listed and published."
              }
              action={hasFilters && (
                <button className="btn btn--secondary" onClick={handleClearFilters}>
                  Clear filters
                </button>
              )}
            />
          )}
        </div>
      </section>
    </div>
  );
}
