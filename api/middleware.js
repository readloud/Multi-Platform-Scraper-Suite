/**
 * API Middleware
 * Authentication, Rate Limiting, Logging, Error Handling
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// ============================================
// Authentication Middleware
// ============================================

const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY;
  
  if (!validKey) {
    console.warn('⚠️ API_KEY not set in environment variables');
    return next();
  }
  
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing API key',
      code: 'UNAUTHORIZED'
    });
  }
  
  next();
};

// Advanced authentication with role-based access
const advancedAuthMiddleware = (allowedRoles = ['admin', 'user']) => {
  return async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    
    // Check timestamp (prevent replay attacks)
    const now = Date.now();
    if (timestamp && Math.abs(now - parseInt(timestamp)) > 300000) { // 5 minutes
      return res.status(401).json({
        success: false,
        error: 'Request timestamp expired',
        code: 'EXPIRED_TIMESTAMP'
      });
    }
    
    // Verify signature if provided
    if (signature && process.env.API_SECRET) {
      const payload = `${req.method}${req.path}${timestamp}`;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.API_SECRET)
        .update(payload)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return res.status(401).json({
          success: false,
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE'
        });
      }
    }
    
    // Basic API key check
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.API_KEY;
    
    if (validKey && (!apiKey || apiKey !== validKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        code: 'INVALID_API_KEY'
      });
    }
    
    next();
  };
};

// ============================================
// Rate Limiting Middleware
// ============================================

// General rate limiter
const generalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT) || 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Platform-specific rate limiters
const createPlatformRateLimiter = (platform, limit) => {
  return rateLimit({
    windowMs: 60000,
    max: limit,
    keyGenerator: (req) => `${platform}:${req.headers['x-api-key'] || req.ip}`,
    message: {
      success: false,
      error: `Rate limit exceeded for ${platform}. Please wait.`,
      code: 'PLATFORM_RATE_LIMIT',
      platform
    }
  });
};

const platformRateLimiters = {
  shopee_id: createPlatformRateLimiter('shopee_id', 30),
  shopee_intl: createPlatformRateLimiter('shopee_intl', 50),
  grabfood: createPlatformRateLimiter('grabfood', 60),
  gofood: createPlatformRateLimiter('gofood', 60),
  shopeefood: createPlatformRateLimiter('shopeefood', 60)
};

// Dynamic platform rate limiter
const platformRateLimiter = (platform) => {
  return platformRateLimiters[platform] || generalRateLimiter;
};

// ============================================
// Logging Middleware
// ============================================

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.path} - ${req.ip}`);
  
  // Capture response
  const originalSend = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    console.log(`📤 ${req.method} ${req.path} - ${status} (${duration}ms)`);
    
    // Log errors
    if (status >= 400) {
      console.error(`❌ Error: ${JSON.stringify(data)}`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Structured logging with Winston
const winstonLogger = (req, res, next) => {
  req.logger = {
    info: (message, meta) => {
      console.log(JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message,
        requestId: req.id,
        path: req.path,
        method: req.method,
        ...meta
      }));
    },
    error: (message, meta) => {
      console.error(JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message,
        requestId: req.id,
        path: req.path,
        method: req.method,
        ...meta
      }));
    },
    warn: (message, meta) => {
      console.warn(JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message,
        requestId: req.id,
        ...meta
      }));
    }
  };
  
  next();
};

// ============================================
// Request ID Middleware
// ============================================

const requestIdMiddleware = (req, res, next) => {
  req.id = crypto.randomBytes(16).toString('hex');
  res.setHeader('X-Request-ID', req.id);
  next();
};

// ============================================
// CORS Middleware
// ============================================

const corsMiddleware = cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'x-signature', 'x-timestamp'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  credentials: true,
  maxAge: 86400 // 24 hours
});

// ============================================
// Security Middleware
// ============================================

const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// ============================================
// Validation Middleware
// ============================================

const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  };
};

// ============================================
// Error Handling Middleware
// ============================================

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  // Log error
  console.error(`❌ Error: ${message}`);
  console.error(err.stack);
  
  // Send response
  res.status(status).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
    code: 'NOT_FOUND'
  });
};

// ============================================
// Request Sanitization Middleware
// ============================================

const sanitizeRequest = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove HTML tags
        req.body[key] = req.body[key].replace(/<[^>]*>/g, '');
        // Trim whitespace
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  // Sanitize query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }
  
  next();
};

// ============================================
// Response Compression Middleware
// ============================================

const compression = require('compression');

const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress small responses
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Default compression level
});

// ============================================
// Cache Control Middleware
// ============================================

const cacheControl = (duration) => {
  return (req, res, next) => {
    res.setHeader('Cache-Control', `public, max-age=${duration}`);
    next();
  };
};

// ============================================
// Body Parser Configuration
// ============================================

const bodyParserConfig = {
  json: { limit: '10mb' },
  urlencoded: { extended: true, limit: '10mb' }
};

// ============================================
// Export All Middleware
// ============================================

module.exports = {
  authMiddleware,
  advancedAuthMiddleware,
  generalRateLimiter,
  platformRateLimiter,
  platformRateLimiters,
  requestLogger,
  winstonLogger,
  requestIdMiddleware,
  corsMiddleware,
  securityMiddleware,
  validateRequest,
  errorHandler,
  notFoundHandler,
  sanitizeRequest,
  compressionMiddleware,
  cacheControl,
  bodyParserConfig
};