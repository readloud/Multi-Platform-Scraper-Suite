/**
 * API Routes Configuration
 * Unified routing for all platforms
 */

const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');

// Import platform scrapers
const ShopeeIDScraper = require('../platforms/shopee/shopee-id');
const ShopeeInternationalScraper = require('../platforms/shopee/shopee-intl');
const GrabFoodBaseScraper = require('../platforms/grabfood/grabfood-base');
const GrabFoodIDScraper = require('../platforms/grabfood/grabfood-id');
const GoFoodBaseScraper = require('../platforms/gofood/gofood-base');
const ShopeeFoodBaseScraper = require('../platforms/shopee-food/shopee-food-base');

// Import scheduler and webhook
const { ScrapeScheduler } = require('../scheduler/cron-scheduler');
const { WebhookManager } = require('../webhook/webhook-manager');

// Validation helper
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    res.status(400).json({ errors: errors.array() });
  };
};

// ============================================
// SHOPEE INDONESIA ROUTES
// ============================================

/**
 * POST /api/shopee/id/product
 * Scrape single product from Shopee Indonesia
 */
router.post('/shopee/id/product',
  validate([
    body('url').optional().isURL(),
    body('shopId').optional().isString(),
    body('itemId').optional().isString(),
    body().custom(body => {
      if (!body.url && (!body.shopId || !body.itemId)) {
        throw new Error('Either url or (shopId + itemId) is required');
      }
      return true;
    })
  ]),
  async (req, res) => {
    try {
      const scraper = new ShopeeIDScraper(req.body.options);
      let result;

      if (req.body.url) {
        result = await scraper.scrapeProduct(req.body.url);
      } else {
        result = await scraper.getProductById(req.body.shopId, req.body.itemId);
      }

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/shopee/id/search
 * Search products on Shopee Indonesia
 */
router.post('/shopee/id/search',
  validate([
    body('keyword').isString().notEmpty(),
    body('limit').optional().isInt({ min: 1, max: 200 })
  ]),
  async (req, res) => {
    try {
      const scraper = new ShopeeIDScraper();
      const result = await scraper.searchProducts(req.body.keyword, req.body.limit || 50);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/shopee/id/recommendations
 * Get product recommendations
 */
router.post('/shopee/id/recommendations',
  validate([body('productId').isString().notEmpty()]),
  async (req, res) => {
    try {
      const scraper = new ShopeeIDScraper();
      const result = await scraper.getRecommendations(req.body.productId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ============================================
// SHOPEE INTERNATIONAL ROUTES
// ============================================

/**
 * POST /api/shopee/intl/product
 * Scrape product from international Shopee
 */
router.post('/shopee/intl/product',
  validate([
    body('region').isIn(['sg', 'my', 'th', 'ph', 'vn', 'tw']),
    body('url').optional().isURL(),
    body('shopId').optional().isString(),
    body('itemId').optional().isString()
  ]),
  async (req, res) => {
    try {
      const scraper = new ShopeeInternationalScraper(req.body.region, req.body.options);
      let result;

      if (req.body.url) {
        result = await scraper.scrapeProduct(req.body.url);
      } else {
        result = await scraper.getProductById(req.body.shopId, req.body.itemId);
      }

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/shopee/compare
 * Compare prices across regions
 */
router.post('/shopee/compare',
  validate([
    body('shopId').isString().notEmpty(),
    body('itemId').isString().notEmpty(),
    body('regions').optional().isArray()
  ]),
  async (req, res) => {
    try {
      const scraper = new ShopeeInternationalScraper('sg');
      const result = await scraper.comparePriceAcrossRegions(
        req.body.shopId,
        req.body.itemId,
        req.body.regions || ['sg', 'my', 'ph', 'th']
      );
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/shopee/search
 * Search products across international Shopee
 */
router.post('/shopee/search',
  validate([
    body('region').isIn(['sg', 'my', 'th', 'ph', 'vn', 'tw']),
    body('keyword').isString().notEmpty(),
    body('limit').optional().isInt({ min: 1, max: 200 })
  ]),
  async (req, res) => {
    try {
      const scraper = new ShopeeInternationalScraper(req.body.region);
      const result = await scraper.searchProducts(req.body.keyword, req.body.limit || 50);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ============================================
// GRABFOOD ROUTES
// ============================================

/**
 * POST /api/grabfood/search
 * Search restaurants on GrabFood
 */
router.post('/grabfood/search',
  validate([
    body('region').isIn(['sg', 'my', 'id', 'th', 'ph', 'vn']),
    body('lat').optional().isFloat(),
    body('lng').optional().isFloat(),
    body('city').optional().isString(),
    body('keyword').optional().isString(),
    body('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  async (req, res) => {
    try {
      const scraper = new GrabFoodBaseScraper(req.body.region);
      let result;

      if (req.body.city && req.body.region === 'id') {
        const idScraper = new GrabFoodIDScraper();
        result = await idScraper.searchByCity(req.body.city, req.body.keyword);
      } else if (req.body.lat && req.body.lng) {
        result = await scraper.searchRestaurants(
          req.body.lat,
          req.body.lng,
          req.body.keyword,
          req.body.limit || 50
        );
      } else {
        throw new Error('Either (lat + lng) or city is required');
      }

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/grabfood/menu
 * Get restaurant menu from GrabFood
 */
router.post('/grabfood/menu',
  validate([
    body('region').isIn(['sg', 'my', 'id', 'th', 'ph', 'vn']),
    body('restaurantId').isString().notEmpty()
  ]),
  async (req, res) => {
    try {
      const scraper = new GrabFoodBaseScraper(req.body.region);
      const result = await scraper.getRestaurantMenu(req.body.restaurantId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/grabfood/id/search
 * GrabFood Indonesia specific search by city
 */
router.post('/grabfood/id/search',
  validate([
    body('city').isIn(['jakarta', 'surabaya', 'bandung', 'medan', 'semarang', 'makassar', 'palembang', 'denpasar', 'bekasi', 'tangerang', 'depok']),
    body('keyword').optional().isString(),
    body('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  async (req, res) => {
    try {
      const scraper = new GrabFoodIDScraper();
      const result = await scraper.searchByCity(req.body.city, req.body.keyword);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ============================================
// GOFOOD ROUTES
// ============================================

/**
 * POST /api/gofood/search
 * Search merchants on GoFood
 */
router.post('/gofood/search',
  validate([
    body('city').optional().isString(),
    body('lat').optional().isFloat(),
    body('lng').optional().isFloat(),
    body('keyword').optional().isString(),
    body('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  async (req, res) => {
    try {
      const scraper = new GoFoodBaseScraper();
      let result;

      if (req.body.city) {
        result = await scraper.searchByCity(req.body.city, req.body.keyword);
      } else if (req.body.lat && req.body.lng) {
        result = await scraper.searchMerchants(req.body.lat, req.body.lng, req.body.keyword, req.body.limit);
      } else {
        throw new Error('Either city or (lat + lng) is required');
      }

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/gofood/products
 * Get merchant products from GoFood
 */
router.post('/gofood/products',
  validate([body('merchantId').isString().notEmpty()]),
  async (req, res) => {
    try {
      const scraper = new GoFoodBaseScraper();
      const result = await scraper.getMerchantProducts(req.body.merchantId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ============================================
// SHOPEEFOOD ROUTES
// ============================================

/**
 * POST /api/shopeefood/search
 * Search restaurants on ShopeeFood
 */
router.post('/shopeefood/search',
  validate([
    body('region').isIn(['id', 'sg', 'my', 'th']),
    body('lat').isFloat(),
    body('lng').isFloat(),
    body('keyword').optional().isString(),
    body('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  async (req, res) => {
    try {
      const scraper = new ShopeeFoodBaseScraper(req.body.region);
      const result = await scraper.searchRestaurants(
        req.body.lat,
        req.body.lng,
        req.body.keyword,
        req.body.limit || 50
      );
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/shopeefood/menu
 * Get restaurant menu from ShopeeFood
 */
router.post('/shopeefood/menu',
  validate([
    body('region').isIn(['id', 'sg', 'my', 'th']),
    body('restaurantId').isString().notEmpty()
  ]),
  async (req, res) => {
    try {
      const scraper = new ShopeeFoodBaseScraper(req.body.region);
      const result = await scraper.getRestaurantMenu(req.body.restaurantId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ============================================
// SCHEDULER ROUTES
// ============================================

let schedulerInstance = null;

const getScheduler = () => {
  if (!schedulerInstance) {
    schedulerInstance = new ScrapeScheduler();
  }
  return schedulerInstance;
};

/**
 * GET /api/scheduler/schedules
 * List all scheduled jobs
 */
router.get('/scheduler/schedules',
  async (req, res) => {
    try {
      const scheduler = getScheduler();
      const schedules = await scheduler.getAllSchedules();
      res.json({ success: true, data: schedules });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/scheduler/schedules
 * Create new schedule
 */
router.post('/scheduler/schedules',
  validate([
    body('name').isString().notEmpty(),
    body('platform').isIn(['shopee-id', 'shopee-intl', 'grabfood', 'gofood', 'shopeefood']),
    body('frequency').isIn(['hourly', 'daily', 'weekly', 'monthly', 'custom']),
    body('cronExpression').optional().isString(),
    body('target').isString().notEmpty(),
    body('params').isObject(),
    body('webhookUrl').optional().isURL()
  ]),
  async (req, res) => {
    try {
      const scheduler = getScheduler();
      const schedule = await scheduler.createSchedule(req.body);
      res.json({ success: true, data: schedule });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * PUT /api/scheduler/schedules/:id
 * Update existing schedule
 */
router.put('/scheduler/schedules/:id',
  validate([param('id').isInt()]),
  async (req, res) => {
    try {
      const scheduler = getScheduler();
      const schedule = await scheduler.updateSchedule(parseInt(req.params.id), req.body);
      res.json({ success: true, data: schedule });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * DELETE /api/scheduler/schedules/:id
 * Delete schedule
 */
router.delete('/scheduler/schedules/:id',
  validate([param('id').isInt()]),
  async (req, res) => {
    try {
      const scheduler = getScheduler();
      await scheduler.deleteSchedule(parseInt(req.params.id));
      res.json({ success: true, message: 'Schedule deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * POST /api/scheduler/schedules/:id/run
 * Run schedule immediately
 */
router.post('/scheduler/schedules/:id/run',
  validate([param('id').isInt()]),
  async (req, res) => {
    try {
      const scheduler = getScheduler();
      const result = await scheduler.runNow(parseInt(req.params.id));
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * GET /api/scheduler/executions
 * Get execution history
 */
router.get('/scheduler/executions',
  validate([
    query('scheduleId').optional().isInt(),
    query('limit').optional().isInt({ min: 1, max: 500 })
  ]),
  async (req, res) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const executions = await prisma.scrapeExecution.findMany({
        where: req.query.scheduleId ? { scheduleId: parseInt(req.query.scheduleId) } : {},
        orderBy: { executedAt: 'desc' },
        take: parseInt(req.query.limit) || 50,
        include: { schedule: true }
      });
      
      res.json({ success: true, data: executions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ============================================
// WEBHOOK ROUTES
// ============================================

let webhookManager = null;

const getWebhookManager = () => {
  if (!webhookManager) {
    webhookManager = new WebhookManager();
  }
  return webhookManager;
};

/**
 * POST /api/webhook/register
 * Register new webhook
 */
router.post('/webhook/register',
  validate([
    body('name').isString().notEmpty(),
    body('url').isURL(),
    body('events').isArray(),
    body('events.*').isIn(['scrape_start', 'scrape_success', 'scrape_failure', 'rate_limit', 'blocked', 'schedule_start', 'schedule_complete', 'schedule_error', 'proxy_switch', 'data_saved'])
  ]),
  async (req, res) => {
    try {
      const manager = getWebhookManager();
      const webhook = manager.registerWebhook(req.body);
      res.json({ success: true, data: webhook });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * DELETE /api/webhook/:id
 * Delete webhook
 */
router.delete('/webhook/:id',
  validate([param('id').isInt()]),
  async (req, res) => {
    try {
      const manager = getWebhookManager();
      manager.deleteWebhook(req.params.id);
      res.json({ success: true, message: 'Webhook deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * GET /api/webhook/events
 * List supported webhook events
 */
router.get('/webhook/events', (req, res) => {
  res.json({
    success: true,
    data: [
      'scrape_start',
      'scrape_success',
      'scrape_failure',
      'rate_limit',
      'blocked',
      'schedule_start',
      'schedule_complete',
      'schedule_error',
      'proxy_switch',
      'data_saved'
    ]
  });
});

// ============================================
// PROXY ROUTES
// ============================================

/**
 * GET /api/proxy/stats
 * Get proxy pool statistics
 */
router.get('/proxy/stats', async (req, res) => {
  try {
    const { ProxyPool } = require('../proxy/pool');
    const proxyPool = new ProxyPool();
    const stats = proxyPool.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/proxy/reload
 * Reload proxy list
 */
router.post('/proxy/reload', async (req, res) => {
  try {
    const { ProxyPool } = require('../proxy/pool');
    const proxyPool = new ProxyPool();
    proxyPool.reloadProxies();
    res.json({ success: true, message: 'Proxies reloaded' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/proxy/add
 * Add new proxy dynamically
 */
router.post('/proxy/add',
  validate([body('url').isString().notEmpty()]),
  async (req, res) => {
    try {
      const { ProxyRotator } = require('../proxy/rotator');
      const rotator = new ProxyRotator({ proxies: [] });
      rotator.addProxy(req.body.url);
      res.json({ success: true, message: 'Proxy added' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

module.exports = router;