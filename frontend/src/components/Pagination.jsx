import { ChevronLeft, ChevronRight } from 'lucide-react';

function Pagination({ page, pageSize = 10, totalItems = 0, loading = false, onPageChange }) {
  const normalizedPageSize = Math.max(Number(pageSize) || 10, 1);
  const totalPages = Math.max(Math.ceil(totalItems / normalizedPageSize), 1);
  const firstResult = totalItems === 0 ? 0 : (page - 1) * normalizedPageSize + 1;
  const lastResult = Math.min(page * normalizedPageSize, totalItems);

  return (
    <nav className="pagination-bar" aria-label="Pagination">
      <span>Showing <strong>{firstResult}-{lastResult}</strong> of <strong>{totalItems}</strong></span>
      <div className="pagination-bar__controls">
        <span>Page {page} of {totalPages}</span>
        <button
          className="icon-button"
          type="button"
          title="Previous page"
          aria-label="Previous page"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft size={17} />
        </button>
        <button
          className="icon-button"
          type="button"
          title="Next page"
          aria-label="Next page"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;