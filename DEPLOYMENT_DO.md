## Deploying the Jarvis API to a DigitalOcean Droplet (free GitHub Actions)

This guide gets your API live on a DigitalOcean Ubuntu droplet with:
- Docker + Docker Compose
- Postgres + Redis
- Caddy reverse proxy with automatic HTTPS (Let’s Encrypt)
- Environment-based configuration and secure secrets handling
- GitHub Actions CI/CD that builds, pushes, and deploys on push to `master`

Follow it top-to-bottom for a first deployment, then reuse the CI/CD flow.

---

### 1) Requirements
- A domain name you control (e.g., `api.example.com`).
- A DigitalOcean droplet (Ubuntu 22.04 LTS suggested; 1 vCPU / 1–2 GB RAM for small usage).
- DNS A/AAAA record pointing `api.example.com` to the droplet’s IP.
- GitHub repo access to set Actions secrets.

---

### 2) Architecture (containers)
- `api`: Node/Express TypeScript server (listens on port 3000). Reads config via env vars.
- `db`: PostgreSQL (internal only).
- `redis`: Redis (internal only).
- `caddy`: HTTPS reverse proxy and certificates via Let’s Encrypt. Public ports 80/443.

All services live on an internal Docker network. Only `caddy` is publicly exposed.

---

### 3) App environment variables (production)
Create a secure `.env.production` (do not commit!) and upload to the server (or use a secret manager). Minimum required based on `backend/api/src/config/index.ts`:

```
# Core
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
CORS_ORIGIN=https://your-frontend-domain.com

# Database
DATABASE_URL=postgresql://jarvis:STRONG_PASSWORD@db:5432/jarvis_prod

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=replace-with-strong-random
JWT_REFRESH_SECRET=replace-with-strong-random
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Optional integrations
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
AI_SERVICE_URL=
RESEARCH_ENGINE_URL=

# Uploads/logs (if you change defaults)
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/data/uploads
LOG_FILE_PATH=/var/log/jarvis/jarvis-api.log

# Rate limit (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Notes:
- `DATABASE_URL` points to the Compose `db` service (internal hostname `db`).
- `CORS_ORIGIN` should include your real frontend origin(s); comma-separate for multiples.

---

### 4) Production Dockerfile for the API
Add this file at `backend/api/Dockerfile` (multi-stage; compiles TypeScript and runs minimal image):

```dockerfile
# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime stage ---
FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/.env.example ./  # optional; not used in prod
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
```

Why: `npm run build` emits JS to `dist/`, and `server.ts` starts the HTTP server.

---

### 5) Production docker-compose
Create `docker/production/docker-compose.yml` with all services and an internal network:

```yaml
version: "3.9"

name: jarvis-prod

services:
  caddy:
    image: caddy:2.8
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - caddy_data:/data
      - caddy_config:/config
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
    depends_on:
      - api
    networks:
      - web
      - internal

  api:
    image: ghcr.io/OWNER/jarvis-api:latest # set OWNER below
    restart: unless-stopped
    env_file: ../../.env.production
    environment:
      - NODE_ENV=production
    depends_on:
      - db
      - redis
    networks:
      - internal

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_DB=jarvis_prod
      - POSTGRES_USER=jarvis
      - POSTGRES_PASSWORD=STRONG_PASSWORD
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis_data:/data
    networks:
      - internal

volumes:
  postgres_data:
  redis_data:
  caddy_data:
  caddy_config:

networks:
  web:
  internal:
```

Replace `ghcr.io/OWNER/jarvis-api:latest` with your GitHub org/user.

---

### 6) Caddy reverse proxy with automatic SSL
Create `docker/production/Caddyfile` to terminate TLS and proxy to the API:

```
api.example.com {
  encode gzip

  @api {
    path *
  }

  reverse_proxy @api api:3000 {
    header_up X-Forwarded-Proto {scheme}
    header_up X-Forwarded-Host {host}
  }

  # Basic security headers
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options nosniff
    X-Frame-Options DENY
    Referrer-Policy no-referrer-when-downgrade
  }
}
```

Caddy will get/renew Let’s Encrypt certs automatically for `api.example.com`. Ensure DNS is correct before first start.

---

### 7) Prepare the droplet
SSH into the droplet as a sudo-capable user and run:

```bash
# Update system
sudo apt-get update && sudo apt-get -y upgrade

# Install Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Caddy dependency (already pulled via Docker image)

# Optional hardening
sudo apt-get -y install ufw fail2ban
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create deployment directories
mkdir -p ~/jarvis/docker/production
```

Copy files to the server:
- `docker/production/docker-compose.yml` → `~/jarvis/docker/production/docker-compose.yml`
- `docker/production/Caddyfile` → `~/jarvis/docker/production/Caddyfile`
- `.env.production` → `~/jarvis/.env.production`

First-time start (manual):

```bash
cd ~/jarvis/docker/production
# login to GHCR the first time; use a token with read:packages
echo "$GHCR_PAT" | docker login ghcr.io -u OWNER --password-stdin

# bring up stack
docker compose up -d

# verify
docker compose ps
curl -I https://api.example.com/health
```

---

### 8) GitHub Actions CI/CD (build, push, deploy)
We’ll build a production image on push to `master`, push to GHCR, then SSH deploy to the droplet and run `docker compose pull && docker compose up -d`.

Add a workflow at `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy API (DigitalOcean)

on:
  push:
    branches: [ master ]
  workflow_dispatch: {}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GHCR_PAT }}

      - name: Extract metadata (tags, labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository_owner }}/jarvis-api
          tags: |
            type=raw,value=latest
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: ./backend/api
          file: ./backend/api/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Install SSH key
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add host to known_hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy over SSH
        env:
          SSH_USER: ${{ secrets.SSH_USER }}
          SSH_HOST: ${{ secrets.SSH_HOST }}
          GHCR_PAT: ${{ secrets.GHCR_PAT }}
          OWNER: ${{ github.repository_owner }}
        run: |
          ssh -o StrictHostKeyChecking=yes $SSH_USER@$SSH_HOST \
            "echo \"$GHCR_PAT\" | docker login ghcr.io -u $OWNER --password-stdin && \
             cd ~/jarvis/docker/production && \
             sed -i 's#ghcr.io/.\+/jarvis-api:latest#ghcr.io/'$OWNER'/jarvis-api:latest#' docker-compose.yml && \
             docker compose pull && docker compose up -d && \
             docker image prune -f"
```

Set these GitHub Actions secrets in your repo:
- `GHCR_PAT`: Personal Access Token with `read:packages` and `write:packages` for GHCR.
- `SSH_HOST`: Droplet public IP or hostname.
- `SSH_USER`: SSH user on the droplet (should be in the `docker` group).
- `SSH_PRIVATE_KEY`: Private key matching the droplet’s `~/.ssh/authorized_keys` entry.

Also update `docker/production/docker-compose.yml` to use the correct `OWNER` or let the deploy step rewrite it as shown.

---

### 9) Operational commands (on the droplet)
- View logs: `docker compose logs -f api`
- Restart API: `docker compose restart api`
- Update to latest image: `docker compose pull && docker compose up -d`
- Backup Postgres quickly: `docker exec -t $(docker ps -qf name=db) pg_dump -U jarvis jarvis_prod > ~/jarvis/db_$(date +%F).sql`

For automated backups, consider adding a `postgres-backup` container (see Extras).

---

### 10) Security and hardening checklist
- Non-root deploy user in `docker` group; disable direct root SSH.
- UFW firewall allow only 22, 80, 443.
- Keep the system updated (`unattended-upgrades` or cron).
- Use strong `JWT_SECRET` and `JWT_REFRESH_SECRET` values.
- Use strong Postgres password; do not expose DB/Redis to the internet.
- Restrict CORS accurately to trusted origins.
- Consider adding Fail2ban and SSH key authentication only.

---

### 11) Health checks and monitoring
- Health endpoint is at `/health` (already implemented). Caddy health checks via container `HEALTHCHECK` and external uptime monitors (e.g., BetterStack, UptimeRobot).
- Optionally ship logs to a managed service (Grafana Cloud, Logtail, Datadog). The API supports file logging via `LOG_FILE_PATH`.

---

### 12) Useful extras (optional)
- Auto-update running containers:

```yaml
# Add to docker-compose services
watchtower:
  image: containrrr/watchtower
  restart: unless-stopped
  environment:
    - WATCHTOWER_CLEANUP=true
    - WATCHTOWER_POLL_INTERVAL=300
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  networks:
    - internal
```

- Automated Postgres backups container:

```yaml
# Add to docker-compose services
pg_backup:
  image: prodrigestivill/postgres-backup-local
  restart: unless-stopped
  environment:
    - POSTGRES_HOST=db
    - POSTGRES_DB=jarvis_prod
    - POSTGRES_USER=jarvis
    - POSTGRES_PASSWORD=STRONG_PASSWORD
    - SCHEDULE=@daily
    - BACKUP_DIR=/backups
  volumes:
    - ./backups:/backups
  networks:
    - internal
```

- Error tracking: integrate Sentry or similar in the API and set DSN via env.
- Rate limiting and security headers are already present via Express + Helmet; Caddy adds another layer.

---

### 13) First-time end-to-end checklist
- [ ] DNS A/AAAA records set for `api.example.com`.
- [ ] Droplet secured (UFW, SSH keys, non-root user).
- [ ] `.env.production` placed at `~/jarvis/.env.production`.
- [ ] `docker-compose.yml` + `Caddyfile` at `~/jarvis/docker/production/`.
- [ ] GHCR PAT created and added as `GHCR_PAT` secret.
- [ ] SSH secrets added to GitHub Actions.
- [ ] Push to `master` → image built and pushed.
- [ ] Deployment job runs and site is live at `https://api.example.com/health`.

If you want, we can also commit the production Dockerfile and compose files to this repo and wire the workflow automatically—say the word and I’ll add them.
