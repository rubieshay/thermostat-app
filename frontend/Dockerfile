# Multi-stage Dockerfile for React + Vite + TypeScript Production Build

# Stage 1: Build Stage
FROM node:24-bookworm-slim AS builder

# Set working directory
WORKDIR /usr/app/frontend

# Copy package files first (for better layer caching)
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY frontend/. .
COPY backend/src/types.ts ./src/types.ts
COPY backend/src/schemas.ts ./src/schemas.ts

# Build the application
RUN npm run build

# Stage 2: Production Stage
FROM nginx:stable-bookworm AS production

# Install dumb-init for proper signal handling
# RUN apk add --no-cache dumb-init

# Copy built application from builder stage
COPY --from=builder /usr/app/frontend/dist /usr/share/nginx/html

WORKDIR /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

COPY frontend/bin/updateenv.sh  . 

COPY frontend/env-template ./.env

RUN chmod +x /usr/share/nginx/html/updateenv.sh


# Make port 8080 available (non-privileged port)
# Port change is handled in nginx.conf

# Expose port
EXPOSE 8080

# Use dumb-init and start nginx
#ENTRYPOINT ["dumb-init", "--"]
CMD ["/bin/bash","-c","/usr/share/nginx/html/updateenv.sh && nginx -g \"daemon off;\""]