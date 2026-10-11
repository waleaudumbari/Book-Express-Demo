import { useEffect, useState } from 'react';
import {
  ArrowUpDown,
  BookOpen,
  Check,
  CircleAlert,
  LoaderCircle,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { Link } from 'react-router-dom';
import DataTablePaginationAdapter from './components/DataTablePaginationAdapter';
import { createBook, deleteBook, getBooks, updateBook } from './services/booksApi';

const PAGE_SIZE = 10;
const blankBook = { name: '', category: '', price: '', author: '', image: '' };
const defaultPagination = {
  page: 1,
  limit: PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
};
const dataTableStyles = {
  table: { style: { minWidth: '660px', backgroundColor: 'transparent' } },
  responsiveWrapper: { style: { overflowX: 'auto' } },
  headRow: {
    style: {
      minHeight: '39px',
      borderBottom: '1px solid #e8e6dc',
      backgroundColor: '#faf9f4',
    },
  },
  headCells: {
    style: {
      paddingLeft: '13px',
      paddingRight: '13px',
      color: '#858a80',
      fontSize: '9px',
      fontWeight: '700',
      letterSpacing: '.1em',
    },
  },
  rows: {
    style: { minHeight: '79px', backgroundColor: '#fffefa' },
    highlightOnHoverStyle: { backgroundColor: '#fdfcf7' },
  },
  cells: {
    style: {
      padding: '9px 13px',
      color: '#4a5049',
      fontSize: '12px',
    },
  },
  pagination: {
    style: {
      minHeight: '54px',
      padding: '0 12px',
      borderTop: '1px solid #e8e6dc',
      backgroundColor: '#fffefa',
      color: '#878b82',
      fontSize: '10px',
    },
    pageButtonsStyle: {
      height: '30px',
      width: '30px',
      padding: '5px',
      borderRadius: '5px',
      color: '#687068',
      fill: '#687068',
    },
  },
  noData: { style: { padding: '0', color: '#858a80' } },
};

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
  const [paginationReset, setPaginationReset] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('name');
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

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setLoadError('');

      try {
        const payload = await getBooks({
          page,
          limit: PAGE_SIZE,
          sort,
          search: search.trim(),
          category: category.trim(),
          author: author.trim(),
          minPrice,
          maxPrice,
          signal: controller.signal,
        });

        const nextBooks = Array.isArray(payload.data) ? payload.data : [];
        if (nextBooks.length === 0 && page > 1) {
          setBooks([]);
          changePage(Math.max(1, page - 1));
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
  function changePage(nextPage) {
    setPage(nextPage);
    setPaginationReset((currentValue) => !currentValue);
  }

  function resetPage() {
    changePage(1);
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
    setSort('name');
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
      if (isEdit) await updateBook(dialog.book._id, payload);
      else await createBook(payload);

      setDialog(null);
      setToast(isEdit ? 'Book details updated' : 'Book added to the collection');
      changePage(1);
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
      await deleteBook(dialog.book._id);

      setDialog(null);
      setToast('Book removed from the collection');
      setReloadKey((currentKey) => currentKey + 1);
    } catch (error) {
      setFormError(error.message || 'Could not delete this book.');
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      id: 'name',
      name: 'BOOK',
      selector: (book) => book.name,
      sortField: 'name',
      sortable: true,
      minWidth: '250px',
      cell: (book, rowIndex) => (
        <div className="book-cell">
          <BookCover book={book} index={rowIndex} />
          <div className="book-cell__details">
            <strong>{book.name}</strong>
            <span className="book-cell__mobile-author">{book.author}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'author',
      name: 'AUTHOR',
      selector: (book) => book.author,
      sortField: 'author',
      sortable: true,
      hide: 'sm',
      minWidth: '145px',
    },
    {
      id: 'category',
      name: 'CATEGORY',
      selector: (book) => book.category,
      sortField: 'category',
      sortable: true,
      minWidth: '125px',
      cell: (book) => <span className="category-label">{book.category}</span>,
    },
    {
      id: 'price',
      name: 'PRICE',
      selector: (book) => Number(book.price),
      sortField: 'price',
      sortable: true,
      minWidth: '100px',
      cell: (book) => <span className="price-cell">${Number(book.price).toFixed(2)}</span>,
    },
    {
      id: 'actions',
      name: '',
      button: true,
      right: true,
      width: '90px',
      ignoreRowClick: true,
      cell: (book) => (
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
      ),
    },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="Fieldnotes home">
          <span className="brand__mark"><BookOpen size={21} strokeWidth={1.8} /></span>
          <span className="brand__name">fieldnotes<span>.</span></span>
        </Link>

        <div className="sidebar__section-label">LIBRARY</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <Link className="sidebar-nav__item sidebar-nav__item--active" to="/">
            <BookOpen size={17} />
            <span>All books</span>
            <span className="sidebar-nav__count">{pagination.totalItems}</span>
          </Link>
          <Link className="sidebar-nav__item" to="/books/table">
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
          <div className="page-heading__actions">
            <Link className="btn btn-view-toggle" to="/books/table" aria-label="Open simple table listing">
              <List size={16} />
              <span>Simple table</span>
            </Link>
            <button className="btn btn-add-book" type="button" onClick={openCreateDialog}>
              <Plus size={17} strokeWidth={2.2} />
              <span>Add a book</span>
            </button>
          </div>
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

          <DataTable
            className="book-data-table"
            columns={columns}
            data={books}
            keyField="_id"
            responsive
            highlightOnHover
            customStyles={dataTableStyles}
            noDataComponent={
              loading ? (
                <div className="table-message">
                  <LoaderCircle className="spin-icon" size={22} />
                  <span>Gathering your books...</span>
                </div>
              ) : loadError ? (
                <div className="table-message">Book list is unavailable until the API reconnects.</div>
              ) : (
                <div className="table-message table-message--empty">
                  <span className="empty-mark"><BookOpen size={23} /></span>
                  <strong>{search || activeFilterCount ? 'No matching books' : 'Your collection is waiting'}</strong>
                  <span>{search || activeFilterCount ? 'Adjust the search or filters and try again.' : 'Add a book to begin your inventory.'}</span>
                  {!(search || activeFilterCount) && (
                    <button className="btn btn-add-book btn-add-book--small" type="button" onClick={openCreateDialog}>
                      <Plus size={16} /> Add a book
                    </button>
                  )}
                </div>
              )
            }
            sortServer
            defaultSortFieldId="name"
            defaultSortAsc
            sortIcon={<ArrowUpDown size={13} />}
            onSort={(column, direction) => {
              if (!column.sortField) return;
              setSort(direction === 'desc' ? `-${column.sortField}` : column.sortField);
              changePage(1);
            }}
            pagination
            paginationServer
            paginationTotalRows={pagination.totalItems}
            paginationPerPage={PAGE_SIZE}
            paginationRowsPerPageOptions={[PAGE_SIZE]}
            paginationComponent={DataTablePaginationAdapter}
            paginationDefaultPage={page}
            paginationResetDefaultPage={paginationReset}
            onChangePage={changePage}
          />
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