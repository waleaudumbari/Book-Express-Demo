const BOOKS_API_URL = '/api/v1/books';

async function requestBooksApi(path = '', options = {}) {
  const response = await fetch(`${BOOKS_API_URL}${path}`, options);
  const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `Book API request failed (${response.status}).`;
    throw new Error(message);
  }

  return payload;
}

export function getBooks({ page = 1, limit = 10, sort = 'name', search, category, author, minPrice, maxPrice, signal } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
  });

  for (const [key, value] of Object.entries({ search, category, author, minPrice, maxPrice })) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }

  return requestBooksApi(`?${params}`, { signal });
}

export function createBook(book) {
  return requestBooksApi('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
}

export function updateBook(id, changes) {
  return requestBooksApi(`/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
}

export function deleteBook(id) {
  return requestBooksApi(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
}