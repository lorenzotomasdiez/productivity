#!/bin/bash

# Jarvis Development Environment Setup Script
# This script sets up the complete development environment for Jarvis

set -e  # Exit on any error

echo "🚀 Setting up Jarvis development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js version must be 20 or higher. Current version: $(node --version)"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop"
        exit 1
    fi
    
    print_success "All requirements satisfied"
}

# Setup backend dependencies
setup_backend() {
    print_status "Setting up backend dependencies..."
    
    cd backend/api
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Copy environment file
    if [ ! -f .env ]; then
        print_status "Creating .env file from example..."
        cp .env.example .env
        print_warning "Please update .env file with your actual API keys and configuration"
    fi
    
    cd ../..
    print_success "Backend setup complete"
}

# Setup Docker environment
setup_docker() {
    print_status "Setting up Docker development environment..."
    
    cd docker/development
    
    # Copy environment file
    if [ ! -f .env ]; then
        print_status "Creating Docker .env file from example..."
        cp .env.example .env
        print_warning "Please update docker/development/.env file with your API keys"
    fi
    
    cd ../..
    print_success "Docker environment setup complete"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create logs directory
    mkdir -p backend/api/logs
    
    # Create uploads directory
    mkdir -p backend/api/uploads
    
    # Create SSL certificates directory
    mkdir -p backend/api/certs
    
    print_success "Directories created"
}

# Setup database
setup_database() {
    print_status "Starting database services..."
    
    cd docker/development
    
    # Start only database and Redis for initial setup
    docker-compose up -d db redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Test database connection
    if docker-compose exec -T db psql -U jarvis -d jarvis_dev -c "SELECT 1" &> /dev/null; then
        print_success "Database is ready and schema loaded"
    else
        print_error "Database setup failed"
        exit 1
    fi
    
    cd ../..
}

# Run initial tests
run_tests() {
    print_status "Running initial tests..."
    
    cd backend/api
    
    # Run tests
    if npm test; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed, but continuing setup"
    fi
    
    cd ../..
}

# Start development services
start_services() {
    print_status "Starting development services..."
    
    cd docker/development
    
    # Start core services (API + database + Redis)
    docker-compose up -d api db redis
    
    print_status "Waiting for services to start..."
    sleep 15
    
    # Check if API is healthy
    if curl -f http://localhost:3000/health &> /dev/null; then
        print_success "API server is running and healthy"
    else
        print_warning "API server might not be ready yet. Check logs with: docker-compose logs api"
    fi
    
    cd ../..
}

# Print setup completion info
print_completion_info() {
    echo
    print_success "🎉 Jarvis development environment setup complete!"
    echo
    echo "📋 What's running:"
    echo "   • API Server: http://localhost:3000"
    echo "   • Health Check: http://localhost:3000/health"
    echo "   • PostgreSQL: localhost:5432"
    echo "   • Redis: localhost:6379"
    echo
    echo "🛠️  Available commands:"
    echo "   • Start all services: cd docker/development && docker-compose up -d"
    echo "   • Stop all services: cd docker/development && docker-compose down"
    echo "   • View logs: cd docker/development && docker-compose logs -f [service]"
    echo "   • Run tests: cd backend/api && npm test"
    echo "   • Development server: cd backend/api && npm run dev"
    echo
    echo "🔧 Optional services (run with docker-compose --profile [profile] up -d):"
    echo "   • Full stack: --profile full (includes AI service and research engine)"
    echo "   • Admin tools: --profile admin (includes Adminer and Redis Commander)"
    echo "   • Testing: --profile testing (includes test database)"
    echo
    echo "📚 Next steps:"
    echo "   1. Update .env files with your API keys"
    echo "   2. Set up iOS/macOS development environment"
    echo "   3. Begin TDD implementation phase"
    echo
    print_warning "Remember to update your API keys in the .env files!"
}

# Main execution
main() {
    check_requirements
    setup_backend
    setup_docker
    create_directories
    setup_database
    run_tests
    start_services
    print_completion_info
}

# Run main function
main "$@"