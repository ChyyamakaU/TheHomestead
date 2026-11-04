/**
 * Format a numeric price into a Nigerian Naira currency string.
 * @param {number} amount
 * @param {string} [period] - optional payment period suffix (e.g. "per year")
 * @returns {string}
 */
export function formatPrice(amount, period) {
  if (amount == null || isNaN(amount)) return '—';
  const formatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
  return period ? `${formatted} ${period}` : formatted;
}

/**
 * Format an ISO date string into a human-readable date (e.g. "Nov 3, 2026").
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an ISO date string into date + time (e.g. "Nov 3, 2026, 10:24 AM").
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Return a relative time string (e.g. "2 hours ago", "3 days ago").
 * @param {string} dateStr
 * @returns {string}
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';

  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(dateStr);
}

/**
 * Capitalise the first letter of each word.
 * @param {string} str
 * @returns {string}
 */
export function titleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert a string to a URL-friendly slug.
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text to a max length, appending an ellipsis.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 120) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + '…';
}

/**
 * Build a comma-separated location string from city and state.
 * @param {object} apartment
 * @returns {string}
 */
export function formatLocation(apartment) {
  if (!apartment) return '';
  return [apartment.city, apartment.state].filter(Boolean).join(', ');
}

/**
 * Get the primary image URL for an apartment, or a fallback.
 * @param {object} apartment
 * @returns {string|null}
 */
export function getPrimaryImage(apartment) {
  if (!apartment?.images?.length) return null;
  const primary = apartment.images.find((img) => img.is_primary);
  return (primary || apartment.images[0]).url;
}

/**
 * Extract an Axios error message from an API error response.
 * @param {Error} error
 * @returns {string}
 */
export function getApiErrorMessage(error) {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.errors?.length) return error.response.data.errors[0];
  if (error?.message) return error.message;
  return 'An unexpected error occurred.';
}

/**
 * Build the full image URL for a relative path returned by the API.
 * In dev the Vite proxy serves /uploads/* from the backend directly,
 * so we just return the path as-is for relative /uploads paths.
 * @param {string} url
 * @returns {string}
 */
export function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  // In production override with VITE_API_URL base if set
  const base = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : '';
  return `${base}${url}`;
}
