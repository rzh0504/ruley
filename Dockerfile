# ============================================================================
# Stage 1: Build frontend
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# ============================================================================
# Stage 2: Production
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Install build tools for native modules (better-sqlite3 needs rebuild)
RUN apk add --no-cache python3 make g++

# Copy package files and install production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && apk del python3 make g++

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source
COPY src/server ./src/server
COPY tsconfig.json ./

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npx", "tsx", "src/server/index.ts"]
