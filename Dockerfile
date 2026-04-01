# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm install -g npm@latest

RUN npm ci --workspaces=false --only=prod

COPY . .

WORKDIR /app/backend
RUN npm run build

WORKDIR /app/frontend
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/frontend/package*.json ./frontend/

WORKDIR /app/backend
RUN npm ci --only=prod --omit=dev
RUN npx prisma generate

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]