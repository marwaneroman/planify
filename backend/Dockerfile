# syntax=docker/dockerfile:1
# Stage 1 — Dependencies and Prisma client
FROM node:20-slim AS deps

WORKDIR /app

# OpenSSL required for Prisma on Debian slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install all deps (needed for prisma generate); cache invalidated when package*.json change
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Make npm more tolerant of slow networks in Docker
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 600000

RUN npm ci --no-audit --no-fund
RUN npx prisma generate


# Stage 2 — Production runtime
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Runtime deps: OpenSSL for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system --gid 1001 appgroup \
    && adduser --disabled-password --gecos '' --uid 1001 --ingroup appgroup appuser

# Copy production deps and Prisma client from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

# Prisma schema (needed for db push at runtime)
COPY --from=deps /app/prisma ./prisma

# App code (no node_modules, no .env — use runtime env only)
COPY . .

# Prune devDependencies to shrink image
RUN npm prune --omit=dev \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
    CMD curl -fsS http://127.0.0.1:3000/health || exit 1

# DATABASE_URL must point at Postgres (local: compose `db` service; AWS: RDS endpoint in task env/secrets).
# Optional: SKIP_PRISMA_DB_PUSH=1 in ECS after schema exists — avoids every task running `db push` at startup (use migrations or a one-off job for schema changes).
CMD ["sh", "-c", "if [ \"${SKIP_PRISMA_DB_PUSH:-0}\" != \"1\" ]; then npx prisma db push; fi && exec node server.js"]