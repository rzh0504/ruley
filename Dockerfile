# ============================================================================
# Stage 1: Build everything
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Install all dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build frontend (Vite)
RUN npm run build

# Bundle server into a single JS file with esbuild
# Externalize better-sqlite3 (native module, can't be bundled)
RUN npx esbuild src/server/index.ts \
    --bundle \
    --platform=node \
    --format=esm \
    --target=node20 \
    --outfile=server.mjs \
    --external:better-sqlite3

# ============================================================================
# Stage 2: Production (minimal)
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Install only better-sqlite3 native module
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    # Remove everything except better-sqlite3
    find node_modules -maxdepth 1 -mindepth 1 \
    ! -name 'better-sqlite3' \
    ! -name 'bindings' \
    ! -name 'prebuild-install' \
    ! -name 'file-uri-to-path' \
    ! -name 'node-addon-api' \
    -exec rm -rf {} + && \
    apk del python3 make g++

# Copy bundled server + built frontend
COPY --from=builder /app/server.mjs ./
COPY --from=builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "server.mjs"]
