import { useEffect, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';

const API_URL = '/api/v1/books';
const PAGE_SIZE = 10;
const blankBook = { name: '', category: '', price: '', author: '', image: '' };
const defaultPagination = {
  page: 1,
  limit: PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
};

function getErrorMessage(payload, fallback) {
  return payload?.error?.message || payload?.message || fallback;
}

async function readResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function BookCover({ book, index }) {
  return (
    <div className={`book-cover book-cover--${index % 4}`}>
      <div className="book-cover__fallback" aria-hidden="true">
        <BookOpen size={19} strokeWidth={1.6} />
      </div>
      {book.image && (
        <img
          src={book.image}
          alt={`${book.name} cover`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
    </div>
  );
}

function App() {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState(defaultPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(blankBook);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort,
    });

    if (search.trim()) params.set('search', search.trim());
    if (category.trim()) params.set('category', category.trim());
    if (author.trim()) params.set('author', author.trim());
    if (minPrice !== '') params.set('minPrice', minPrice);
    if (maxPrice !== '') params.set('maxPrice', maxPrice);

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');

      try {
        const response = await fetch(`${API_URL}?${params}`, {
          signal: controller.signal,
        });
        const payload = await readResponse(response);

        if (!response.ok) {
          throw new Error(getErrorMessage(payload, `Book API request failed (${response.status}).`));
        }

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
  }, [page, search, category, author, minPrice, maxPrice, sort, reloadKey]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeoutId = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (!dialog) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving && !deleting) setDialog(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, saving, deleting]);

  const activeFilterCount = [category, author, minPrice, maxPrice].filter(Boolean).length;
  const totalPages = Math.max(pagination.totalPages || 0, 1);
  const firstResult = pagination.totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(page * PAGE_SIZE, pagination.totalItems || 0);

  function resetPage() {
    setPage(1);
  }

  function openCreateDialog() {
    setForm(blankBook);
    setFormError('');
    setDialog({ type: 'create' });
  }

  function openEditDialog(book) {
    setForm({
      name: book.name || '',
      category: book.category || '',
      price: String(book.price ?? ''),
      author: book.author || '',
      image: book.image || '',
    });
    setFormError('');
    setDialog({ type: 'edit', book });
  }

  function clearFilters() {
    setCategory('');
    setAuthor('');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    setSort('-createdAt');
    setPage(1);
  }

  async function saveBook(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      author: form.author.trim(),
      image: form.image.trim(),
    };

    try {
      const isEdit = dialog.type === 'edit';
      const response = await fetch(
        isEdit ? `${API_URL}/${dialog.book._id}` : API_URL,
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const result = response.status === 204 ? {} : await readResponse(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(result, `Could not save this book (${response.status}).`));
      }

      setDialog(null);
      setToast(isEdit ? 'Book details updated' : 'Book added to the collection');
      setPage(1);
      setReloadKey((currentKey) => currentKey + 1);
    } catch (error) {
      setFormError(error.message || 'Could not save this book.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteBook() {
    if (!dialog?.book) return;
    setDeleting(true);
    setFormError('');

    try {
      const response = await fetch(`${API_URL}/${dialog.book._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await readResponse(response);
        throw new Error(getErrorMessage(result, `Could not delete this book (${response.status}).`));
      }

      setDialog(null);
      setToast('Book removed from the collection');
      setReloadKey((currentKey) => currentKey + 1);
    } catch (error) {
      setFormError(error.message || 'Could not delete this book.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#collection" aria-label="Fieldnotes home">
          <span className="brand__mark"><BookOpen size={21} strokeWidth={1.8} /></span>
          <span className="brand__name">fieldnotes<span>.</span></span>
        </a>

        <div className="sidebar__section-label">LIBRARY</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <a className="sidebar-nav__item sidebar-nav__item--active" href="#collection">
            <BookOpen size={17} />
            <span>All books</span>
            <span className="sidebar-nav__count">{pagination.totalItems}</span>
          </a>
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

      <main className="main-content" id="collection">
        <header className="page-heading">
          <div>
            <div className="eyebrow">COLLECTION <span>/</span> MANAGEMENT</div>
            <div className="page-heading__title-row">
              <h1>Book inventory</h1>
              <span className="title-count">{pagination.totalItems} titles</span>
            </div>
            <p className="page-heading__subtitle">Keep every title, author, and detail in its place.</p>
          </div>
          <button className="btn btn-add-book" type="button" onClick={openCreateDialog}>
            <Plus size={17} strokeWidth={2.2} />
            <span>Add a book</span>
          </button>
        </header>

        {loadError && (
          <div className="api-alert" role="alert">
            <CircleAlert size={19} />
            <div className="api-alert__copy">
              <strong>Could not load the collection</strong>
              <span>{loadError}</span>
            </div>
            <button
              className="btn btn-sm btn-outline-dark ms-auto"
              type="button"
              onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            >
              Retry
            </button>
          </div>
        )}

        <section className="collection-toolbar" aria-label="Book list controls">
          <label className="search-box">
            <Search size={18} aria-hidden="true" />
            <span className="visually-hidden">Search books</span>
            <input
              type="search"
              placeholder="Search title, author, or category"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPage();
              }}
            />
            {search && (
              <button
                className="search-box__clear"
                type="button"
                title="Clear search"
                aria-label="Clear search"
                onClick={() => setSearch('')}
              >
                <X size={15} />
              </button>
            )}
          </label>

          <button
            className={`filter-button ${filtersOpen || activeFilterCount ? 'filter-button--active' : ''}`}
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
            {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
          </button>

          <label className="sort-control">
            <span>Sort</span>
            <select
              className="form-select"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                resetPage();
              }}
              aria-label="Sort books"
            >
              <option value="-createdAt">Recently added</option>
              <option value="name">Title: A to Z</option>
              <option value="-name">Title: Z to A</option>
              <option value="author">Author: A to Z</option>
              <option value="price">Price: low to high</option>
              <option value="-price">Price: high to low</option>
            </select>
          </label>
        </section>

        {filtersOpen && (
          <section className="filter-panel" aria-label="Filter books">
            <label className="filter-field">
              <span>Category</span>
              <input
                className="form-control"
                type="text"
                placeholder="Any category"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  resetPage();
                }}
              />
            </label>
            <label className="filter-field">
              <span>Author</span>
              <input
                className="form-control"
                type="text"
                placeholder="Any author"
                value={author}
                onChange={(event) => {
                  setAuthor(event.target.value);
                  resetPage();
                }}
              />
            </label>
            <label className="filter-field">
              <span>Minimum price</span>
              <input
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                placeholder="No minimum"
                value={minPrice}
                onChange={(event) => {
                  setMinPrice(event.target.value);
                  resetPage();
                }}
              />
            </label>
            <label className="filter-field">
              <span>Maximum price</span>
              <input
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                placeholder="No maximum"
                value={maxPrice}
                onChange={(event) => {
                  setMaxPrice(event.target.value);
                  resetPage();
                }}
              />
            </label>
            <button className="clear-filters" type="button" onClick={clearFilters}>
              Clear all
            </button>
          </section>
        )}

        <section className="book-list" aria-label="Books">
          <div className="book-list__header">
            <div>
              <span className="book-list__heading">Your collection</span>
              <span className="book-list__subheading">
                {loading ? 'Updating list' : `${pagination.totalItems} ${pagination.totalItems === 1 ? 'book' : 'books'}`}
              </span>
            </div>
            <button
              className={`icon-button refresh-button ${loading ? 'is-spinning' : ''}`}
              type="button"
              title="Refresh list"
              aria-label="Refresh list"
              onClick={() => setReloadKey((currentKey) => currentKey + 1)}
              disabled={loading}
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="table book-table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">BOOK</th>
                  <th scope="col">AUTHOR</th>
                  <th scope="col">CATEGORY</th>
                  <th scope="col">PRICE</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {loading && books.length === 0 && (
                  <tr>
                    <td className="table-message" colSpan="5">
                      <LoaderCircle className="spin-icon" size={22} />
                      <span>Gathering your books...</span>
                    </td>
                  </tr>
                )}
                {!loading && loadError && books.length === 0 && (
                  <tr>
                    <td className="table-message" colSpan="5">
                      Book list is unavailable until the API reconnects.
                    </td>
                  </tr>
                )}
                {!loading && !loadError && books.length === 0 && (
                  <tr>
                    <td className="table-message table-message--empty" colSpan="5">
                      <span className="empty-mark"><BookOpen size={23} /></span>
                      <strong>{search || activeFilterCount ? 'No matching books' : 'Your collection is waiting'}</strong>
                      <span>{search || activeFilterCount ? 'Adjust the search or filters and try again.' : 'Add a book to begin your inventory.'}</span>
                      {!(search || activeFilterCount) && (
                        <button className="btn btn-add-book btn-add-book--small" type="button" onClick={openCreateDialog}>
                          <Plus size={16} /> Add a book
                        </button>
                      )}
                    </td>
                  </tr>
                )}
                {books.map((book, index) => (
                  <tr key={book._id}>
                    <td>
                      <div className="book-cell">
                        <BookCover book={book} index={index} />
                        <div className="book-cell__details">
                          <strong>{book.name}</strong>
                          <span className="book-cell__mobile-author">{book.author}</span>
                        </div>
                      </div>
                    </td>
                    <td className="author-cell">{book.author}</td>
                    <td><span className="category-label">{book.category}</span></td>
                    <td className="price-cell">${Number(book.price).toFixed(2)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          type="button"
                          title={`Edit ${book.name}`}
                          aria-label={`Edit ${book.name}`}
                          onClick={() => openEditDialog(book)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button icon-button--danger"
                          type="button"
                          title={`Delete ${book.name}`}
                          aria-label={`Delete ${book.name}`}
                          onClick={() => {
                            setFormError('');
                            setDialog({ type: 'delete', book });
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="list-footer">
            <span>Showing <strong>{firstResult}-{lastResult}</strong> of <strong>{pagination.totalItems}</strong></span>
            <div className="pagination-controls">
              <span>Page {page} of {totalPages}</span>
              <button
                className="icon-button"
                type="button"
                title="Previous page"
                aria-label="Previous page"
                disabled={page <= 1 || loading}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                className="icon-button"
                type="button"
                title="Next page"
                aria-label="Next page"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </footer>
        </section>
      </main>

      {toast && (
        <div className="toast-message" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button className="toast-message__close" type="button" title="Dismiss" aria-label="Dismiss notification" onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}

      {dialog && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving && !deleting) setDialog(null);
          }}
        >
          <section className="book-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <header className="book-dialog__header">
              <div>
                <div className="eyebrow">COLLECTION</div>
                <h2 id="dialog-title">
                  {dialog.type === 'create' ? 'Add a book' : dialog.type === 'edit' ? 'Edit book details' : 'Remove this book?'}
                </h2>
              </div>
              <button className="icon-button" type="button" title="Close dialog" aria-label="Close dialog" onClick={() => setDialog(null)} disabled={saving || deleting}>
                <X size={18} />
              </button>
            </header>

            {dialog.type === 'delete' ? (
              <div className="delete-confirmation">
                <p><strong>{dialog.book.name}</strong> will be removed from your collection.</p>
                {formError && <div className="form-error" role="alert"><CircleAlert size={16} />{formError}</div>}
                <div className="dialog-actions">
                  <button className="btn btn-light" type="button" onClick={() => setDialog(null)} disabled={deleting}>Cancel</button>
                  <button className="btn btn-delete" type="button" onClick={deleteBook} disabled={deleting}>
                    {deleting ? <LoaderCircle className="spin-icon" size={16} /> : <Trash2 size={16} />}
                    Remove book
                  </button>
                </div>
              </div>
            ) : (
              <form className="book-form" onSubmit={saveBook}>
                <div className="form-field">
                  <label htmlFor="book-name">Book name</label>
                  <input id="book-name" className="form-control" type="text" maxLength="200" autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="book-author">Author</label>
                    <input id="book-author" className="form-control" type="text" maxLength="120" required value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="book-category">Category</label>
                    <input id="book-category" className="form-control" type="text" maxLength="100" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="book-price">Price</label>
                    <div className="price-input-wrap">
                      <span>$</span>
                      <input id="book-price" className="form-control" type="number" min="0.01" step="0.01" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="book-image">Cover image URL</label>
                    <input id="book-image" className="form-control" type="url" placeholder="https://" required value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />
                  </div>
                </div>
                {formError && <div className="form-error" role="alert"><CircleAlert size={16} />{formError}</div>}
                <div className="dialog-actions">
                  <button className="btn btn-light" type="button" onClick={() => setDialog(null)} disabled={saving}>Cancel</button>
                  <button className="btn btn-add-book" type="submit" disabled={saving}>
                    {saving ? <LoaderCircle className="spin-icon" size={16} /> : <Check size={16} />}
                    {saving ? 'Saving...' : dialog.type === 'edit' ? 'Save changes' : 'Add to collection'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;