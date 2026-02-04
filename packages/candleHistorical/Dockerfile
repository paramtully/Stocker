FROM node:22-alpine3.19

WORKDIR /app

# Copy only package files first (most stable layer)
COPY package.json package-lock.json ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/infra/package.json ./packages/infra/
COPY packages/bucketRepository/package.json ./packages/bucketRepository/
COPY packages/candleHistoricalLoad/package.json ./packages/candleHistoricalLoad/

# Install dependencies (cached unless package.json changes)
# Use BuildKit cache mount for npm packages
RUN --mount=type=cache,target=/root/.npm \
    npm ci && npm cache clean --force

# Copy source code (changes more frequently)
COPY packages/domain ./packages/domain
COPY packages/infra ./packages/infra
COPY packages/bucketRepository ./packages/bucketRepository
COPY packages/candleHistoricalLoad ./packages/candleHistoricalLoad

# Build (cached unless source changes)
WORKDIR /app/packages/domain
RUN npm run build

WORKDIR /app/packages/infra
RUN npm run build

WORKDIR /app/packages/bucketRepository
RUN npm run build

WORKDIR /app/packages/candleHistoricalLoad
RUN npm run build

# User setup (rarely changes)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

# Run from the package directory
CMD ["npm", "start"]