import { useEffect, useState } from 'react';
import { BookOpen, CircleAlert, List, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookFilter from '../components/BookFilter';
import BookTableListing from '../components/BookTableListing';
import { getBooks } from '../services/booksApi';

const PAGE_SIZE = 10;
const defaultPagination = { page: 1, limit: PAGE_SIZE, totalItems: 0, totalPages: 0 };

function BookListingPage() {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState(defaultPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');

      try {
        const payload = await getBooks({
          page,
          limit: PAGE_SIZE,
          sort: 'name',
          search: search.trim(),
          signal: controller.signal,
        });

        const nextBooks = Array.isArray(payload.data) ? payload.data : [];
        if (nextBooks.length === 0 && page > 1) {
          setBooks([]);
          setPage((currentPage) => Math.max(1, currentPage - 1));
          return;
        }

        setBooks(nextBooks);
        setPagination(payload.pagination || defaultPagination);
        setApiOnline(true);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setLoadError(error.message || 'Could not connect to the Book API.');
          setApiOnline(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, search.trim() ? 250 : 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [page, search, reloadKey]);

  function changePage(nextPage) {
    setPage(nextPage);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="Fieldnotes home">
          <span className="brand__mark"><BookOpen size={21} strokeWidth={1.8} /></span>
          <span className="brand__name">fieldnotes<span>.</span></span>
        </Link>

        <div className="sidebar__section-label">LIBRARY</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <Link className="sidebar-nav__item" to="/">
            <BookOpen size={17} />
            <span>All books</span>
            <span className="sidebar-nav__count">{pagination.totalItems}</span>
          </Link>
          <Link className="sidebar-nav__item sidebar-nav__item--active" to="/books/table" aria-current="page">
            <List size={17} />
            <span>Simple table</span>
          </Link>
        </nav>

        <div className="sidebar__bottom">
          <div className="connection-card">
            <span className={`connection-dot ${apiOnline === false ? 'connection-dot--offline' : ''}`} />
            <div>
              <span className="connection-card__label">BOOK API</span>
              <span className="connection-card__state">
                {apiOnline === null ? 'Checking connection' : apiOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
            <button
              className="icon-button icon-button--subtle connection-card__refresh"
              type="button"
              title="Refresh book list"
              aria-label="Refresh book list"
              onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            >
              <RefreshCw size={15} />
            </button>
          </div>
          <div className="sidebar__footer">A considered collection</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-heading">
          <div>
            <div className="eyebrow">COLLECTION <span>/</span> TABLE LIST</div>
            <div className="page-heading__title-row">
              <h1>Book list</h1>
              <span className="title-count">{pagination.totalItems} titles</span>
            </div>
            <p className="page-heading__subtitle">A straightforward table of your book records.</p>
          </div>
          <div className="page-heading__actions">
            <Link className="btn btn-view-toggle" to="/" aria-label="Return to DataTable inventory">
              <List size={16} />
              <span>DataTable view</span>
            </Link>
          </div>
        </header>

        {loadError && (
          <div className="api-alert" role="alert">
            <CircleAlert size={19} />
            <div className="api-alert__copy">
              <strong>Could not load the collection</strong>
              <span>{loadError}</span>
            </div>
            <button className="btn btn-sm btn-outline-dark ms-auto" type="button" onClick={() => setReloadKey((currentKey) => currentKey + 1)}>
              Retry
            </button>
          </div>
        )}

        <BookFilter
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
        <BookTableListing
          books={books}
          page={page}
          pagination={pagination}
          loading={loading}
          loadError={loadError}
          hasFilters={Boolean(search.trim())}
          onPageChange={changePage}
          onRefresh={() => setReloadKey((currentKey) => currentKey + 1)}
        />
      </main>
    </div>
  );
}

export default BookListingPage;