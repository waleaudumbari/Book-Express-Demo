# Book CRUD Frontend

A React frontend for the Express and MongoDB Book CRUD API. It uses Webpack and Babel for development and production builds; it does not use Vite.

## Stack

- React and React Router
- Bootstrap 5
- Lucide React icons
- React Data Table Component for the inventory view
- Webpack 5 and Babel

## Requirements

- Node.js and npm
- The Book API running on `http://localhost:3000`
- MongoDB configured for the backend

## Run Locally

From the workspace root, start the backend in one terminal:

```powershell
npm --prefix backend install
npm --prefix backend run dev
```

Ensure `backend/.env` defines `PORT=3000` and a valid `MONGODB_URI`. The frontend development server proxies `/api` requests to `http://localhost:3000`.

In a second terminal, start the frontend:

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

Open [http://localhost:5174](http://localhost:5174).

## Routes

- `/` - Book inventory with sortable DataTable, filters, search, pagination, and CRUD actions.
- `/books/table` - Simple book listing rendered with a native HTML table, search, and pagination.

## Build

From the workspace root:

```powershell
npm --prefix frontend run build
```

Webpack writes the production build to `frontend/dist/`.

## Source Layout

```text
src/
├── assets/       # Images and other static assets
├── components/   # Shared UI, filters, tables, and pagination
├── hooks/        # Shared React hooks
├── pages/        # Route-level screens
├── services/     # Book API requests
├── utils/        # Shared helper functions
├── App.jsx       # DataTable inventory route
├── main.jsx      # React and router entry point
└── styles.css    # Global application styles
```
