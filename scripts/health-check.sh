#!/bin/bash

# Health check script for all services

API_KEY=${API_KEY:-"dev-key-123"}
BASE_URL=${BASE_URL:-"http://localhost"}

echo "🔍 Running health check..."

# Check each platform
platforms=(
    "shopee-id:3001"
    "shopee-intl:3002"
    "grabfood:3003"
    "gofood:3004"
    "shopeefood:3005"
)

all_healthy=true

for platform in "${platforms[@]}"; do
    name=${platform%:*}
    port=${platform#*:}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "x-api-key: $API_KEY" \
        "$BASE_URL:$port/health")
    
    if [ "$response" = "200" ]; then
        echo "✅ $name: healthy"
    else
        echo "❌ $name: unhealthy (HTTP $response)"
        all_healthy=false
    fi
done

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: healthy"
else
    echo "❌ Redis: unhealthy"
    all_healthy=false
fi

# Check PostgreSQL
if pg_isready -h localhost -U scraper_user > /dev/null 2>&1; then
    echo "✅ PostgreSQL: healthy"
else
    echo "❌ PostgreSQL: unhealthy"
    all_healthy=false
fi

# Check Grafana
if curl -s "http://localhost:3000/api/health" > /dev/null 2>&1; then
    echo "✅ Grafana: healthy"
else
    echo "❌ Grafana: unhealthy"
    all_healthy=false
fi

if [ "$all_healthy" = true ]; then
    echo -e "\n🎉 All services are healthy!"
    exit 0
else
    echo -e "\n⚠️ Some services are unhealthy!"
    exit 1
fi