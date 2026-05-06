/**
 * Prometheus Metrics Collection
 */

const client = require('prom-client');
const express = require('express');

// Create Registry
const register = new client.Registry();

// Default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const scrapeRequestsTotal = new client.Counter({
  name: 'scrape_requests_total',
  help: 'Total number of scrape requests',
  labelNames: ['platform', 'region', 'status']
});

const scrapeDuration = new client.Histogram({
  name: 'scrape_duration_seconds',
  help: 'Scrape duration in seconds',
  labelNames: ['platform', 'region'],
  buckets: [1, 2, 5, 10, 15, 30, 45, 60]
});

const scrapeErrorsTotal = new client.Counter({
  name: 'scrape_errors_total',
  help: 'Total number of scrape errors',
  labelNames: ['platform', 'error_type']
});

const activeScrapes = new client.Gauge({
  name: 'active_scrapes',
  help: 'Number of active scraping jobs',
  labelNames: ['platform']
});

const rateLimitRemaining = new client.Gauge({
  name: 'rate_limit_remaining',
  help: 'Remaining rate limit for platform',
  labelNames: ['platform']
});

const queueSize = new client.Gauge({
  name: 'queue_size',
  help: 'Size of scraping queue',
  labelNames: ['platform', 'queue_type']
});

const proxyHealth = new client.Gauge({
  name: 'proxy_health_status',
  help: 'Proxy health status (1=healthy, 0=unhealthy)',
  labelNames: ['proxy']
});

const dataExtractedTotal = new client.Counter({
  name: 'data_extracted_total',
  help: 'Total data points extracted',
  labelNames: ['platform', 'data_type']
});

// Metrics endpoint
const metricsApp = express();
metricsApp.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

function startMetricsServer(port = 9091) {
  metricsApp.listen(port, () => {
    console.log(`📊 Metrics server running on port ${port}`);
  });
}

// Helper functions to update metrics
function recordScrapeRequest(platform, region, status) {
  scrapeRequestsTotal.inc({ platform, region, status });
}

function recordScrapeDuration(platform, region, durationSeconds) {
  scrapeDuration.observe({ platform, region }, durationSeconds);
}

function recordScrapeError(platform, errorType) {
  scrapeErrorsTotal.inc({ platform, error_type: errorType });
}

function updateActiveScrapes(platform, delta) {
  activeScrapes.inc({ platform }, delta);
}

function updateRateLimit(platform, remaining) {
  rateLimitRemaining.set({ platform }, remaining);
}

function updateQueueSize(platform, queueType, size) {
  queueSize.set({ platform, queue_type: queueType }, size);
}

function updateProxyHealth(proxy, isHealthy) {
  proxyHealth.set({ proxy }, isHealthy ? 1 : 0);
}

function recordDataExtracted(platform, dataType) {
  dataExtractedTotal.inc({ platform, data_type: dataType });
}

module.exports = {
  register,
  startMetricsServer,
  recordScrapeRequest,
  recordScrapeDuration,
  recordScrapeError,
  updateActiveScrapes,
  updateRateLimit,
  updateQueueSize,
  updateProxyHealth,
  recordDataExtracted
};