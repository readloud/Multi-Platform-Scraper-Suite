/**
 * Webhook Notification System
 * Sends real-time alerts for scrape events
 */

const crypto = require('crypto');
const axios = require('axios');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

class WebhookManager {
  constructor() {
    this.webhooks = new Map(); // id -> webhook config
    this.retryQueue = [];
    this.loadWebhooks();
  }

  /**
   * Load webhooks from database
   */
  async loadWebhooks() {
    // In production, load from PostgreSQL
    const defaultWebhooks = [
      {
        id: 1,
        name: 'Discord Alerts',
        url: process.env.DISCORD_WEBHOOK_URL,
        events: ['scrape_success', 'scrape_failure', 'rate_limit'],
        active: true,
        secret: crypto.randomBytes(32).toString('hex')
      },
      {
        id: 2,
        name: 'Slack Notifications',
        url: process.env.SLACK_WEBHOOK_URL,
        events: ['scrape_completed', 'scrape_failed', 'schedule_error'],
        active: true,
        secret: crypto.randomBytes(32).toString('hex')
      },
      {
        id: 3,
        name: 'Telegram Bot',
        url: `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        events: ['alert', 'error'],
        active: true,
        secret: crypto.randomBytes(32).toString('hex')
      }
    ];
    
    for (const webhook of defaultWebhooks) {
      if (webhook.url) {
        this.webhooks.set(webhook.id, webhook);
      }
    }
  }

  /**
   * Send notification to all matching webhooks
   */
  async send(event, data) {
    const matchingWebhooks = Array.from(this.webhooks.values())
      .filter(w => w.active && w.events.includes(event));
    
    const results = [];
    
    for (const webhook of matchingWebhooks) {
      try {
        const result = await this.sendToWebhook(webhook, event, data);
        results.push({ webhook: webhook.name, success: true, result });
      } catch (error) {
        results.push({ webhook: webhook.name, success: false, error: error.message });
        // Add to retry queue
        this.addToRetryQueue(webhook, event, data);
      }
    }
    
    return results;
  }

  /**
   * Send to individual webhook
   */
  async sendToWebhook(webhook, event, data) {
    const payload = this.buildPayload(webhook, event, data);
    const signature = this.generateSignature(webhook.secret, payload);
    
    const response = await axios.post(webhook.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Event-Type': event,
        'X-Timestamp': Date.now().toString()
      },
      timeout: 10000
    });
    
    return response.data;
  }

  /**
   * Build webhook payload
   */
  buildPayload(webhook, event, data) {
    const basePayload = {
      event,
      timestamp: new Date().toISOString(),
      webhookId: webhook.id,
      webhookName: webhook.name
    };
    
    // Customize payload based on webhook type
    if (webhook.url.includes('discord')) {
      return this.buildDiscordPayload(event, data, basePayload);
    }
    
    if (webhook.url.includes('slack')) {
      return this.buildSlackPayload(event, data, basePayload);
    }
    
    if (webhook.url.includes('telegram')) {
      return this.buildTelegramPayload(event, data, basePayload);
    }
    
    return { ...basePayload, data };
  }

  /**
   * Discord webhook format
   */
  buildDiscordPayload(event, data, base) {
    const colors = {
      scrape_success: 0x00ff00,
      scrape_failure: 0xff0000,
      rate_limit: 0xffaa00,
      alert: 0xff6600
    };
    
    return {
      embeds: [{
        title: `🔄 ${event.replace('_', ' ').toUpperCase()}`,
        color: colors[event] || 0x0099ff,
        fields: Object.entries(data).slice(0, 10).map(([key, value]) => ({
          name: key,
          value: String(value).substring(0, 1024),
          inline: true
        })),
        timestamp: base.timestamp,
        footer: { text: `Webhook: ${base.webhookName}` }
      }]
    };
  }

  /**
   * Slack webhook format
   */
  buildSlackPayload(event, data, base) {
    const colors = {
      scrape_success: 'good',
      scrape_failure: 'danger',
      rate_limit: 'warning'
    };
    
    return {
      attachments: [{
        color: colors[event] || '#36a64f',
        title: `Scraper Event: ${event}`,
        text: JSON.stringify(data, null, 2),
        fields: [
          { title: 'Event', value: event, short: true },
          { title: 'Time', value: base.timestamp, short: true }
        ],
        footer: base.webhookName,
        ts: Math.floor(Date.now() / 1000)
      }]
    };
  }

  /**
   * Telegram webhook format
   */
  buildTelegramPayload(event, data, base) {
    const message = `🤖 *Scraper Alert*\n\n` +
      `*Event:* ${event}\n` +
      `*Time:* ${base.timestamp}\n` +
      `*Data:*\n\`\`\`json\n${JSON.stringify(data, null, 2).substring(0, 1000)}\n\`\`\``;
    
    return {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    };
  }

  /**
   * Generate HMAC signature
   */
  generateSignature(secret, payload) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Add failed webhook to retry queue
   */
  addToRetryQueue(webhook, event, data) {
    const retryItem = {
      webhookId: webhook.id,
      event,
      data,
      attempts: 0,
      nextRetry: Date.now() + (Math.pow(2, 0) * 1000) // exponential backoff
    };
    
    this.retryQueue.push(retryItem);
    this.processRetryQueue();
  }

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    if (this.processingRetry) return;
    this.processingRetry = true;
    
    while (this.retryQueue.length > 0) {
      const item = this.retryQueue[0];
      
      if (Date.now() < item.nextRetry) {
        await new Promise(resolve => setTimeout(resolve, item.nextRetry - Date.now()));
      }
      
      const webhook = this.webhooks.get(item.webhookId);
      if (!webhook) {
        this.retryQueue.shift();
        continue;
      }
      
      try {
        await this.sendToWebhook(webhook, item.event, item.data);
        this.retryQueue.shift(); // Success, remove from queue
      } catch (error) {
        item.attempts++;
        
        if (item.attempts >= 5) {
          // Max retries reached
          console.error(`Webhook failed after 5 attempts: ${webhook.name}`);
          this.retryQueue.shift();
        } else {
          // Exponential backoff: 2^attempts * 1000ms
          item.nextRetry = Date.now() + (Math.pow(2, item.attempts) * 1000);
        }
      }
    }
    
    this.processingRetry = false;
  }

  /**
   * Register new webhook
   */
  registerWebhook(config) {
    const id = Date.now();
    const webhook = {
      id,
      ...config,
      secret: config.secret || crypto.randomBytes(32).toString('hex'),
      active: true
    };
    
    this.webhooks.set(id, webhook);
    return webhook;
  }

  /**
   * Delete webhook
   */
  deleteWebhook(id) {
    this.webhooks.delete(parseInt(id));
  }
}

// Predefined event types
const WEBHOOK_EVENTS = {
  SCRAPE_START: 'scrape_start',
  SCRAPE_SUCCESS: 'scrape_success',
  SCRAPE_FAILURE: 'scrape_failure',
  RATE_LIMIT: 'rate_limit',
  BLOCKED: 'blocked',
  SCHEDULE_START: 'schedule_start',
  SCHEDULE_COMPLETE: 'schedule_complete',
  SCHEDULE_ERROR: 'schedule_error',
  PROXY_SWITCH: 'proxy_switch',
  DATA_SAVED: 'data_saved'
};

module.exports = { WebhookManager, WEBHOOK_EVENTS };