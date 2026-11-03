import { useState, useCallback } from 'react';

/**
 * SearchBar — text search input with submit.
 * Used on the apartments list page and hero section.
 */
export default function SearchBar({ initialValue = '', onSearch, placeholder = 'Search apartments...' }) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSearch(value);
  }, [value, onSearch]);

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <input
        type="text"
        className="search-bar__input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search apartments"
      />
      <button type="submit" className="search-bar__btn">Search</button>
    </form>
  );
}
