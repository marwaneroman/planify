# syntax=docker/dockerfile:1
# Stage 1 — Build (cached; only re-runs when deps or source change)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit --no-fund
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 2 — Serve
FROM nginx:1.27-alpine AS runner

RUN set -eux; \
  attempt=1; \
  max=6; \
  while [ "$attempt" -le "$max" ]; do \
    if apk update --no-cache && apk add --no-cache gettext su-exec wget; then \
      exit 0; \
    fi; \
    echo "apk failed (attempt ${attempt}/${max}), retrying in $((attempt * 5))s..."; \
    sleep $((attempt * 5)); \
    attempt=$((attempt + 1)); \
  done; \
  exit 1

RUN addgroup -g 1001 -S appgroup \
    && adduser -D -H -u 1001 -G appgroup -s /sbin/nologin appuser \
    && mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/run/nginx \
        /var/log/nginx /etc/nginx/templates \
    && rm -f /var/log/nginx/access.log /var/log/nginx/error.log \
    && touch /var/log/nginx/access.log /var/log/nginx/error.log \
    && chown -R appuser:appgroup \
        /var/cache/nginx /var/run/nginx /var/log/nginx \
        /usr/share/nginx/html /etc/nginx/templates

RUN rm -rf /etc/nginx/conf.d/*
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh \
    && chown -R appuser:appgroup /usr/share/nginx/html

# Entrypoint must run as root to write /etc/nginx/conf.d/default.conf; it then
# starts nginx via su-exec as appuser.

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://127.0.0.1:3000/health || exit 1
ENTRYPOINT ["/docker-entrypoint.sh"]