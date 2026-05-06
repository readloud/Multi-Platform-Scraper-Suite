#!/bin/bash

# Multi-Platform Scraper Deployment Script

set -e

echo "🚀 Starting deployment..."

# Load environment variables
source .env

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check service health
check_health() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "Waiting for $service..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            echo -e "${GREEN} OK${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo -e "${RED} FAILED${NC}"
    return 1
}

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p output/{shopee-id,shopee-intl,grabfood,gofood,shopeefood}
mkdir -p logs/{shopee-id,shopee-intl,grabfood,gofood,shopeefood,scheduler,webhook}
mkdir -p screenshots
mkdir -p tokens
mkdir -p ssl

# Build all Docker images
echo "🐳 Building Docker images..."
docker-compose -f docker/docker-compose-all.yml build

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Start all services
echo "▶️ Starting services..."
docker-compose -f docker/docker-compose-all.yml up -d

# Wait for services to be ready
sleep 10

# Check health of each service
check_health "Shopee ID API" 3001
check_health "Shopee International API" 3002
check_health "GrabFood API" 3003
check_health "GoFood API" 3004
check_health "ShopeeFood API" 3005
check_health "Grafana" 3000
check_health "Prometheus" 9090

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Access URLs:"
echo "   API Gateway: http://localhost:80"
echo "   Grafana Dashboard: http://localhost:3000 (admin/admin)"
echo "   Prometheus: http://localhost:9090"
echo ""
echo "📋 Available endpoints:"
echo "   POST /api/shopee/id/product"
echo "   POST /api/shopee/intl/product"
echo "   POST /api/grabfood/search"
echo "   POST /api/gofood/search"
echo "   POST /api/shopeefood/search"
echo ""
echo "📅 Scheduler API:"
echo "   GET  /api/scheduler/schedules"
echo "   POST /api/scheduler/schedules"
echo ""
echo "🔔 Webhook API:"
echo "   POST /api/webhook/register"
echo ""
echo "📊 Metrics:"
echo "   GET /metrics"