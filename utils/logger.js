/**
 * Winston Logger Configuration
 * Structured logging with file rotation and multiple transports
 */

const winston = require('winston');
const { format } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0 && meta.stack !== message) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom format for file output (JSON)
const fileFormat = format.combine(
  format.timestamp(),
  format.json()
);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Create transports
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  })
);

// File transport for all logs
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '30',
    format: fileFormat,
    level: 'info'
  })
);

// File transport for error logs only
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '30',
    format: fileFormat,
    level: 'error'
  })
);

// Create logger instance
const logger = winston.createLogger({
  levels,
  format: fileFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logDir, 'rejections.log') })
  ]
});

// ============================================
// Helper Functions
// ============================================

/**
 * Create child logger with additional context
 */
const createChildLogger = (context) => {
  return logger.child(context);
};

/**
 * Log API request
 */
const logRequest = (req, res, duration) => {
  logger.http(`Request: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.get('user-agent'),
    requestId: req.id
  });
};

/**
 * Log API response
 */
const logResponse = (req, res, data) => {
  logger.info(`Response: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    responseSize: JSON.stringify(data).length,
    requestId: req.id
  });
};

/**
 * Log scrape operation
 */
const logScrape = (platform, action, target, result) => {
  logger.info(`Scrape: ${platform} - ${action}`, {
    platform,
    action,
    target,
    success: result?.success || false,
    duration: result?.duration,
    dataSize: result?.dataSize,
    error: result?.error
  });
};

/**
 * Log database operation
 */
const logDatabase = (operation, model, condition) => {
  logger.debug(`Database: ${operation} on ${model}`, {
    operation,
    model,
    condition
  });
};

/**
 * Log queue operation
 */
const logQueue = (queue, operation, jobId, data) => {
  logger.info(`Queue: ${queue} - ${operation}`, {
    queue,
    operation,
    jobId,
    data
  });
};

/**
 * Log webhook delivery
 */
const logWebhook = (webhookId, event, success, responseTime) => {
  logger.info(`Webhook: ${webhookId} - ${event}`, {
    webhookId,
    event,
    success,
    responseTime: `${responseTime}ms`
  });
};

/**
 * Log error with stack trace
 */
const logError = (error, context = {}) => {
  logger.error(error.message, {
    error: error.message,
    stack: error.stack,
    ...context
  });
};

// ============================================
// Performance Monitoring
// ============================================

class PerformanceLogger {
  constructor() {
    this.metrics = new Map();
  }
  
  start(label) {
    this.metrics.set(label, Date.now());
  }
  
  end(label) {
    const start = this.metrics.get(label);
    if (!start) return null;
    
    const duration = Date.now() - start;
    this.metrics.delete(label);
    
    logger.debug(`Performance: ${label}`, { duration: `${duration}ms` });
    return duration;
  }
  
  async measure(label, fn) {
    this.start(label);
    try {
      const result = await fn();
      const duration = this.end(label);
      return { result, duration };
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

const performanceLogger = new PerformanceLogger();

// ============================================
// Export
// ============================================

module.exports = {
  logger,
  createChildLogger,
  logRequest,
  logResponse,
  logScrape,
  logDatabase,
  logQueue,
  logWebhook,
  logError,
  performanceLogger
};