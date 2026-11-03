import { cn } from '../../utils/cn';

/**
 * Pagination — accessible page navigation.
 * Renders Prev / page numbers / Next with proper aria labels.
 */
export default function Pagination({ pagination, onPageChange, className }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, hasNextPage, hasPrevPage } = pagination;

  // Build page number array with ellipsis for large page counts
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav className={cn('pagination', className)} aria-label="Pagination">
      <button
        className="pagination__btn"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevPage}
        aria-label="Previous page"
      >
        ← Prev
      </button>
      {start > 1 && (
        <>
          <button className="pagination__btn" onClick={() => onPageChange(1)}>
            1
          </button>
          {start > 2 && <span className="pagination__ellipsis">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          className={cn('pagination__btn', p === page && 'pagination__btn--active')}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pagination__ellipsis">…</span>}
          <button className="pagination__btn" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}
      <button
        className="pagination__btn"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
