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

### Development Setup

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd productivity
   chmod +x scripts/setup/dev-setup.sh
   ./scripts/setup/dev-setup.sh
   ```

2. **Start development environment**:
   ```bash
   cd docker/development
   docker-compose up -d
   ```

3. **Verify setup**:
   - API: http://localhost:3000/health
   - Database: localhost:5432
   - Redis: localhost:6379

### Manual Setup (Alternative)

1. **Backend API**:
   ```bash
   cd backend/api
   npm install
   cp .env.example .env  # Update with your config
   npm run dev
   ```

2. **Database**:
   ```bash
   cd docker/development
   docker-compose up -d db redis
   ```

3. **Run tests**:
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

## 🔧 Configuration

### Environment Variables

Create `.env` files:

1. **Backend API** (`backend/api/.env`):
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/jarvis_dev
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-jwt-secret
   OPENAI_API_KEY=your-openai-key
   ANTHROPIC_API_KEY=your-anthropic-key
   ```

2. **Docker** (`docker/development/.env`):
   ```env
   OPENAI_API_KEY=your-openai-key
   ANTHROPIC_API_KEY=your-anthropic-key
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