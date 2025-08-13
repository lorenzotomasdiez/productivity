# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime stage ---
FROM node:20-alpine
RUN apk add --no-cache wget \
 && addgroup -g 1001 -S nodejs \
 && adduser -S nodejs -u 1001 \
 && mkdir -p /app/logs /data/uploads /var/log/jarvis \
 && chown -R 1001:1001 /app /data/uploads /var/log/jarvis
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]


