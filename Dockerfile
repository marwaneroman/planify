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

# Use configs from nginx/ folder:
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
