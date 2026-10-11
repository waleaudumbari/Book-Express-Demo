import { BookOpen, LoaderCircle } from 'lucide-react';
import Pagination from './Pagination';

function SimpleBookTable({
  books,
  page,
  pagination,
  loading,
  loadError,
  hasFilters,
  onPageChange,
}) {
  return (
    <>
      <div className="table-responsive simple-table-responsive">
        <table className="table simple-book-table align-middle mb-0" aria-label="Book listing">
          <thead>
            <tr>
              <th scope="col">BOOK</th>
              <th scope="col">AUTHOR</th>
              <th scope="col">CATEGORY</th>
              <th scope="col">PRICE</th>
            </tr>
          </thead>
          <tbody>
            {loading && books.length === 0 && (
              <tr>
                <td className="table-message" colSpan="4">
                  <LoaderCircle className="spin-icon" size={22} />
                  <span>Gathering your books...</span>
                </td>
              </tr>
            )}
            {!loading && loadError && books.length === 0 && (
              <tr>
                <td className="table-message" colSpan="4">
                  Book list is unavailable until the API reconnects.
                </td>
              </tr>
            )}
            {!loading && !loadError && books.length === 0 && (
              <tr>
                <td className="table-message table-message--empty" colSpan="4">
                  <span className="empty-mark"><BookOpen size={23} /></span>
                  <strong>{hasFilters ? 'No matching books' : 'Your collection is waiting'}</strong>
                  <span>{hasFilters ? 'Adjust the search or filters and try again.' : 'Add a book to begin your inventory.'}</span>
                </td>
              </tr>
            )}
            {books.map((book, index) => (
              <tr key={book._id}>
                <td>
                  <div className="book-cell">
                    <div className={`book-cover book-cover--${index % 4}`}>
                      <BookOpen size={19} strokeWidth={1.6} aria-hidden="true" />
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
                    <div className="book-cell__details">
                      <strong>{book.name}</strong>
                      <span className="simple-book-id">ID {book._id}</span>
                    </div>
                  </div>
                </td>
                <td>{book.author}</td>
                <td><span className="category-label">{book.category}</span></td>
                <td className="price-cell">${Number(book.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pagination.limit || 10}
        totalItems={pagination.totalItems || 0}
        loading={loading}
        onPageChange={onPageChange}
      />
    </>
  );
}

export default SimpleBookTable;