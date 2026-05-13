# syntax=docker/dockerfile:1
# Stage 1 — Build (cached; only re-runs when deps or source change)
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first for better layer cache (only invalidated when package*.json change)
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit --no-fund

# Copy source and build (invalidated when app code changes)
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 2 — Serve
FROM nginx:1.27-alpine AS runner

# Non-privileged port + real passwd entry (ECS rejects missing users like the old `USER non-root`).
RUN addgroup -g 1001 -S appgroup \
    && adduser -D -H -u 1001 -G appgroup -s /sbin/nologin appuser \
    && mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/run/nginx \
    && chown -R appuser:appgroup /var/cache/nginx /var/run/nginx /usr/share/nginx/html

# Use configs from nginx/ folder:
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
RUN chown -R appuser:appgroup /usr/share/nginx/html

EXPOSE 3000

USER appuser

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]