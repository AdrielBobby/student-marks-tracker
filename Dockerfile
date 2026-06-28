# ── Stage 1: Install dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app

# better-sqlite3 is a native module — needs build tools on Alpine
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# ── Stage 2: Build the application ──
FROM node:20-alpine AS builder
WORKDIR /app

# Build tools needed again for any native rebuild during prisma generate
RUN apk add --no-cache python3 make g++

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# ── Stage 3: Production runner ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/prod.db
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy full standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/app/generated ./app/generated

# Copy ALL node_modules to avoid transitive dependency issues
COPY --from=builder /app/node_modules ./node_modules

# Create persistent data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
