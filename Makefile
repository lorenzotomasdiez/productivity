SHELL := /bin/bash

# Paths
API_DIR := backend/api
COMPOSE := docker-compose -f docker/development/docker-compose.yml

# Default target
.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk -F':|##' '{printf "  \033[36m%-22s\033[0m %s\n", $$1, $$NF}'

# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------
.PHONY: setup setup-api-env setup-docker-env
setup: setup-api-env setup-docker-env ## One-time project setup (env files)

setup-api-env: ## Create backend/api/.env from example if missing
	@test -f $(API_DIR)/.env || cp $(API_DIR)/.env.example $(API_DIR)/.env

setup-docker-env: ## Create docker/development/.env from example if missing
	@test -f docker/development/.env || cp docker/development/.env.example docker/development/.env

# -----------------------------------------------------------------------------
# Docker (recommended)
# -----------------------------------------------------------------------------
.PHONY: docker-up docker-down docker-logs docker-ps docker-up-full docker-up-admin docker-up-testing

docker-up: ## Start API + Postgres + Redis in background
	$(COMPOSE) up -d

docker-up-full: ## Start full stack (adds AI service + research engine)
	$(COMPOSE) --profile full up -d

docker-up-admin: ## Start admin tools (Adminer + Redis Commander)
	$(COMPOSE) --profile admin up -d

docker-up-testing: ## Start testing profile (separate test DB)
	$(COMPOSE) --profile testing up -d

docker-down: ## Stop and remove all services (keeps volumes)
	$(COMPOSE) down

docker-logs: ## Tail API logs from Docker
	$(COMPOSE) logs -f api

docker-ps: ## Show running compose services
	$(COMPOSE) ps

# -----------------------------------------------------------------------------
# Databases & Cache (standalone)
# -----------------------------------------------------------------------------
.PHONY: db-up db-down db-recreate

db-up: ## Start only Postgres and Redis
	$(COMPOSE) up -d db redis

db-down: ## Stop Postgres and Redis
	$(COMPOSE) stop db redis

db-recreate: ## Recreate DB containers and volumes (DANGEROUS: wipes data)
	$(COMPOSE) down -v && $(COMPOSE) up -d db redis

# -----------------------------------------------------------------------------
# API (Node.js / Express)
# -----------------------------------------------------------------------------
.PHONY: api-install api-dev api-run api-test api-lint api-typecheck api-health

api-install: ## Install API dependencies
	npm --prefix $(API_DIR) install

api-dev: ## Run API with autoreload (nodemon + ts-node) sourcing .env
	cd $(API_DIR) && set -a && [ -f .env ] && . ./.env || true; set +a; npx nodemon --exec "ts-node --esm src/server.ts"

api-run: ## Run API once (ts-node) sourcing .env
	cd $(API_DIR) && set -a && [ -f .env ] && . ./.env || true; set +a; npx ts-node --esm src/server.ts

api-test: ## Run API tests
	npm --prefix $(API_DIR) test

api-lint: ## Lint API source
	npm --prefix $(API_DIR) run lint

api-typecheck: ## Type-check API (no emit)
	npm --prefix $(API_DIR) run typecheck

api-health: ## Check API health endpoint
	curl -fsS http://localhost:3000/health | jq . || true
