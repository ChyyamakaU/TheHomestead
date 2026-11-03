import { cn } from '../../utils/cn';

/**
 * FilterPanel — filter dropdowns for apartment browsing.
 *
 * Per brand brief section 12.2, visitors can filter by:
 * - Location (city)
 * - Apartment type
 * - Price range
 * - Number of bedrooms
 * - Availability
 *
 * @param {object} filters - current filter values
 * @param {object} options - available filter options from API
 * @param {function} onFilterChange - called with updated filter object
 */
export default function FilterPanel({ filters, options = {}, onFilterChange }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="filter-panel">
      {/* Location */}
      <div className="filter-panel__field">
        <label className="filter-panel__label" htmlFor="filter-city">Location</label>
        <select
          id="filter-city"
          className="filter-panel__select"
          value={filters.city || ''}
          onChange={(e) => handleChange('city', e.target.value || undefined)}
        >
          <option value="">All locations</option>
          {options.cities?.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Apartment type */}
      <div className="filter-panel__field">
        <label className="filter-panel__label" htmlFor="filter-type">Apartment type</label>
        <select
          id="filter-type"
          className="filter-panel__select"
          value={filters.apartment_type || ''}
          onChange={(e) => handleChange('apartment_type', e.target.value || undefined)}
        >
          <option value="">All types</option>
          {options.apartment_types?.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Bedrooms */}
      <div className="filter-panel__field">
        <label className="filter-panel__label" htmlFor="filter-bedrooms">Bedrooms</label>
        <select
          id="filter-bedrooms"
          className="filter-panel__select"
          value={filters.bedrooms ?? ''}
          onChange={(e) => handleChange('bedrooms', e.target.value || undefined)}
        >
          <option value="">Any</option>
          {options.bedrooms?.map((n) => (
            <option key={n} value={n}>{n} bedroom{n !== 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      {/* Min price */}
      <div className="filter-panel__field">
        <label className="filter-panel__label" htmlFor="filter-min-price">Min price</label>
        <input
          id="filter-min-price"
          type="number"
          className="filter-panel__input"
          placeholder="No min"
          value={filters.min_price || ''}
          onChange={(e) => handleChange('min_price', e.target.value || undefined)}
        />
      </div>

      {/* Max price */}
      <div className="filter-panel__field">
        <label className="filter-panel__label" htmlFor="filter-max-price">Max price</label>
        <input
          id="filter-max-price"
          type="number"
          className="filter-panel__input"
          placeholder="No max"
          value={filters.max_price || ''}
          onChange={(e) => handleChange('max_price', e.target.value || undefined)}
        />
      </div>

      {/* Availability */}
      <div className="filter-panel__field">
        <label className="filter-panel__label" htmlFor="filter-availability">Availability</label>
        <select
          id="filter-availability"
          className="filter-panel__select"
          value={filters.availability || ''}
          onChange={(e) => handleChange('availability', e.target.value || undefined)}
        >
          <option value="">Any availability</option>
          <option value="available">Available</option>
          <option value="occupied">Rented</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>
    </div>
  );
}
