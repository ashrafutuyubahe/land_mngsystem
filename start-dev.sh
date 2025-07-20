#!/bin/bash

# Land Administration API - Development Setup Script
# This script sets up the complete development environment with Redis and ClickHouse

echo "🚀 Starting Land Administration API Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Docker Compose file found"

# Start Docker services
echo ""
echo "📦 Starting Docker services (Redis & ClickHouse)..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check Redis connectivity
echo ""
echo "🔍 Checking Redis connectivity..."
if docker exec $(docker-compose ps -q redis) redis-cli -a myStrongPassword ping > /dev/null 2>&1; then
    echo "✅ Redis is ready and accepting connections"
else
    echo "⚠️  Redis might still be starting up. Check logs with: docker-compose logs redis"
fi

# Check ClickHouse connectivity
echo ""
echo "🔍 Checking ClickHouse connectivity..."
if curl -s http://localhost:8123/ping > /dev/null 2>&1; then
    echo "✅ ClickHouse is ready and accepting connections"
else
    echo "⚠️  ClickHouse might still be starting up. Check logs with: docker-compose logs clickhouse"
fi

# Install dependencies if needed
echo ""
echo "📚 Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install
    echo "✅ Dependencies installed"
else
    echo "⚠️  package.json not found. Please ensure you're in the project root."
fi

# Show service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📋 Available Services:"
echo "   • Redis:      localhost:6379 (password: myStrongPassword)"
echo "   • ClickHouse: localhost:8123 (HTTP) / localhost:9000 (Native)"
echo "   • API:        localhost:3000 (after npm run start:dev)"
echo ""
echo "🛠️  Quick Commands:"
echo "   • Start API:        npm run start:dev"
echo "   • View logs:        docker-compose logs -f"
echo "   • Stop services:    docker-compose down"
echo "   • Restart services: docker-compose restart"
echo ""
echo "📖 See REDIS_LAND_TRANSFER_GUIDE.md for Redis integration details"
echo ""
echo "✨ Happy coding!"
