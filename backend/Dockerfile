FROM node:bullseye-slim AS deps
WORKDIR /usr/app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --only=production=false

FROM node:bullseye-slim AS builder
WORKDIR /usr/app
COPY --from=builder /usr/app/backend/node_modules ./node_modules
COPY backend/. .
RUN npm run build

FROM node:bullseye-slim AS prod-deps
WORKDIR /usr/app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:bullseye-slim AS production
WORKDIR /usr/app
COPY --from=prod-deps /usr/app/node_modules ./node_modules
COPY --from=builder /usr/app/dist ./dist
CMD node build/index.js
EXPOSE 3000