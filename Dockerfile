# Stage 1 — Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2 — Serve
FROM nginx:1.29-alpine

LABEL org.opencontainers.image.source="https://github.com/repo"

RUN rm -rf /etc/nginx/conf.d/*

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]