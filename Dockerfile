FROM node:20-alpine AS builder

WORKDIR /app

# Build better-sqlite3 once in the builder stage.
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

RUN npm run build

RUN npx esbuild src/server/index.ts \
    --bundle \
    --platform=node \
    --format=cjs \
    --target=node20 \
    --minify \
    --outfile=server.cjs \
    --external:better-sqlite3

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV NODE_OPTIONS=--max-old-space-size=256

COPY --from=builder /app/server.cjs ./
COPY --from=builder /app/dist ./dist

# Copy only the native SQLite runtime bits that the bundled server still needs.
COPY --from=builder /app/node_modules/better-sqlite3/package.json ./node_modules/better-sqlite3/package.json
COPY --from=builder /app/node_modules/better-sqlite3/lib ./node_modules/better-sqlite3/lib
COPY --from=builder /app/node_modules/better-sqlite3/build/Release ./node_modules/better-sqlite3/build/Release
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

RUN mkdir -p /app/data

EXPOSE 4000

CMD ["node", "server.cjs"]
