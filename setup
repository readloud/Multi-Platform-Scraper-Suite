# 🚀 Setup & Installation Guide

## 📋 Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| Docker | 24.0+ |
| Docker Compose | 2.20+ |
| PostgreSQL | 15+ (optional, using Docker) |
| Redis | 7+ (optional, using Docker) |

---

## 🐳 Quick Start with Docker (Recommended)

### 1. Clone Repository

```bash
git clone https://github.com/readloud/Multi-Platform-Scraper-Suite.git
cd Multi-Platform-Scraper-Suite
```

### 2. Copy Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi Anda:

```env
# Wajib diisi
API_KEY=your-secure-api-key-here
DB_PASSWORD=secure_password

# Optional
PORT=3000
HEADLESS=true
LOG_LEVEL=info
```

### 3. Deploy All Services

```bash
# Beri izin execute pada script
chmod +x scripts/deploy.sh

# Jalankan deployment
./scripts/deploy.sh
```

Atau dengan docker-compose manual:

```bash
docker-compose -f docker/docker-compose-all.yml up -d
```

### 4. Health Check

```bash
./scripts/health-check.sh
```

Expected output:

```
✅ shopee-id: healthy
✅ shopee-intl: healthy
✅ grabfood: healthy
✅ gofood: healthy
✅ shopeefood: healthy
✅ Redis: healthy
✅ PostgreSQL: healthy
✅ Grafana: healthy

🎉 All services are healthy!
```

### 5. Test API

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2026-05-05T10:30:00.000Z",
  "platforms": ["shopee-id", "shopee-intl", "grabfood", "gofood", "shopeefood"]
}
```

---

## 🖥️ Manual Installation (Without Docker)

### 1. Install Dependencies

```bash
npm install

# Install Playwright browser
npx playwright install chromium --with-deps
```

### 2. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init
```

### 3. Configuration

```bash
# Copy default config
cp config/default.json config/local.json

# Edit sesuai kebutuhan
nano config/local.json
```

### 4. Run API Server

```bash
# Production
node api/server.js

# Development with auto-reload
npm run dev

# Or with PM2 (production)
pm2 start api/server.js --name scraper-api
```

---

## 🐳 Docker Manual Deployment (Per Platform)

### Build Individual Images

```bash
# Shopee Indonesia
docker build -f docker/Dockerfile.shopee-id -t shopee-id-scraper .

# Shopee International
docker build -f docker/Dockerfile.shopee-intl -t shopee-intl-scraper .

# GrabFood
docker build -f docker/Dockerfile.grabfood -t grabfood-scraper .

# GoFood
docker build -f docker/Dockerfile.gofood -t gofood-scraper .

# ShopeeFood
docker build -f docker/Dockerfile.shopeefood -t shopeefood-scraper .
```

### Run Individual Containers

```bash
# Shopee Indonesia (port 3001)
docker run -d -p 3001:3001 --name shopee-id shopee-id-scraper

# Shopee International (port 3002)
docker run -d -p 3002:3002 --name shopee-intl shopee-intl-scraper

# GrabFood (port 3003)
docker run -d -p 3003:3003 --name grabfood grabfood-scraper

# GoFood (port 3004)
docker run -d -p 3004:3004 --name gofood gofood-scraper

# ShopeeFood (port 3005)
docker run -d -p 3005:3005 --name shopeefood shopeefood-scraper
```

---

## 🔧 Testing API Endpoints

### Shopee Indonesia

```bash
# Scrape product by URL
curl -X POST http://localhost:3000/api/shopee/id/product \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"url": "https://shopee.co.id/product/12345678/987654321"}'

# Scrape product by ID
curl -X POST http://localhost:3000/api/shopee/id/product \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"shopId": "12345678", "itemId": "987654321"}'

# Search products
curl -X POST http://localhost:3000/api/shopee/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"region": "id", "keyword": "smartphone", "limit": 20}'
```

### Shopee International

```bash
# Scrape from Singapore
curl -X POST http://localhost:3000/api/shopee/intl/product \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"region": "sg", "url": "https://shopee.sg/product/123/456"}'

# Compare prices across regions
curl -X POST http://localhost:3000/api/shopee/compare \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"shopId": "12345678", "itemId": "987654321", "regions": ["sg", "my", "ph", "th"]}'
```

### GrabFood

```bash
# Search by coordinates
curl -X POST http://localhost:3000/api/grabfood/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"region": "id", "lat": -6.2088, "lng": 106.8456, "keyword": "nasi goreng"}'

# Search by city (Indonesia)
curl -X POST http://localhost:3000/api/grabfood/id/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"city": "jakarta", "keyword": "pizza", "limit": 30}'

# Get restaurant menu
curl -X POST http://localhost:3000/api/grabfood/menu \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"region": "id", "restaurantId": "restaurant-123"}'
```

### GoFood

```bash
# Search by city
curl -X POST http://localhost:3000/api/gofood/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"city": "jakarta", "keyword": "bakmi", "limit": 50}'

# Search by coordinates
curl -X POST http://localhost:3000/api/gofood/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"lat": -6.2088, "lng": 106.8456, "keyword": "nasi goreng"}'

# Get merchant products
curl -X POST http://localhost:3000/api/gofood/products \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"merchantId": "merchant-123"}'
```

### ShopeeFood

```bash
# Search restaurants
curl -X POST http://localhost:3000/api/shopeefood/search \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"region": "id", "lat": -6.2088, "lng": 106.8456, "keyword": "sushi", "limit": 30}'

# Get restaurant menu
curl -X POST http://localhost:3000/api/shopeefood/menu \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"region": "id", "restaurantId": "restaurant-123"}'
```

---

## 📅 Scheduler API

### Create Scheduled Job

```bash
curl -X POST http://localhost:3000/api/scheduler/schedules \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "name": "Daily Price Check",
    "platform": "shopee-id",
    "frequency": "daily",
    "target": "products",
    "params": {"productIds": ["123/456"]},
    "webhookUrl": "https://your-webhook.com/notify"
  }'
```

### List All Schedules

```bash
curl -X GET http://localhost:3000/api/scheduler/schedules \
  -H "x-api-key: your-api-key"
```

### Run Schedule Immediately

```bash
curl -X POST http://localhost:3000/api/scheduler/schedules/1/run \
  -H "x-api-key: your-api-key"
```

---

## 🔔 Webhook Registration

### Register Discord Webhook

```bash
curl -X POST http://localhost:3000/api/webhook/register \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "name": "Discord Alerts",
    "url": "https://discord.com/api/webhooks/...",
    "events": ["scrape_success", "scrape_failure", "rate_limit"]
  }'
```

### List Available Webhook Events

```bash
curl -X GET http://localhost:3000/api/webhook/events \
  -H "x-api-key: your-api-key"
```

---

## 📊 Monitoring & Dashboards

### Access URLs

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| **API Gateway** | http://localhost:80 | API Key required |
| **Grafana** | http://localhost:3000 | admin / admin |
| **Prometheus** | http://localhost:9090 | No auth |
| **Redis Commander** | http://localhost:8081 | No auth (optional) |

### Grafana Dashboard

1. Buka http://localhost:3000
2. Login dengan `admin` / `admin`
3. Pilih dashboard **"Multi-Platform Scraper"**
4. Lihat metrics:
   - Success rate per platform
   - Request rate (requests/min)
   - Response time (p95/p99)
   - Error distribution
   - Queue status

### Prometheus Queries

```promql
# Success rate
sum(rate(scrape_requests_total{status="success"}[5m])) / sum(rate(scrape_requests_total[5m])) * 100

# Error rate by platform
sum by(platform) (rate(scrape_errors_total[5m]))

# Queue backlog
bull_queue_waiting_count
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Error: Cannot find module` | Run `npm install` |
| `Playwright browser not found` | Run `npx playwright install chromium` |
| `Port already in use` | Change `PORT` in `.env` or kill process |
| `Database connection failed` | Check PostgreSQL is running (`docker ps`) |
| `Redis connection failed` | Check Redis is running (`docker ps`) |
| `401 Unauthorized` | Check `x-api-key` header matches `.env` |
| `403 Forbidden (rate limit)` | Wait or increase `RATE_LIMIT` in `.env` |

### View Logs

```bash
# All services
docker-compose -f docker/docker-compose-all.yml logs -f

# Specific service
docker logs shopee-id-scraper -f

# API logs
tail -f logs/combined.log

# Error logs
tail -f logs/error.log
```

### Restart Services

```bash
# Restart all
docker-compose -f docker/docker-compose-all.yml restart

# Restart specific
docker restart shopee-id-scraper

# Rebuild and restart
docker-compose -f docker/docker-compose-all.yml up -d --build
```

### Clean Up

```bash
# Stop all containers
docker-compose -f docker/docker-compose-all.yml down

# Remove all data (including volumes)
docker-compose -f docker/docker-compose-all.yml down -v

# Remove all images
docker rmi shopee-id-scraper shopee-intl-scraper grabfood-scraper gofood-scraper shopeefood-scraper
```

---

## 📁 Directory Structure After Setup

```
scraper-suite/
├── output/              # Scraped data (JSON/CSV)
├── logs/                # Application logs
├── screenshots/         # Screenshot captures
├── tokens/              # Authentication tokens
├── node_modules/        # Dependencies
├── .env                 # Environment variables
└── config/local.json    # Local config override
```

---

## ✅ Verification Checklist

- [ ] `curl http://localhost:3000/health` returns 200 OK
- [ ] All Docker containers are running (`docker ps`)
- [ ] API key works (`x-api-key` header)
- [ ] Can scrape a test product
- [ ] Grafana dashboard accessible
- [ ] Logs are being written to `./logs/`
- [ ] Output directory contains scraped data

---

## 📞 Support

1. Cek [Troubleshooting](#-troubleshooting) section
2. Lihat logs dengan `docker logs <container>`
3. Buka issue di GitHub repository

---
# Load environment variables
source .env

# Atau export manual
export DB_PASSWORD=secure_password_123
export API_KEY=your-secure-api-key-change-this

# Build dengan docker-compose
docker-compose -f docker/docker-compose-all.yml build

# Atau build Dockerfile langsung
docker build -t scraper-app .

# Run dengan docker-compose
docker-compose -f docker/docker-compose-all.yml up -d

# Atau run dengan Docker langsung
docker run -d \
  -p 3000:3000 \
  -e API_KEY=your-secure-api-key \
  -e DB_PASSWORD=secure_password_123 \
  --name scraper \
  scraper-app
