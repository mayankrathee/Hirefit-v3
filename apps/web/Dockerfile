# Build stage - must build on Linux for correct paths
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Set build-time environment variables
ENV NEXT_PUBLIC_API_URL=https://hirefit-api-beta.icyfield-0d6da074.eastus.azurecontainerapps.io/api
ENV NEXT_PUBLIC_APP_NAME="HireFit Beta"
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create public directory
RUN mkdir -p ./public

# Copy standalone output from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public 2>/dev/null || true

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]

