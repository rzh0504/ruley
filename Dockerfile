FROM node:20-alpine AS builder

WORKDIR /app

# Build better-sqlite3 once in the builder stage.
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV NODE_OPTIONS=--max-old-space-size=256

COPY --from=builder --chown=node:node /app/server.cjs ./
COPY --from=builder --chown=node:node /app/dist ./dist

# Copy only the native SQLite runtime bits that the bundled server still needs.
COPY --from=builder --chown=node:node /app/node_modules/better-sqlite3/package.json ./node_modules/better-sqlite3/package.json
COPY --from=builder --chown=node:node /app/node_modules/better-sqlite3/lib ./node_modules/better-sqlite3/lib
COPY --from=builder --chown=node:node /app/node_modules/better-sqlite3/build/Release ./node_modules/better-sqlite3/build/Release
COPY --from=builder --chown=node:node /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder --chown=node:node /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

RUN mkdir -p /app/data && chown -R node:node /app/data

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.cjs"]
