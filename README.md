# Jarvis Personal Life Management System

A comprehensive, AI-powered productivity platform that centralizes and optimizes all important aspects of personal life through native mobile and desktop experiences with intelligent automation.

## 🎯 Project Status

**Current Phase**: Development Foundation Complete ✅  
**Next Phase**: TDD Implementation  

### ✅ Completed
- Complete project architecture and documentation
- Production-ready OpenAPI specification (85+ endpoints)
- Backend API foundation (Node.js + Express)
- iOS/macOS shared packages (Swift Package Manager)
- Docker development environment
- Comprehensive testing strategy and examples

### 🔄 In Progress
- iOS/macOS Xcode projects
- TDD implementation phase

## 🏗️ Architecture

- **Backend**: Node.js + Express (main API) + Python + FastAPI (AI service)
- **Frontend**: Native SwiftUI apps for iOS and macOS
- **Database**: PostgreSQL 15+ with Redis caching
- **AI Integration**: OpenAI GPT-4 + Anthropic Claude
- **Deployment**: Docker containers on Digital Ocean

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop
- Xcode (for iOS/macOS development)

### Fastest path (Makefile)

1. Clone and initialize env files:
   ```bash
   git clone <repository>
   cd productivity
   make setup
   ```

2. Start API + PostgreSQL + Redis:
   ```bash
   make docker-up
   ```

3. Verify:
   - API: http://localhost:3000/health
   - Database: localhost:5432
   - Redis: localhost:6379

4. Useful during development:
   ```bash
   make docker-logs     # tail API logs
   make docker-down     # stop stack
   make help            # list all targets
   ```

### Local API without full stack (Makefile)

Run DB/Redis via Docker, API locally with Node:

```bash
# Start DB + Redis only
make db-up

# Install deps and run API (auto-reload)
make api-install
make api-dev

# Health check
make api-health
```

### Manual setup (no Makefile)

1. Backend API
   ```bash
   cd backend/api
   npm install
   cp .env.example .env  # Update with your config
   # Start the server entrypoint
   npx ts-node --esm src/server.ts
   ```

2. Database/Cache
   ```bash
   cd docker/development
   docker-compose up -d db redis
   ```

3. Run tests
   ```bash
   cd backend/api
   npm test
   ```

## 📁 Project Structure

```
├── backend/api/           # Main API server (Node.js + Express)
├── ios/                   # iOS shared packages (Swift)
├── macOS/                 # macOS app structure
├── database/              # PostgreSQL schema and seed data
├── docker/                # Docker development environment
├── scripts/               # Setup and deployment scripts
├── openapi.yaml          # Complete API specification
└── docs/                 # Architecture and strategy documents
```

## 🧪 Testing

The project follows strict Test-Driven Development (TDD):

- **Unit Tests (70%)**: Business logic, models, services
- **Integration Tests (20%)**: API endpoints, database operations
- **End-to-End Tests (10%)**: Complete user workflows

```bash
# Run all tests
npm test

# or via Makefile from repo root
make api-test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🐳 Docker Services

### Core Services (default)
```bash
docker-compose up -d
```
- API server (port 3000)
- PostgreSQL (port 5432)
- Redis (port 6379)

Makefile shortcuts from repo root:
```bash
make docker-up           # same as above
make docker-up-full      # includes AI service + research engine
make docker-up-admin     # admin tools
make docker-down
```

### Full Stack
```bash
docker-compose --profile full up -d
```
- Includes AI service (port 8000)
- Research engine (port 3001)

### Admin Tools
```bash
docker-compose --profile admin up -d
```
- Adminer database UI (port 8080)
- Redis Commander (port 8081)

### Testing Environment
```bash
docker-compose --profile testing up -d
```
- Includes separate test database (port 5433)

## 🧰 Makefile

Common targets from repo root:

- **make setup**: create `.env` files from examples
- **make docker-up/down**: start/stop API + DB + Redis
- **make db-up**: start only Postgres + Redis
- **make api-install**: install API dependencies
- **make api-dev**: run API with autoreload
- **make api-test**: run API tests
- **make help**: list available targets

## 🔧 Configuration

### Environment Variables

The application uses three main environment configurations:

1. **Backend API** (`backend/api/.env`):
   - Copy from `backend/api/.env.example`
   - Contains all application configuration variables
   - Used for local development and testing

2. **Docker Development** (`docker/development/.env`):
   - Copy from `docker/development/.env.example`
   - Mirrors API variables with Docker-specific defaults
   - Used when running with Docker Compose

3. **Production** (`.env.production`):
   - Copy from `.env.production.example`
   - Contains production-specific values
   - Used for deployment

#### Required Variables

**Core Configuration:**
- `NODE_ENV`: Environment (development/test/production)
- `PORT`: API server port (default: 3000)

**Database:**
- `DATABASE_URL`: PostgreSQL connection string
- `TEST_DATABASE_URL`: Test database connection string
- `DB_POOL_MIN/MAX/IDLE`: Connection pool settings

**Authentication:**
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `JWT_EXPIRY`: Token expiration time
- `JWT_REFRESH_EXPIRY`: Refresh token expiration

**External Services:**
- `REDIS_URL`: Redis connection string
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `ANTHROPIC_API_KEY`: Anthropic API key for AI features

**Apple Sign In:**
- `APPLE_TEAM_ID`: Apple Developer Team ID
- `APPLE_KEY_ID`: Apple Sign In key ID
- `APPLE_PRIVATE_KEY_PATH`: Path to private key file
- `APPLE_CLIENT_ID`: Apple app bundle identifier

#### Optional Variables

**Rate Limiting:**
- `RATE_LIMIT_WINDOW_MS`: Rate limit window (default: 15min)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window (default: 100)

**CORS:**
- `CORS_ORIGIN`: Allowed origins (comma-separated)

**Logging:**
- `LOG_LEVEL`: Log level (default: info)

**File Upload:**
- `MAX_FILE_SIZE`: Max file size in bytes (default: 10MB)
- `UPLOAD_DIR`: Upload directory path

**Monitoring:**
- `PROMETHEUS_PORT`: Prometheus metrics port
- `HEALTH_CHECK_INTERVAL`: Health check frequency

#### Quick Setup

```bash
# Backend API
cp backend/api/.env.example backend/api/.env
# Edit with your actual values

# Docker Development
cp docker/development/.env.example docker/development/.env
# Edit with your actual values

# Production (when deploying)
cp .env.production.example .env.production
# Edit with production values
```

## 📱 iOS/macOS Development

### Shared Packages
- **JarvisCore**: Business logic models
- **JarvisAPI**: API networking layer  
- **JarvisUI**: Shared UI components

### Requirements
- iOS 17.0+
- macOS 14.0+
- Xcode 15.0+
- Swift 5.9+

## 🎨 Core Features (Planned)

### MVP Features
- **Dashboard**: Unified life overview with progress tracking
- **AI Assistant**: Full-context Jarvis chat interface
- **Life Areas**: Customizable tracking categories
- **Goals**: Multi-type goal system (numeric, habit, milestone)
- **Progress Tracking**: Visual progress with analytics
- **Apple Integration**: HealthKit, Calendar, Reminders sync

### AI Automation
- **Smart Reminders**: Context-aware notifications
- **Email Management**: Intelligent filtering and responses
- **Research Engine**: Automated content generation
- **Insights**: AI-generated progress analysis

## 📖 API Documentation

- **OpenAPI Spec**: `openapi.yaml` (85+ endpoints)
- **Interactive Docs**: Available when server running
- **Health Check**: `GET /health`

Key endpoints:
- `POST /api/v1/auth/apple-signin` - Apple Sign In
- `GET /api/v1/goals` - Fetch goals
- `POST /api/v1/goals` - Create goal
- `GET /api/v1/life-areas` - Fetch life areas
- `POST /api/v1/chat/conversations` - AI chat

## 🔒 Security

- Apple Sign In authentication
- JWT tokens with refresh rotation
- Rate limiting and CORS protection
- Input validation and sanitization
- Hashed token storage
- TLS encryption in production

## 📊 Monitoring & Logging

- Winston logging with rotation
- Request/response logging
- Error tracking with incident IDs
- Health check endpoints
- Performance monitoring hooks

## 🤝 Contributing

1. Follow TDD approach - write tests first
2. Use conventional commits
3. Maintain 85%+ test coverage
4. Update documentation
5. Follow Swift/JavaScript style guides

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

- Create an issue for bugs/features
- Check existing documentation
- Review test examples for usage patterns

---

**Built with ❤️ using Test-Driven Development**