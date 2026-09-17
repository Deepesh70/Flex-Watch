# Multi-stage production Dockerfile for Flex-Watch API Server
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source
COPY . .

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 flexwatch

# Copy artifacts from builder
COPY --from=builder --chown=flexwatch:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=flexwatch:nodejs /app/prisma ./prisma
COPY --from=builder --chown=flexwatch:nodejs /app/src ./src
COPY --from=builder --chown=flexwatch:nodejs /app/data ./data
COPY --from=builder --chown=flexwatch:nodejs /app/package.json ./package.json

USER flexwatch

EXPOSE 5000

CMD ["node", "src/server.js"]
