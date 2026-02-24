# Custom Backend (Supabase Replacement)

This document describes the custom Node.js backend that replaces Supabase for database, auth, and API.

## Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (JSON Web Tokens)

## Project Structure

```
backend/
├── server.js           # Entry point
├── package.json
├── .env.example        # Environment template
├── lib/
│   └── prisma.js       # Prisma client
├── middleware/
│   └── auth.js         # JWT auth middleware
├── controllers/
│   ├── authController.js
│   └── apiController.js
├── routes/
│   ├── auth.js         # /auth/login, /auth/register, /auth/me
│   └── api.js          # /api/* routes
└── prisma/
    ├── schema.prisma
    └── migrations/
```

## Environment Variables

Create a `.env` file in the `backend/` folder:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `JWT_SECRET` | Secret for signing JWTs | Use a long random string in production |
| `PORT` | Server port | `3001` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:8080` |

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

### 3. Create database and user (first time only)

If your PostgreSQL does not yet have the user or database from `DATABASE_URL`:

1. In `backend/.env`, set an admin URL so the app can create them (use your real postgres password):

   ```env
   POSTGRES_ADMIN_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/postgres"
   ```

2. From the `backend` folder run:

   ```bash
   npm run db:setup
   ```

   This creates the user and database from your `DATABASE_URL`. Then run:

   ```bash
   npm run build
   npm run db:push
   ```

   To verify the connection: `npm run test:db`

If you prefer to create the user/database yourself (e.g. in pgAdmin or psql), skip `db:setup` and ensure `DATABASE_URL` points at an existing database, then run `npm run build` and `npm run db:push`.

### 4. Start the backend

```bash
npm start          # Production
npm run dev        # Development (with --watch)
```

## API Endpoints

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register (body: `{ email, password, full_name? }`) |
| POST | `/auth/login` | Login (body: `{ email, password }`) |
| GET | `/auth/me` | Current user (requires `Authorization: Bearer <token>`) |

### Organizations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/organizations` | Create org |
| GET | `/api/organizations` | List orgs |
| GET | `/api/organizations/:orgId` | Get org |
| GET | `/api/organizations/:orgId/members` | List members |

### Projects

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/organizations/:orgId/projects` | List projects |
| POST | `/api/organizations/:orgId/projects` | Create project |
| GET | `/api/projects/:projectId` | Get project |

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/:projectId/tasks` | List tasks |
| POST | `/api/projects/:projectId/tasks` | Create task |
| PATCH | `/api/tasks/:taskId` | Update task |

### Comments & Activity

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks/:taskId/comments` | List comments |
| POST | `/api/tasks/:taskId/comments` | Add comment |
| POST | `/api/organizations/:orgId/activity` | Log activity |
| GET | `/api/organizations/:orgId/activity` | List activity |
| GET | `/api/organizations/:orgId/analytics` | Get analytics |

## Frontend Configuration

Create or update `.env` in the project root:

```
VITE_API_URL=http://localhost:3001
```

For production, set `VITE_API_URL` to your deployed backend URL.


## Deployment

1. Set all environment variables in your hosting platform.
2. Run `npm run build` (generates Prisma client).
3. Run `npx prisma migrate deploy` or `prisma db push` against your production DB.
4. Run `npm start`.

The backend listens on `PORT` (default 3001) and serves the API.
