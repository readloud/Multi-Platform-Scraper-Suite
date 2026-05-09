/**
 * Unified API Server - Supports all platforms
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Platform Scrapers
const ShopeeIDScraper = require('../src/platforms/shopee/shopee-id');
const ShopeeInternationalScraper = require('../src/platforms/shopee/shopee-intl');
const GrabFoodBaseScraper = require('../src/platforms/grabfood/grabfood-base');
const GrabFoodIDScraper = require('../src/platforms/grabfood/grabfood-id');
const GoFoodBaseScraper = require('../src/platforms/gofood/gofood-base');
const ShopeeFoodBaseScraper = require('../src/platforms/shopee-food/shopee-food-base');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting per platform
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.RATE_LIMIT || 100,
  message: { error: 'Too many requests' }
});
app.use('/api/', rateLimiter);

// Auth middleware
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};

// ============================================
// SHOPEE ENDPOINTS
// ============================================

// Shopee Indonesia
app.post('/api/shopee/id/product', authMiddleware, async (req, res) => {
  const { url, shopId, itemId } = req.body;
  
  try {
    const scraper = new ShopeeIDScraper();
    let result;
    
    if (url) {
      result = await scraper.scrapeProduct(url);
    } else if (shopId && itemId) {
      result = await scraper.getProductById(shopId, itemId);
    } else {
      return res.status(400).json({ error: 'Provide url or (shopId + itemId)' });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Shopee International (sg, my, th, ph, vn, tw)
app.post('/api/shopee/intl/product', authMiddleware, async (req, res) => {
  const { region, url, shopId, itemId } = req.body;
  
  try {
    const scraper = new ShopeeInternationalScraper(region || 'sg');
    let result;
    
    if (url) {
      result = await scraper.scrapeProduct(url);
    } else if (shopId && itemId) {
      result = await scraper.getProductById(shopId, itemId);
    } else {
      return res.status(400).json({ error: 'Provide url or (shopId + itemId)' });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Shopee Multi-Region Compare
app.post('/api/shopee/compare', authMiddleware, async (req, res) => {
  const { shopId, itemId, regions = ['sg', 'my', 'ph'] } = req.body;
  
  try {
    const scraper = new ShopeeInternationalScraper('sg');
    const result = await scraper.comparePriceAcrossRegions(shopId, itemId, regions);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Shopee Search
app.post('/api/shopee/search', authMiddleware, async (req, res) => {
  const { region, keyword, limit = 50 } = req.body;
  
  try {
    let scraper;
    if (region === 'id') {
      scraper = new ShopeeIDScraper();
    } else {
      scraper = new ShopeeInternationalScraper(region || 'sg');
    }
    
    const result = await scraper.searchProducts(keyword, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GRABFOOD ENDPOINTS
// ============================================

// GrabFood Search (multi-region)
app.post('/api/grabfood/search', authMiddleware, async (req, res) => {
  const { region, lat, lng, keyword, limit = 50 } = req.body;
  
  try {
    const scraper = new GrabFoodBaseScraper(region || 'sg');
    const result = await scraper.searchRestaurants(lat, lng, keyword, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GrabFood Indonesia specific
app.post('/api/grabfood/id/search', authMiddleware, async (req, res) => {
  const { city, keyword, limit = 50 } = req.body;
  
  try {
    const scraper = new GrabFoodIDScraper();
    const result = await scraper.searchByCity(city, keyword);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GrabFood Menu
app.post('/api/grabfood/menu', authMiddleware, async (req, res) => {
  const { region, restaurantId } = req.body;
  
  try {
    const scraper = new GrabFoodBaseScraper(region || 'sg');
    const result = await scraper.getRestaurantMenu(restaurantId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GOFOOD ENDPOINTS (Indonesia only)
// ============================================

app.post('/api/gofood/search', authMiddleware, async (req, res) => {
  const { city, lat, lng, keyword, limit = 50 } = req.body;
  
  try {
    const scraper = new GoFoodBaseScraper();
    let result;
    
    if (city) {
      result = await scraper.searchByCity(city, keyword);
    } else if (lat && lng) {
      result = await scraper.searchMerchants(lat, lng, keyword, limit);
    } else {
      return res.status(400).json({ error: 'Provide city or (lat + lng)' });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/gofood/products', authMiddleware, async (req, res) => {
  const { merchantId } = req.body;
  
  try {
    const scraper = new GoFoodBaseScraper();
    const result = await scraper.getMerchantProducts(merchantId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// SHOPEEFOOD ENDPOINTS
// ============================================

app.post('/api/shopeefood/search', authMiddleware, async (req, res) => {
  const { region, lat, lng, keyword, limit = 50 } = req.body;
  
  try {
    const scraper = new ShopeeFoodBaseScraper(region || 'id');
    const result = await scraper.searchRestaurants(lat, lng, keyword, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/shopeefood/menu', authMiddleware, async (req, res) => {
  const { region, restaurantId } = req.body;
  
  try {
    const scraper = new ShopeeFoodBaseScraper(region || 'id');
    const result = await scraper.getRestaurantMenu(restaurantId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    platforms: ['shopee-id', 'shopee-intl', 'grabfood', 'gofood', 'shopeefood'],
    regions: {
      shopee: ['id', 'sg', 'my', 'th', 'ph', 'vn', 'tw'],
      grabfood: ['sg', 'my', 'id', 'th', 'ph', 'vn'],
      gofood: ['id'],
      shopeefood: ['id', 'sg', 'my', 'th']
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Multi-Platform Scraper API running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   POST /api/shopee/id/product - Shopee Indonesia`);
  console.log(`   POST /api/shopee/intl/product - Shopee International`);
  console.log(`   POST /api/shopee/compare - Compare prices across regions`);
  console.log(`   POST /api/grabfood/search - GrabFood search`);
  console.log(`   POST /api/gofood/search - GoFood search`);
  console.log(`   POST /api/shopeefood/search - ShopeeFood search`);
});

module.exports = app;