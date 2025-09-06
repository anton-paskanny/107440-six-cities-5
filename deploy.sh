#!/bin/bash

# Production Deployment Script for Six Cities Backend
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production file not found. Creating from template..."
    cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Database Configuration
DB_HOST=db
DB_PORT=27017
DB_NAME=six-cities
DB_USER=admin
DB_PASSWORD=change_me_secure_password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=change_me_secure_redis_password

# JWT Configuration
JWT_SECRET=change_me_very_secure_jwt_secret

# File Upload Configuration
UPLOAD_DIRECTORY=/app/uploads
STATIC_DIRECTORY_PATH=/app/static

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_PUBLIC=100
RATE_LIMIT_MAX_AUTH=5
RATE_LIMIT_MAX_UPLOAD=10
RATE_LIMIT_MAX_USER_API=1000

# Request Size Limits
MAX_REQUEST_SIZE=10mb
EOF
    echo "📝 Please edit .env.production with your production values before continuing."
    echo "   Especially change the passwords and JWT secret!"
    exit 1
fi

echo "🔧 Building production image..."
docker-compose -f $COMPOSE_FILE build --no-cache

echo "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down

echo "🚀 Starting production services..."
docker-compose -f $COMPOSE_FILE up -d

echo "⏳ Waiting for services to be healthy..."
sleep 30

echo "🔍 Checking service health..."
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Application is healthy and running!"
    echo "🌐 Application available at: http://localhost:4000"
    echo "📊 Health check: http://localhost:4000/health"
else
    echo "❌ Application health check failed!"
    echo "📋 Checking logs..."
    docker-compose -f $COMPOSE_FILE logs app
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  Stop services: docker-compose -f $COMPOSE_FILE down"
echo "  Restart app: docker-compose -f $COMPOSE_FILE restart app"
echo "  Scale app: docker-compose -f $COMPOSE_FILE up -d --scale app=3"
