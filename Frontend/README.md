# ThesisTrack — Frontend

React single-page app for ThesisTrack. See the [root README](../README.md) for the full project.

**Stack:** React 19, Vite, Tailwind CSS 4, React Router 7, axios, lucide-react icons.

## Scripts

```bash
npm install
npm run dev       # http://localhost:5173 (expects the backend on http://localhost:8080)
npm run lint      # oxlint
npm run build     # production build into dist/
```

Set `VITE_API_BASE_URL` to point at a different backend (default `http://localhost:8080/api`).

## Structure

```
src/
  api/client.js          axios instance; attaches the JWT and refreshes it on 401
  context/AuthContext    login, register, logout and the signed-in user
  layouts/               AppLayout (sidebar + top bar), AuthLayout (sign-in screens)
  components/ui.jsx      shared UI primitives: Button, Card, Field, Badge, Table, …
  components/            ProgressTracker, MessageThread, DocumentsPanel, charts/
  hooks/                 useMyThesis, useSupervisedThesis
  lib/                   formatting helpers, stage metadata, class-name helper
  pages/                 student/, supervisor/, coordinator/, admin/, plus shared pages
```

## Roles and pages

| Role | Pages |
|---|---|
| Student | Dashboard, prototype review booking, documents, messages |
| Supervisor | My students, per-student messages and documents |
| Coordinator | Review slots, supervisor assignment queue |
| Admin | Everything a coordinator sees, plus analytics |

Every role has a notifications page at `/notifications`.

## Styling

Design tokens (the `brand` colour scale and the Inter font) live in `src/index.css`.
Build new screens from the primitives in `components/ui.jsx` rather than hardcoding colours.
