FROM node:20
WORKDIR /app

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

COPY . .

RUN chown -R appuser:appgroup /app
USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -fsS http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && node server.js"]