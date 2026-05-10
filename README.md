# 🌏 Multi-Platform Scraper Suite

[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.40%2B-orange)](https://playwright.dev/)
[![Docker](https://img.shields.io/badge/Docker-24.0%2B-blue)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**Enterprise-grade web scraping suite** untuk multiple platform e-commerce dan food delivery di Asia Tenggara. Mendukung Shopee (Indonesia & Internasional), GrabFood, GoFood, dan ShopeeFood.

## ✨ Features

### 🛒 E-commerce Platforms
| Platform | Region | Features |
|----------|--------|----------|
| **Shopee Indonesia** | `shopee.co.id` | Product scraping, price monitoring, stock tracking |
| **Shopee International** | `sg`, `my`, `th`, `ph`, `vn`, `tw` | Cross-region price comparison, multi-language support |

### 🍔 Food Delivery Platforms
| Platform | Region | Features |
|----------|--------|----------|
| **GrabFood** | `sg`, `my`, `id`, `th`, `ph`, `vn` | Restaurant search, menu extraction, promo detection |
| **GoFood** | `id` | Merchant monitoring, product catalog, city-based search |
| **ShopeeFood** | `id`, `sg`, `my`, `th` | Restaurant discovery, menu scraping, delivery info |

### ⚙️ Core Capabilities
- ✅ **Bypass Anti-Bot** - Mengatasi 403 Forbidden, Cloudflare, dan bot detection
- ✅ **Dynamic Content** - Support SPA dengan JavaScript rendering
- ✅ **Multi-Selector Fallback** - 20+ selector per field, tahan perubahan struktur
- ✅ **Proxy Rotation** - Hindari IP blocking dengan rotating proxy (HTTP/HTTPS/SOCKS5)
- ✅ **Scheduled Scraping** - Cron job untuk scraping otomatis (hourly/daily/weekly)
- ✅ **REST API** - Unified API untuk semua platform
- ✅ **Webhook Notifications** - Real-time alerts ke Discord, Slack, Telegram
- ✅ **Monitoring Dashboard** - Grafana + Prometheus untuk observability
- ✅ **Docker Support** - Containerized deployment dengan docker-compose
- ✅ **Queue System** - Redis-based job queue untuk high throughput

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Scheduled Scraping](#scheduled-scraping)
- [Webhook Notifications](#webhook-notifications)
- [Monitoring](#monitoring)
- [Docker Deployment](#docker-deployment)
- [Proxy Configuration](#proxy-configuration)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/readloud/Multi-Platform-Scraper-Suite.git
cd scraper-suite

# Copy environment configuration
cp .env.example .env

# Edit .env with your settings
nano .env

# Deploy all services
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Check health status
./scripts/health-check.sh
```

### Manual Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Setup database
npx prisma generate
npx prisma migrate dev

npm i --save-dev prisma@latest                       │                                                                                     
npm i @prisma/client@latest 

# Start API server
npm start

# Or with nodemon for development
npm run dev
```

### Test the API

```bash
# Health check
curl http://localhost:3000/health

# Scrape Shopee Indonesia product
curl -X POST http://localhost:3000/api/shopee/id/product \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"url": "https://shopee.co.id/product/123/456"}'

# Search GrabFood restaurants
curl -X POST http://localhost:3000/api/grabfood/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"region": "id", "city": "jakarta", "keyword": "nasi goreng"}'
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NGINX Gateway (Port 80/443)                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐            ┌───────────────┐            ┌───────────────┐
│ Shopee ID     │            │ Shopee Intl   │            │ GrabFood      │
│ API :3001     │            │ API :3002     │            │ API :3003     │
│ Indonesia     │            │ SG/MY/TH/PH   │            │ SG/ID/MY/TH   │
└───────────────┘            └───────────────┘            └───────────────┘
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐            ┌───────────────┐            ┌───────────────┐
│ GoFood        │            │ ShopeeFood    │            │ Scheduler     │
│ API :3004     │            │ API :3005     │            │ (Cron Jobs)   │
│ Indonesia     │            │ ID/SG/MY/TH   │            │ :3006         │
└───────────────┘            └───────────────┘            └───────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Shared Infrastructure                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Redis Queue  │  │ PostgreSQL   │  │ Prometheus   │  │ Grafana      │   │
│  │ :6379        │  │ :5432        │  │ :9090        │  │ :3000        │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📦 Installation

### System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 18.0+ | 20.0+ |
| RAM | 2GB | 4GB+ |
| CPU | 2 cores | 4 cores+ |
| Disk Space | 5GB | 20GB+ |
| Docker | 24.0+ | Latest |

### Step-by-Step Installation

#### 1. Clone Repository

```bash
git clone https://github.com/readloud/Multi-Platform-Scraper-Suite.git
cd scraper-suite
```

#### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Playwright browsers
npx playwright install chromium --with-deps

# Install PostgreSQL (if not using Docker)
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

#### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed
```

#### 4. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
```

Required configuration:
```env
# API Configuration
PORT=3000
API_KEY=your-secure-api-key-here

# Database
DATABASE_URL="postgresql://scraper_user:password@localhost:5432/scraper_db"

# Redis
REDIS_URL="redis://localhost:6379"

# Webhook URLs (optional)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"
```

## ⚙️ Configuration

### Complete `.env` Configuration

```env
# ============================================
# Server Configuration
# ============================================
NODE_ENV=production
PORT=3000
API_KEY=your-super-secret-api-key-change-this
CORS_ORIGINS=*

# ============================================
# Database Configuration
# ============================================
DATABASE_URL=postgresql://scraper_user:password@postgres:5432/scraper_db
DB_POOL_MIN=2
DB_POOL_MAX=10

# ============================================
# Redis Configuration
# ============================================
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=
REDIS_DB=0

# ============================================
# Scraping Configuration
# ============================================
HEADLESS=true
TIMEOUT=45000
RETRY_ATTEMPTS=3
RETRY_DELAY=2000
MIN_REQUEST_INTERVAL=2000
CONCURRENT_SCRAPES=5

# ============================================
# Rate Limiting
# ============================================
RATE_LIMIT=100
RATE_LIMIT_WINDOW=60000

# ============================================
# Proxy Configuration (Optional)
# ============================================
PROXY_ENABLED=false
PROXY_FILE=./proxies.txt
PROXY_STRATEGY=round-robin
PROXY_ROTATION_INTERVAL=300000

# ============================================
# Webhook Configuration
# ============================================
DISCORD_WEBHOOK_URL=
SLACK_WEBHOOK_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_TIMEOUT=10000

# ============================================
# Logging Configuration
# ============================================
LOG_LEVEL=info
LOG_DIR=./logs
LOG_MAX_FILES=30
LOG_MAX_SIZE=20m

# ============================================
# Monitoring Configuration
# ============================================
METRICS_ENABLED=true
METRICS_PORT=9091
PROMETHEUS_PUSH_GATEWAY=

# ============================================
# Scheduler Configuration
# ============================================
SCHEDULER_ENABLED=true
SCHEDULER_TIMEZONE=Asia/Jakarta
```

## 📡 API Documentation

### Authentication

All API endpoints (except `/health`) require API key in headers:

```bash
x-api-key: your-api-key
```

### Shopee Indonesia Endpoints

#### Scrape Product
```http
POST /api/shopee/id/product
```

**Request Body:**
```json
{
  "url": "https://shopee.co.id/product/123/456",
  "options": {
    "headless": true,
    "timeout": 30000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Xiaomi Redmi Note 13 Pro",
    "price": "Rp 3.999.000",
    "priceBeforeDiscount": "Rp 4.999.000",
    "discount": "20%",
    "rating": "4.8",
    "ratingCount": "1.234",
    "soldCount": "567",
    "shopName": "Xiaomi Official Store",
    "images": ["https://cf.shopee.co.id/..."],
    "url": "https://shopee.co.id/...",
    "scrapedAt": "2026-05-05T10:30:00.000Z"
  }
}
```

#### Search Products
```http
POST /api/shopee/search
```

**Request Body:**
```json
{
  "region": "id",
  "keyword": "smartphone",
  "limit": 50
}
```

### Shopee International Endpoints

#### Scrape Product (Multi-Region)
```http
POST /api/shopee/intl/product
```

**Request Body:**
```json
{
  "region": "sg",
  "url": "https://shopee.sg/product/123/456"
}
```

#### Compare Prices Across Regions
```http
POST /api/shopee/compare
```

**Request Body:**
```json
{
  "shopId": "12345678",
  "itemId": "987654321",
  "regions": ["sg", "my", "ph", "th"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shopId": "12345678",
    "itemId": "987654321",
    "prices": {
      "sg": { "price": "S$ 399.00", "currency": "SGD" },
      "my": { "price": "RM 1299.00", "currency": "MYR" },
      "ph": { "price": "₱ 15999.00", "currency": "PHP" },
      "th": { "price": "฿ 10990.00", "currency": "THB" }
    }
  }
}
```

### GrabFood Endpoints

#### Search Restaurants
```http
POST /api/grabfood/search
```

**Request Body:**
```json
{
  "region": "id",
  "lat": -6.2088,
  "lng": 106.8456,
  "keyword": "nasi goreng",
  "limit": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "location": { "lat": -6.2088, "lng": 106.8456 },
    "totalFound": 50,
    "restaurants": [
      {
        "name": "Warung Nasi Goreng Makmur",
        "cuisine": "Indonesian",
        "rating": "4.7",
        "deliveryFee": "Rp 15000",
        "eta": "20-30 min",
        "isOpen": true
      }
    ]
  }
}
```

#### Search by City (Indonesia)
```http
POST /api/grabfood/id/search
```

**Request Body:**
```json
{
  "city": "jakarta",
  "keyword": "pizza",
  "limit": 30
}
```

**Supported Cities:** jakarta, surabaya, bandung, medan, semarang, makassar, palembang, denpasar, bekasi, tangerang, depok

#### Get Restaurant Menu
```http
POST /api/grabfood/menu
```

**Request Body:**
```json
{
  "region": "id",
  "restaurantId": "restaurant-123"
}
```

### GoFood Endpoints (Indonesia Only)

#### Search Merchants
```http
POST /api/gofood/search
```

**Request Body:**
```json
{
  "city": "jakarta",
  "keyword": "bakmi",
  "limit": 50
}
```

#### Get Merchant Products
```http
POST /api/gofood/products
```

**Request Body:**
```json
{
  "merchantId": "merchant-123"
}
```

### ShopeeFood Endpoints

#### Search Restaurants
```http
POST /api/shopeefood/search
```

**Request Body:**
```json
{
  "region": "id",
  "lat": -6.2088,
  "lng": 106.8456,
  "keyword": "sushi",
  "limit": 50
}
```

#### Get Restaurant Menu
```http
POST /api/shopeefood/menu
```

**Request Body:**
```json
{
  "region": "id",
  "restaurantId": "restaurant-123"
}
```

### Scheduler Endpoints

#### Get All Schedules
```http
GET /api/scheduler/schedules
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Shopee ID Daily Price Check",
      "platform": "shopee-id",
      "frequency": "daily",
      "cronExpression": "0 0 * * *",
      "isActive": true
    }
  ]
}
```

#### Create New Schedule
```http
POST /api/scheduler/schedules
```

**Request Body:**
```json
{
  "name": "Hourly GrabFood Trending",
  "platform": "grabfood",
  "frequency": "hourly",
  "target": "restaurants",
  "params": {
    "city": "jakarta",
    "limit": 100
  },
  "webhookUrl": "https://your-webhook.com/notify"
}
```

#### Apply Schedule Template
```http
POST /api/scheduler/schedules/templates/:templateName
```

**Available Templates:**
- `shopee_id_daily_price` - Daily price monitoring for Shopee Indonesia
- `grabfood_hourly_trending` - Hourly trending restaurants on GrabFood
- `shopee_intl_weekly_compare` - Weekly cross-region price comparison
- `gofood_daily_merchants` - Daily merchant monitoring on GoFood
- `shopeefood_hourly_status` - Hourly restaurant status on ShopeeFood

### Webhook Endpoints

#### Register Webhook
```http
POST /api/webhook/register
```

**Request Body:**
```json
{
  "name": "My Discord Bot",
  "url": "https://discord.com/api/webhooks/...",
  "events": ["scrape_success", "scrape_failure", "rate_limit"]
}
```

## ⏰ Scheduled Scraping

### Schedule Configuration Examples

#### Daily Price Monitoring (Shopee)
```json
{
  "name": "Monitor iPhone 15 Price",
  "platform": "shopee-id",
  "frequency": "daily",
  "cronExpression": "0 9 * * *",
  "target": "products",
  "params": {
    "productIds": ["12345678/987654321"],
    "fields": ["name", "price", "stock"]
  },
  "webhookUrl": "https://your-webhook.com/price-alert"
}
```

#### Hourly Trending Food (GrabFood)
```json
{
  "name": "Trending Breakfast Spots",
  "platform": "grabfood",
  "frequency": "hourly",
  "cronExpression": "0 6-10 * * *",
  "target": "restaurants",
  "params": {
    "city": "jakarta",
    "sortBy": "rating",
    "limit": 50
  }
}
```

#### Weekly Cross-Region Comparison (Shopee)
```json
{
  "name": "SEA Price Comparison",
  "platform": "shopee-intl",
  "frequency": "weekly",
  "cronExpression": "0 0 * * 1",
  "target": "compare",
  "params": {
    "regions": ["sg", "my", "ph", "th", "id"],
    "productIds": ["product-1", "product-2"]
  }
}
```

### Managing Schedules via API

```bash
# List all schedules
curl -X GET http://localhost:3000/api/scheduler/schedules \
  -H "x-api-key: your-api-key"

# Create new schedule
curl -X POST http://localhost:3000/api/scheduler/schedules \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "name": "My Schedule",
    "platform": "shopee-id",
    "frequency": "daily",
    "target": "products",
    "params": {"productIds": ["123/456"]}
  }'

# Run schedule immediately
curl -X POST http://localhost:3000/api/scheduler/schedules/1/run \
  -H "x-api-key: your-api-key"

# Delete schedule
curl -X DELETE http://localhost:3000/api/scheduler/schedules/1 \
  -H "x-api-key: your-api-key"
```

## 🔔 Webhook Notifications

### Supported Events

| Event | Description | Trigger |
|-------|-------------|---------|
| `scrape_start` | Scraping session started | Before each scrape |
| `scrape_success` | Scraping completed successfully | After successful scrape |
| `scrape_failure` | Scraping failed | On error |
| `rate_limit` | Rate limit approaching | When 80% exhausted |
| `blocked` | IP/Account blocked | On 403/429 response |
| `schedule_start` | Scheduled job started | Cron trigger |
| `schedule_complete` | Schedule job completed | After execution |
| `schedule_error` | Schedule job failed | On schedule error |
| `proxy_switch` | Proxy rotation occurred | When proxy changes |
| `data_saved` | Data saved to database | After storage |

### Webhook Payload Format

```json
{
  "event": "scrape_success",
  "timestamp": "2026-05-05T10:30:00.000Z",
  "webhookId": 1,
  "webhookName": "Discord Alerts",
  "data": {
    "platform": "shopee-id",
    "region": "id",
    "productId": "123/456",
    "productName": "Xiaomi Redmi Note 13 Pro",
    "price": "Rp 3.999.000",
    "duration": 15.3
  }
}
```

### Integration Examples

#### Discord Webhook

```javascript
// Your Discord server will receive rich embeds
{
  "embeds": [{
    "title": "🛒 Product Found: Xiaomi Redmi Note 13 Pro",
    "color": 0xee4d2d,
    "fields": [
      {"name": "Price", "value": "Rp 3.999.000", "inline": true},
      {"name": "Rating", "value": "4.8 ⭐", "inline": true},
      {"name": "Shop", "value": "Xiaomi Official Store", "inline": true}
    ]
  }]
}
```

#### Slack Webhook

```bash
# Slack message format
{
  "attachments": [{
    "color": "good",
    "title": "Scrape Success: Shopee Indonesia",
    "text": "Product: Xiaomi Redmi Note 13 Pro\nPrice: Rp 3.999.000\nRating: 4.8"
  }]
}
```

#### Telegram Bot

```bash
# Send message to Telegram channel
https://api.telegram.org/bot<TOKEN>/sendMessage
{
  "chat_id": "<CHAT_ID>",
  "text": "✅ Scrape successful!\nProduct: Xiaomi Redmi Note 13 Pro\nPrice: Rp 3.999.000",
  "parse_mode": "Markdown"
}
```

## 📊 Monitoring

### Grafana Dashboard

Access the dashboard at `http://localhost:3000` (default credentials: admin/admin)

**Dashboard Sections:**

1. **Scraping Success Rate** - Overall success percentage per platform
2. **Request Rate** - Requests per minute by platform and region
3. **Response Time** - P95/P99 latency metrics
4. **Error Distribution** - Breakdown of error types
5. **Queue Status** - Bull queue sizes (waiting/active/completed/failed)
6. **Proxy Health** - Proxy pool status and rotation metrics
7. **Rate Limit Usage** - Remaining quota per platform

### Prometheus Metrics

Available at `http://localhost:9090`

#### Key Metrics

```promql
# Scrape success rate
sum(rate(scrape_requests_total{status="success"}[5m])) / sum(rate(scrape_requests_total[5m])) * 100

# Average response time by platform
histogram_quantile(0.95, rate(scrape_duration_seconds_bucket[5m]))

# Error rate by type
sum by(error_type) (scrape_errors_total)

# Queue backlog
bull_queue_waiting_count

# Rate limit remaining
rate_limit_remaining
```

### Custom Queries

```bash
# Get metrics endpoint
curl http://localhost:9091/metrics

# Query Prometheus
curl 'http://localhost:9090/api/v1/query?query=scrape_requests_total'

# Get recent alerts
curl 'http://localhost:9090/api/v1/alerts'
```

## 🐳 Docker Deployment

### Build Images

```bash
# Build all images
docker-compose -f docker/docker-compose-all.yml build

# Build specific platform
docker build -f docker/Dockerfile.shopee-id -t shopee-id-scraper .
```

### Run Services

```bash
# Start all services
docker-compose -f docker/docker-compose-all.yml up -d

# Start specific service
docker-compose -f docker/docker-compose-all.yml up shopee-id-api

# View logs
docker-compose -f docker/docker-compose-all.yml logs -f shopee-id-api

# Scale services
docker-compose -f docker/docker-compose-all.yml up -d --scale shopee-id-api=3
```

### Environment Variables for Docker

```env
# .env file for docker-compose
API_KEY=your-api-key
DB_PASSWORD=secure_password
GRAFANA_PASSWORD=admin
WEBHOOK_URL=https://your-webhook.com
```

### Production Deployment

```bash
# 1. Build with production config
docker-compose -f docker/docker-compose-all.yml -f docker/docker-compose.prod.yml build

# 2. Run with resource limits
docker-compose -f docker/docker-compose-all.yml up -d \
  --scale shopee-id-api=2 \
  --scale grabfood-api=2

# 3. Setup SSL with Let's Encrypt
docker run -d \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $PWD/ssl:/etc/nginx/ssl \
  nginxproxy/acme-companion

# 4. Backup database
docker exec scraper-postgres pg_dump -U scraper_user scraper_db > backup.sql
```

## 🔄 Proxy Configuration

### Proxy File Format (`proxies.txt`)

```text
# HTTP proxies
http://user:pass@192.168.1.1:8080
http://192.168.1.2:8080

# HTTPS proxies
https://user:pass@192.168.1.3:443

# SOCKS5 proxies
socks5://192.168.1.4:1080
socks5://user:pass@192.168.1.5:1080
```

### Proxy Rotation Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| `round-robin` | Rotate through proxies sequentially | General purpose |
| `random` | Random proxy selection | Avoiding patterns |
| `least-used` | Use proxy with fewest requests | Load balancing |

### Configuration

```env
PROXY_ENABLED=true
PROXY_FILE=./proxies.txt
PROXY_STRATEGY=round-robin
PROXY_ROTATION_INTERVAL=300000  # 5 minutes
```

### API Endpoints for Proxy Management

```bash
# Get proxy statistics
curl -X GET http://localhost:3000/api/proxy/stats \
  -H "x-api-key: your-api-key"

# Reload proxies
curl -X POST http://localhost:3000/api/proxy/reload \
  -H "x-api-key: your-api-key"

# Add proxy dynamically
curl -X POST http://localhost:3000/api/proxy/add \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"url": "http://new-proxy:8080"}'
```

## 🔧 Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **403 Forbidden** | Enable proxies, increase delays, rotate user agents |
| **Timeout Error** | Increase `TIMEOUT` value, check network connectivity |
| **Missing Data** | Update selectors, check if page structure changed |
| **Captcha Detection** | Use residential proxies, increase `slowMo`, use non-headless mode |
| **Rate Limit Exceeded** | Increase `MIN_REQUEST_INTERVAL`, add more proxies |
| **Database Connection** | Check PostgreSQL is running, verify `DATABASE_URL` |
| **Redis Connection** | Ensure Redis is started, check `REDIS_URL` |
| **Playwright Error** | Run `npx playwright install chromium --with-deps` |

### Debug Mode

```bash
# Enable debug logging
DEBUG=shopee:* node api/server.js

# Run with visible browser
HEADLESS=false npm start

# Verbose logging
LOG_LEVEL=debug npm start
```

### Logs Location

```bash
# Application logs
./logs/shopee-id/combined.log
./logs/shopee-id/error.log

# Docker logs
docker logs shopee-id-scraper
docker logs scraper-scheduler

# Database logs
docker logs scraper-postgres
```

### Health Check Commands

```bash
# Check all services
./scripts/health-check.sh

# Check specific service
curl http://localhost:3001/health  # Shopee ID
curl http://localhost:3002/health  # Shopee Intl
curl http://localhost:3003/health  # GrabFood

# Check queue status
redis-cli LLEN bull:scrape-queue:waiting

# Check database
psql -d scraper_db -c "SELECT COUNT(*) FROM scrape_executions;"
```

### Performance Tuning

```env
# Increase concurrent scrapes
CONCURRENT_SCRAPES=10

# Increase timeout for slow pages
TIMEOUT=90000

# Reduce delays for faster scraping
MIN_REQUEST_INTERVAL=500

# Scale API workers
pm2 start api/server.js -i max
```

## 📖 API Reference

### Full API Endpoints List

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Shopee Indonesia** |||
| POST | `/api/shopee/id/product` | Scrape single product |
| POST | `/api/shopee/search` | Search products |
| POST | `/api/shopee/id/recommendations` | Get product recommendations |
| **Shopee International** |||
| POST | `/api/shopee/intl/product` | Scrape product by region |
| POST | `/api/shopee/compare` | Cross-region price comparison |
| **GrabFood** |||
| POST | `/api/grabfood/search` | Search restaurants |
| POST | `/api/grabfood/id/search` | Search by city (Indonesia) |
| POST | `/api/grabfood/menu` | Get restaurant menu |
| **GoFood** |||
| POST | `/api/gofood/search` | Search merchants |
| POST | `/api/gofood/products` | Get merchant products |
| **ShopeeFood** |||
| POST | `/api/shopeefood/search` | Search restaurants |
| POST | `/api/shopeefood/menu` | Get restaurant menu |
| **Scheduler** |||
| GET | `/api/scheduler/schedules` | List schedules |
| POST | `/api/scheduler/schedules` | Create schedule |
| PUT | `/api/scheduler/schedules/:id` | Update schedule |
| DELETE | `/api/scheduler/schedules/:id` | Delete schedule |
| POST | `/api/scheduler/schedules/:id/run` | Run schedule immediately |
| GET | `/api/scheduler/executions` | Get execution history |
| **Webhook** |||
| POST | `/api/webhook/register` | Register webhook |
| DELETE | `/api/webhook/:id` | Delete webhook |
| GET | `/api/webhook/events` | List supported events |
| **Proxy** |||
| GET | `/api/proxy/stats` | Get proxy statistics |
| POST | `/api/proxy/reload` | Reload proxies |
| POST | `/api/proxy/add` | Add proxy dynamically |
| **Monitoring** |||
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/metrics/custom` | Custom metrics |

### Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created (new schedule/webhook) |
| 400 | Bad request (invalid parameters) |
| 401 | Unauthorized (invalid API key) |
| 403 | Forbidden (rate limit exceeded) |
| 404 | Not found |
| 429 | Too many requests |
| 500 | Internal server error |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Contribution - see [Contribution](contribution.md) file

### Development Setup

```bash
# Clone repository
git clone https://github.com/readloud/Multi-Platform-Scraper-Suite.git
cd scraper-suite

# Install dependencies
npm install

# Setup pre-commit hooks
npx husky install

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Adding New Platform

1. Create platform directory: `src/platforms/new-platform/`
2. Extend `BaseScraper` class
3. Implement required methods
4. Add to API server
5. Create Dockerfile
6. Update docker-compose
7. Add documentation
8. Create tests

### Code Style

- Use ES6+ syntax
- Follow Airbnb style guide
- Write JSDoc comments
- Add error handling
- Include test coverage

### Pull Request Process

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request
6. Wait for CI checks
7. Get code review

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- [Playwright](https://playwright.dev/) - Browser automation
- [Express](https://expressjs.com/) - Web framework
- [Bull](https://optimalbits.github.io/bull/) - Queue system
- [Prometheus](https://prometheus.io/) - Metrics collection
- [Grafana](https://grafana.com/) - Dashboard visualization
- [Prisma](https://www.prisma.io/) - Database ORM

## 📞 Support

- **Documentation**: [https://docs.scraper-suite.com](https://docs.scraper-suite.com)
- **Issues**: [GitHub Issues](https://github.com/readloud/multi-platform-scraper-suite/issues)
- **Discord**: [Join our Discord](https://discord.gg/reasloud/)
- **Source**: [shopee-sdk](https://github.com/congminh1254/shopee-sdk) | [grab-api-sdk](https://github.com/grab/grabfood-api-sdk-node

For support, email support@readloud.github.io or join our Slack channel.

## ⚠️ Disclaimer

This tool is for **educational purposes only**. Please review and comply with each platform's Terms of Service before scraping. Respect robots.txt and implement appropriate rate limiting. The authors are not responsible for any misuse of this software.

---

[⬆ Back to Top](#multi-platform-scraper-suite)
```

---

## 📁 File Structure untuk README Images

```bash
# Buat direktori untuk assets
mkdir -p docs/assets

# Tambahkan logo (opsional)
docs/assets/
├── logo.png
├── architecture.png
├── dashboard-screenshot.png
└── api-reference.png
```

---

## 🎯 Catatan Penting

1. **Ganti placeholder** seperti `yourusername`, `your-api-key`, `your-webhook-url` dengan nilai sebenarnya
2. **Tambahkan badge** status build jika menggunakan CI/CD
3. **Sertakan link** ke dokumentasi live jika ada
4. **Update versi** sesuai dengan rilis terbaru

Rekomendasi: Untuk development, gunakan SQLite dengan String (solusi di atas). Untuk production, gunakan PostgreSQL agar bisa menggunakan tipe data asli.
