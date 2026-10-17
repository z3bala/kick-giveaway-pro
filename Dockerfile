# Stage 1: Build Frontend and Backend
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy full source tree
COPY . .

# Build Vite client and TypeScript server
RUN npm run build

# Stage 2: Minimal Production Runtime
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0
ENV DATABASE_PATH=/app/data/giveaway.db

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create persistent data directory
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "dist/server/index.js"]
