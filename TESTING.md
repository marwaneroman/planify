# Planify — Testing Guide

This document describes the testing setup for the Planify project, suitable for local development and CI/CD (GitHub Actions).

## Quick start

- **From repo root:** `npm test` — runs backend unit tests + frontend tests (no DB required).
- **Backend (all):** `cd backend && npm test` — unit + integration (integration needs `DATABASE_URL`).
- **Backend (unit only):** `cd backend && npm run test:unit`
- **Frontend (unit/integration):** `cd frontend && npm test`
- **Frontend (E2E):** `cd frontend && npm run test:e2e`

## Backend tests

### Structure

```
backend/
├── __tests__/
│   ├── db-connection.test.js   # DB connectivity (requires DATABASE_URL)
│   ├── lib/
│   │   └── serialize.test.js    # Unit tests for snake_case serialization
│   └── integration/
│       ├── auth.api.test.js    # Auth routes (register, login, /me)
│       └── api.routes.test.js  # API routes (health, orgs, projects)
```

### Commands

| Script | Description |
|--------|-------------|
| `npm test` | Run all backend tests via `run-tests.mjs` (unit + integration). Set `NODE_ENV=test`. |
| `npm run test:unit` | Unit tests only (no DB). |
| `npm run test:integration` | Integration tests (require DATABASE_URL). |
| `npm run test:db` | DB connection check only. |

Tests are discovered by `run-tests.mjs`, which finds all `*.test.js` files under `__tests__/` so they run correctly on all platforms (including Windows).

### Requirements

- **Unit tests:** No database required.
- **Integration tests:** PostgreSQL with `DATABASE_URL`. Use a test database; schema is applied via `prisma db push` or migrations in CI.

### Stack

- **Runner:** Node.js built-in test runner (`node --test`).
- **HTTP assertions:** Supertest.
- **Environment:** `NODE_ENV=test` so the server does not listen when importing the app.

---

## Frontend tests

### Structure

```
frontend/
├── src/
│   ├── lib/
│   │   └── utils.test.ts           # Unit: cn() utility
│   ├── components/
│   │   ├── ui/
│   │   │   └── button.test.tsx     # Unit: Button component
│   │   └── ProtectedRoute.test.tsx # Integration: auth + routing
│   ├── pages/
│   │   ├── Auth.test.tsx           # Integration: Auth form + API mock
│   │   └── NotFound.test.tsx       # Unit: 404 page
│   └── services/
│       └── api.test.ts             # Unit: API service (mocked apiFetch)
├── e2e/
│   └── app.spec.ts                 # E2E: navigation, auth redirect, 404
├── vitest.config.ts
└── playwright.config.ts
```

### Commands

| Script | Description |
|--------|-------------|
| `npm test` | Run Vitest (unit + integration) once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:e2e` | Run Playwright E2E tests. Starts dev server or use built app. |

### Unit / integration (Vitest)

- **Runner:** Vitest.
- **DOM:** jsdom.
- **Components:** React Testing Library.
- **Mocks:** `vi.mock()` for `@/lib/apiClient` and `@/contexts/AuthContext` where needed.

### E2E (Playwright)

- **Runner:** Playwright.
- **Browsers:** Chromium (default in CI), Firefox, WebKit locally.
- **Config:** `playwright.config.ts`. Base URL: `http://localhost:8080` (dev) or `http://localhost:4173` (preview).
- **Local:** `npm run test:e2e` starts the dev server automatically unless `CI` is set.
- **CI:** Build with `npm run build`, then `npx vite preview --port 4173` and run Playwright with `PLAYWRIGHT_BASE_URL=http://localhost:4173`.

---

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/CI-Pipeline.yml`

| Job | What it runs |
|-----|----------------|
| **backend-test** | Postgres service, `npm run test:unit`, `npm run test:db`, `prisma db push`, `npm run test:integration`. |
| **frontend-test** | `npm test` (Vitest). |
| **frontend-e2e** | `npm run build`, `vite preview`, Playwright (Chromium only). |

### Backend in CI

- Uses a Postgres 16 service container.
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/planify_test?schema=public`
- Schema is applied with `prisma db push --accept-data-loss` before integration tests.

### Optional

- Add a **root** `package.json` with `"test": "npm run test --prefix backend && npm run test --prefix frontend"` to run both from the repo root.
- Add `DATABASE_URL` (and optionally `JWT_SECRET`) as repository secrets if you use a hosted DB for integration tests instead of the service container.

---

## Best practices

1. **Backend:** Do not start the HTTP server in test mode; the app is imported and exercised with Supertest.
2. **Frontend:** Mock `apiFetch` and `useAuth` in component/integration tests to avoid real API and auth side effects.
3. **E2E:** Prefer stable selectors (role + name); avoid fragile class or DOM structure.
4. **CI:** Keep unit tests fast and free of external services when possible; use integration and E2E for realistic flows.
