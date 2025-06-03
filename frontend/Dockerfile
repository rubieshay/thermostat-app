# Multi-stage Dockerfile for React + Vite + TypeScript Production Build

# Stage 1: Build Stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/app/frontend

# Copy package files first (for better layer caching)
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY frontend/. .

# Build the application
RUN npm run build

# Stage 2: Production Stage
FROM nginx:alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built application from builder stage
COPY --from=builder /usr/app/frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Change ownership of nginx directories
RUN chown -R nodejs:nodejs /var/cache/nginx && \
    chown -R nodejs:nodejs /var/log/nginx && \
    chown -R nodejs:nodejs /etc/nginx/conf.d

# Make port 8080 available (non-privileged port)
# Port change is handled in nginx.conf

# Expose port
EXPOSE 8080

# Switch to non-root user
USER nodejs

# Use dumb-init and start nginx
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]