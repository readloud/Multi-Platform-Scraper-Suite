/**
 * Input Validators
 * Validation functions for all API inputs
 */

const { body, param, query } = require('express-validator');

// ============================================
// URL Validators
// ============================================

const validateShopeeUrl = (value) => {
  const patterns = [
    /^https:\/\/(shopee\.co\.id|shopee\.sg|shopee\.com\.my|shopee\.co\.th|shopee\.ph|shopee\.vn|shopee\.tw)\/product\/\d+\/\d+/,
    /^https:\/\/(shopee\.co\.id|shopee\.sg|shopee\.com\.my|shopee\.co\.th|shopee\.ph|shopee\.vn|shopee\.tw)\/[^\/]+\/\d+\.\d+/
  ];
  
  return patterns.some(pattern => pattern.test(value));
};

const validateGrabFoodUrl = (value) => {
  const pattern = /^https:\/\/food\.grab\.com\/(sg|my|id|th|ph|vn)\/restaurant\/[^\/]+/;
  return pattern.test(value);
};

// ============================================
// Platform-Specific Validators
// ============================================

// Shopee validators
const shopeeProductValidators = {
  url: body('url').optional().custom(validateShopeeUrl).withMessage('Invalid Shopee URL'),
  shopId: body('shopId').optional().isString().isLength({ min: 5, max: 20 }),
  itemId: body('itemId').optional().isString().isLength({ min: 5, max: 20 }),
  region: body('region').optional().isIn(['id', 'sg', 'my', 'th', 'ph', 'vn', 'tw'])
};

// GrabFood validators
const grabfoodValidators = {
  region: body('region').isIn(['sg', 'my', 'id', 'th', 'ph', 'vn']),
  lat: body('lat').optional().isFloat({ min: -90, max: 90 }),
  lng: body('lng').optional().isFloat({ min: -180, max: 180 }),
  city: body('city').optional().isString(),
  restaurantId: body('restaurantId').isString().notEmpty()
};

// GoFood validators
const gofoodValidators = {
  city: body('city').optional().isIn([
    'jakarta', 'surabaya', 'bandung', 'medan', 'semarang', 
    'makassar', 'palembang', 'denpasar', 'bekasi', 'tangerang', 'depok'
  ]),
  lat: body('lat').optional().isFloat({ min: -90, max: 90 }),
  lng: body('lng').optional().isFloat({ min: -180, max: 180 }),
  merchantId: body('merchantId').isString().notEmpty()
};

// ShopeeFood validators
const shopeefoodValidators = {
  region: body('region').isIn(['id', 'sg', 'my', 'th']),
  lat: body('lat').isFloat({ min: -90, max: 90 }),
  lng: body('lng').isFloat({ min: -180, max: 180 }),
  restaurantId: body('restaurantId').isString().notEmpty()
};

// ============================================
// Common Validators
// ============================================

const commonValidators = {
  keyword: body('keyword').isString().isLength({ min: 1, max: 200 }).trim(),
  limit: body('limit').optional().isInt({ min: 1, max: 200 }),
  offset: body('offset').optional().isInt({ min: 0 }),
  sortBy: body('sortBy').optional().isIn(['price_asc', 'price_desc', 'rating_desc', 'sales_desc']),
  format: body('format').optional().isIn(['json', 'csv'])
};

// ============================================
// Scheduler Validators
// ============================================

const scheduleValidators = {
  name: body('name').isString().isLength({ min: 3, max: 100 }),
  platform: body('platform').isIn(['shopee-id', 'shopee-intl', 'grabfood', 'gofood', 'shopeefood']),
  frequency: body('frequency').isIn(['hourly', 'daily', 'weekly', 'monthly', 'custom']),
  cronExpression: body('cronExpression').optional().custom((value) => {
    if (!value) return true;
    // Basic cron validation
    const parts = value.split(' ');
    return parts.length === 5 && parts.every(part => /^[0-9*,/-]+$/.test(part));
  }).withMessage('Invalid cron expression'),
  target: body('target').isString().notEmpty(),
  params: body('params').isObject(),
  webhookUrl: body('webhookUrl').optional().isURL()
};

// ============================================
// Webhook Validators
// ============================================

const webhookValidators = {
  name: body('name').isString().isLength({ min: 3, max: 100 }),
  url: body('url').isURL(),
  events: body('events').isArray().custom((value) => {
    const validEvents = [
      'scrape_start', 'scrape_success', 'scrape_failure', 'rate_limit',
      'blocked', 'schedule_start', 'schedule_complete', 'schedule_error',
      'proxy_switch', 'data_saved'
    ];
    return value.every(event => validEvents.includes(event));
  }).withMessage('Invalid event type')
};

// ============================================
// Helper Functions
// ============================================

/**
 * Validate coordinates
 */
function validateCoordinates(lat, lng) {
  if (lat === undefined || lng === undefined) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Sanitize phone number
 */
function sanitizePhoneNumber(phone) {
  return phone.replace(/[^0-9+]/g, '');
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate date format (ISO)
 */
function validateISODate(date) {
  return !isNaN(Date.parse(date));
}

/**
 * Validate product ID format
 */
function validateProductId(productId) {
  return /^\d+\.\d+$/.test(productId);
}

/**
 * Parse and validate query parameters
 */
function parseQueryParams(query) {
  const result = {};
  
  if (query.limit) result.limit = Math.min(parseInt(query.limit), 200);
  if (query.offset) result.offset = parseInt(query.offset);
  if (query.sortBy) result.sortBy = query.sortBy;
  if (query.keyword) result.keyword = query.keyword.trim();
  if (query.region) result.region = query.region;
  
  return result;
}

// ============================================
// Export
// ============================================

module.exports = {
  // Validator sets
  shopeeProductValidators,
  grabfoodValidators,
  gofoodValidators,
  shopeefoodValidators,
  commonValidators,
  scheduleValidators,
  webhookValidators,
  
  // Individual validators
  validateShopeeUrl,
  validateGrabFoodUrl,
  validateCoordinates,
  sanitizePhoneNumber,
  validateEmail,
  validateISODate,
  validateProductId,
  parseQueryParams
};