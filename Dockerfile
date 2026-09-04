# Use official Node.js 20 LTS Alpine image for high performance & minimal footprint
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Seed initial SQLite database if needed
RUN node db/seed.js

# Expose HTTP port
EXPOSE 3000

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Container Healthcheck verifying /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start production server
CMD ["node", "server.js"]
