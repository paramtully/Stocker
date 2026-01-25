FROM node:22-alpine3.19

WORKDIR /app

# Copy root package files and install ALL dependencies (including dev for TypeScript)
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# Copy workspace packages
COPY packages/domain ./packages/domain
COPY packages/infra ./packages/infra
COPY packages/bucketRepository ./packages/bucketRepository
COPY packages/repositories ./packages/repositories
COPY packages/candleHistoricalLoad ./packages/candleHistoricalLoad

# Build workspace packages in dependency order
WORKDIR /app/packages/domain
RUN npm run build

WORKDIR /app/packages/infra
RUN npm run build

WORKDIR /app/packages/bucketRepository
RUN npm run build

WORKDIR /app/packages/repositories
RUN npm run build

# Build the main package
WORKDIR /app/packages/candleHistoricalLoad
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# Run from the package directory
CMD ["npm", "start"]