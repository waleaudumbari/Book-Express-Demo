import { Search, X } from 'lucide-react';

function BookFilter({ search, onSearchChange }) {
  return (
    <section className="collection-toolbar" aria-label="Book list controls">
      <label className="search-box">
        <Search size={18} aria-hidden="true" />
        <span className="visually-hidden">Search books</span>
        <input
          type="search"
          placeholder="Search title, author, or category"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {search && (
          <button
            className="search-box__clear"
            type="button"
            title="Clear search"
            aria-label="Clear search"
            onClick={() => onSearchChange('')}
          >
            <X size={15} />
          </button>
        )}
      </label>
    </section>
  );
}

export default BookFilter;