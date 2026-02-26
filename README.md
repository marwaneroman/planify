# Planify

Collaborative project and task management for organizations. This repo contains the full-stack application: a React frontend, a Node.js API backend, and PostgreSQL, with deployment via Docker Compose.

---

## Architecture

Planify is a three-tier app. The browser talks only to the **frontend** (Nginx). Nginx serves the static SPA and proxies `/auth/*` and `/api/*` to the **backend**. The backend uses **PostgreSQL** for persistence.

```
                    ┌─────────────────────────────────────────────────┐
                    │                    Browser                        │
                    │              (http://localhost)                   │
                    └─────────────────────┬───────────────────────────┘
                                          │
                                          ▼
                    ┌─────────────────────────────────────────────────┐
                    │  Frontend (Nginx)                                │
                    │  • Serves static SPA (React/Vite build)          │
                    │  • Proxies /auth/* and /api/* → Backend          │
                    │  • Gzip, rate limiting, security headers         │
                    └─────────────────────┬───────────────────────────┘
                                          │
                    ┌─────────────────────┴───────────────────────────┐
                    │                                                  │
                    ▼                                                  ▼
    ┌───────────────────────────────┐              ┌───────────────────────────────┐
    │  Backend (Node.js / Express)  │              │  PostgreSQL                    │
    │  • JWT auth (/auth/*)        │◄────────────►│  • Users, orgs, projects,     │
    │  • REST API (/api/*)         │   Prisma     │    tasks, comments, activity   │
    │  • Prisma ORM                │              │                                │
    └───────────────────────────────┘              └───────────────────────────────┘
```

### Tech stack

| Layer     | Technology |
|----------|------------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router, Radix UI |
| **Reverse proxy** | Nginx (Alpine) — static files, proxy to backend, gzip, rate limiting |
| **Backend** | Node.js 20, Express, Prisma, JWT (bcrypt, jsonwebtoken) |
| **Database** | PostgreSQL 16 |

### Repository structure

```
planify/
├── frontend/                 # React SPA and Nginx
│   ├── src/                  # App source (components, pages, contexts, etc.)
│   ├── public/
│   ├── nginx/                # Nginx config (main + server block)
│   ├── Dockerfile            # Multi-stage: Vite build → Nginx serve
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── backend/                  # Node.js API
│   ├── server.js
│   ├── routes/               # auth, api
│   ├── controllers/
│   ├── middleware/
│   ├── prisma/
│   ├── Dockerfile            # Multi-stage: deps + Prisma → slim runtime
│   └── package.json
├── docker-compose.yml        # Orchestrates db, backend, frontend
├── .env.example              # Template for env vars (see below)
└── README.md
```

---

## Deployment (Docker Compose)

Deployment is done by running the full stack with Docker Compose. The frontend image is built from `frontend/`, the backend from `backend/`; each service has its own Dockerfile and build context.

### Prerequisites

- Docker and Docker Compose
- (Optional) Git

### 1. Clone and set environment variables

```bash
git clone <repo-url>
cd planify
cp .env.example .env
```

Edit `.env` in the **project root** with values used by `docker-compose`:

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL user | `planify` |
| `POSTGRES_PASSWORD` | PostgreSQL password | (strong password) |
| `POSTGRES_DB` | Database name | `planify` |
| `JWT_SECRET` | Secret for JWT signing | (long random string) |

For **local development** of the frontend (Vite dev server), you can also set in `frontend/.env`:

- `VITE_API_URL=http://localhost:3001` — so the SPA talks to the backend on your host.

### 2. Build and start containers

```bash
docker compose up --build -d
```

- **Frontend**: built from `frontend/` (Vite build, then Nginx image). Exposed on **port 80**.
- **Backend**: built from `backend/` (Node 20 slim, Prisma). Listens on port 3000 inside the network; not exposed on the host.
- **Database**: PostgreSQL 16 (Alpine). Data persisted in a Docker volume.

### 3. Use the app

- Open **http://localhost** in your browser.
- Sign up or sign in; all API calls go through Nginx to the backend.

### Useful commands

```bash
docker compose up -d          # Start in background
docker compose down           # Stop and remove containers
docker compose logs -f       # Follow logs
docker compose ps            # Service status
```

---

## Local development (without Docker)

Use this when you want to run the frontend and backend on your machine with hot reload.

### Backend

```bash
cd backend
cp .env.example .env          # Set DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN
npm install
npx prisma db push            # Create/update DB schema
npm run dev                   # Start on port 3001 (or your PORT)
```

### Frontend

```bash
cd frontend
cp .env.example .env          # Set VITE_API_URL=http://localhost:3001
npm install
npm run dev                   # Vite dev server (e.g. port 8080)
```

Then open the URL Vite prints (e.g. http://localhost:8080). The app will use `VITE_API_URL` to talk to the backend.

### Database

PostgreSQL must be running (local install or a separate Docker container). Point `backend/.env` `DATABASE_URL` at it.

---

## Environment summary

| Where | Purpose |
|-------|---------|
| **Root `.env`** | Used by `docker-compose`: `POSTGRES_*`, `JWT_SECRET`. Not used when running frontend/backend locally. |
| **`frontend/.env`** | `VITE_API_URL` for local dev (e.g. `http://localhost:3001`). In Docker, the frontend is built with empty base URL so it uses the same origin (Nginx). |
| **`backend/.env`** | For local backend: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`. In Docker, backend env is set by `docker-compose.yml`. |

---

## API overview

- **Auth**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me` (Bearer token).
- **Organizations**: `GET/POST /api/organizations`, `GET /api/organizations/:id`, members, projects.
- **Projects & tasks**: CRUD under `/api/organizations/:id/projects` and `/api/projects/:id/tasks`.
- **Comments & activity**: `/api/tasks/:id/comments`, `/api/organizations/:id/activity`, analytics.

For full endpoint details and request/response shapes, see **[BACKEND.md](./BACKEND.md)**.

---

## License

Private / All rights reserved (adjust as needed).
