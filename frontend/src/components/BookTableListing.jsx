import { RefreshCw } from 'lucide-react';
import SimpleBookTable from './SimpleBookTable';

function BookTableListing({
  books,
  page,
  pagination,
  loading,
  loadError,
  hasFilters,
  onPageChange,
  onRefresh,
}) {
  const totalItems = pagination.totalItems || 0;

  return (
    <section className="book-list" aria-label="Book listing">
      <div className="book-list__header">
        <div>
          <span className="book-list__heading">Book records</span>
          <span className="book-list__subheading">
            {loading ? 'Updating list' : `${totalItems} ${totalItems === 1 ? 'book' : 'books'}`}
          </span>
        </div>
        <button
          className={`icon-button refresh-button ${loading ? 'is-spinning' : ''}`}
          type="button"
          title="Refresh list"
          aria-label="Refresh list"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <SimpleBookTable
        books={books}
        page={page}
        pagination={pagination}
        loading={loading}
        loadError={loadError}
        hasFilters={hasFilters}
        onPageChange={onPageChange}
      />
    </section>
  );
}

export default BookTableListing;