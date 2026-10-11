# Book CRUD API

A REST API for creating, listing, retrieving, updating, and deleting books with Express and MongoDB.

## Requirements

- Node.js and npm
- MongoDB running locally, or a MongoDB connection string

## Setup

Install dependencies:

```bash
npm install
```

Configure `.env` in the project root:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/crud-book
```

Replace `MONGODB_URI` with your database connection string if needed. Keep `.env` out of version control.

Start the API:

```bash
npm run dev
```

For production, use `npm start`. The API listens on the configured port after connecting to MongoDB.

## Book Fields

- `id`: MongoDB document ID, returned as `_id`
- `name`: required string, up to 200 characters
- `category`: required string, up to 100 characters
- `price`: required positive number
- `author`: required string, up to 120 characters
- `image`: required HTTP or HTTPS image URL

Book documents also include `createdAt` and `updatedAt` timestamps.

## Endpoints

All endpoints are under `/api/v1/books`.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/books` | Create a book |
| `GET` | `/api/v1/books` | List books |
| `GET` | `/api/v1/books/:id` | Get a book by ID |
| `PATCH` | `/api/v1/books/:id` | Update one or more book fields |
| `DELETE` | `/api/v1/books/:id` | Delete a book; returns `204 No Content` |

### List options

`GET /api/v1/books` supports these query parameters:

| Parameter | Description |
| --- | --- |
| `search` | Case-insensitive search across name, category, and author |
| `category` | Case-insensitive exact category filter |
| `author` | Case-insensitive exact author filter |
| `minPrice` / `maxPrice` | Inclusive price range |
| `sort` | Comma-separated fields; prefix a field with `-` for descending order |
| `page` | 1-based page number; defaults to `1` |
| `limit` | Results per page; defaults to `10`, maximum `100` |

Sortable fields are `name`, `category`, `price`, `author`, and `createdAt`. Without `sort`, results are ordered by newest first.

Example:

```text
GET /api/v1/books?search=history&category=History&minPrice=5&sort=-price,name&page=1&limit=10
```

List responses include `data` and pagination metadata. Successful responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "error": ... }`.

## Project Structure

```text
src/
├── app.js
├── server.js
├── config/
│   └── database.js
├── controllers/
│   └── book.controller.js
├── middleware/
│   ├── error-handler.js
│   └── validate-request.js
├── models/
│   └── book.model.js
└── routes/
	└── book.routes.js
```

The `npm test` script is still a placeholder.
