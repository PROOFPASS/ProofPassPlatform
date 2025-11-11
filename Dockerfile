# Multi-stage build for ProofPass API

# Stage 1: Build packages
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY packages/stellar-sdk/package*.json ./packages/stellar-sdk/
COPY packages/vc-toolkit/package*.json ./packages/vc-toolkit/
COPY packages/zk-toolkit/package*.json ./packages/zk-toolkit/
COPY apps/api/package*.json ./apps/api/

# Copy workspace files
COPY tsconfig.json ./
COPY pnpm-workspace.yaml ./

# Copy source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies
RUN npm install

# Build packages in order
RUN cd packages/types && npm run build
RUN cd packages/stellar-sdk && npm run build
RUN cd packages/vc-toolkit && npm run build
RUN cd packages/zk-toolkit && npm run build
RUN cd apps/api && npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/types/package*.json ./packages/types/
COPY --from=builder /app/packages/stellar-sdk/package*.json ./packages/stellar-sdk/
COPY --from=builder /app/packages/vc-toolkit/package*.json ./packages/vc-toolkit/
COPY --from=builder /app/packages/zk-toolkit/package*.json ./packages/zk-toolkit/
COPY --from=builder /app/apps/api/package*.json ./apps/api/

# Copy built artifacts
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/stellar-sdk/dist ./packages/stellar-sdk/dist
COPY --from=builder /app/packages/vc-toolkit/dist ./packages/vc-toolkit/dist
COPY --from=builder /app/packages/zk-toolkit/dist ./packages/zk-toolkit/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy migration files (needed at runtime)
COPY --from=builder /app/apps/api/src/config/migrations ./apps/api/dist/config/migrations

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Install production dependencies
RUN npm install --production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use entrypoint script
ENTRYPOINT ["/app/docker-entrypoint.sh"]
