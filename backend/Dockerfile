FROM node:bullseye-slim AS builder
WORKDIR /usr/app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm install
COPY backend/. /usr/app/backend
RUN npm run build
RUN ls -laRt /usr/app/backend

FROM node:bullseye-slim
WORKDIR /usr/app
COPY --from=builder /usr/app/backend/dist ./dist
RUN NODE_ENV=production npm install --omit=dev
CMD node dist/index.js
EXPOSE 3000