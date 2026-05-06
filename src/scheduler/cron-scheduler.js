/**
 * Cron Job Scheduler
 * Scheduled scraping tasks for all platforms
 */

const cron = require('node-cron');
const { Queue } = require('bull');
const Redis = require('ioredis');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

// Queue instances per platform
const queues = {
  'shopee-id': new Queue('shopee-id-scraping', { redis: { url: process.env.REDIS_URL } }),
  'shopee-intl': new Queue('shopee-intl-scraping', { redis: { url: process.env.REDIS_URL } }),
  'grabfood': new Queue('grabfood-scraping', { redis: { url: process.env.REDIS_URL } }),
  'gofood': new Queue('gofood-scraping', { redis: { url: process.env.REDIS_URL } }),
  'shopeefood': new Queue('shopeefood-scraping', { redis: { url: process.env.REDIS_URL } })
};

class ScrapeScheduler {
  constructor() {
    this.jobs = new Map();
    this.loadScheduledJobs();
  }

  /**
   * Load scheduled jobs from database
   */
  async loadScheduledJobs() {
    const schedules = await prisma.scrapeSchedule.findMany({
      where: { isActive: true }
    });

    for (const schedule of schedules) {
      this.scheduleJob(schedule);
    }
    console.log(`📅 Loaded ${schedules.length} scheduled jobs`);
  }

  /**
   * Schedule a new scraping job
   */
  scheduleJob(schedule) {
    const cronExpression = this.convertToCron(schedule);
    
    const job = cron.schedule(cronExpression, async () => {
      console.log(`🕐 Running scheduled job: ${schedule.name}`);
      
      try {
        const result = await this.executeScrapeJob(schedule);
        
        // Log execution
        await prisma.scrapeExecution.create({
          data: {
            scheduleId: schedule.id,
            status: 'success',
            result: result,
            executedAt: new Date()
          }
        });
        
        // Send webhook notification
        await this.notifyWebhook(schedule, result);
        
      } catch (error) {
        console.error(`❌ Job failed: ${schedule.name}`, error);
        
        await prisma.scrapeExecution.create({
          data: {
            scheduleId: schedule.id,
            status: 'failed',
            error: error.message,
            executedAt: new Date()
          }
        });
      }
    });
    
    this.jobs.set(schedule.id, job);
    console.log(`📅 Scheduled: ${schedule.name} (${cronExpression})`);
  }

  /**
   * Convert schedule config to cron expression
   */
  convertToCron(schedule) {
    // Support formats: 'daily', 'hourly', 'weekly', or custom cron
    const presets = {
      hourly: '0 * * * *',
      daily: '0 0 * * *',
      weekly: '0 0 * * 0',
      monthly: '0 0 1 * *'
    };
    
    if (presets[schedule.frequency]) {
      return presets[schedule.frequency];
    }
    
    // Custom cron expression
    return schedule.cronExpression;
  }

  /**
   * Execute scraping job
   */
  async executeScrapeJob(schedule) {
    const { platform, target, params } = schedule;
    
    // Add to queue instead of direct execution
    const queue = queues[platform];
    if (!queue) {
      throw new Error(`Unknown platform: ${platform}`);
    }
    
    const job = await queue.add('scrape', {
      platform,
      target,
      params,
      scheduleId: schedule.id
    });
    
    return { jobId: job.id, queuedAt: new Date() };
  }

  /**
   * Send webhook notification
   */
  async notifyWebhook(schedule, result) {
    if (!schedule.webhookUrl) return;
    
    const payload = {
      event: 'scrape_completed',
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      platform: schedule.platform,
      timestamp: new Date().toISOString(),
      result: result
    };
    
    try {
      await fetch(schedule.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error(`Webhook failed: ${error.message}`);
    }
  }

  /**
   * Create new schedule via API
   */
  async createSchedule(data) {
    const schedule = await prisma.scrapeSchedule.create({
      data: {
        name: data.name,
        platform: data.platform,
        frequency: data.frequency,
        cronExpression: data.cronExpression,
        target: data.target,
        params: data.params,
        webhookUrl: data.webhookUrl,
        isActive: true
      }
    });
    
    this.scheduleJob(schedule);
    return schedule;
  }

  /**
   * Update existing schedule
   */
  async updateSchedule(id, data) {
    // Remove old job
    const oldJob = this.jobs.get(id);
    if (oldJob) {
      oldJob.stop();
      this.jobs.delete(id);
    }
    
    // Update database
    const schedule = await prisma.scrapeSchedule.update({
      where: { id },
      data
    });
    
    // Reschedule
    if (schedule.isActive) {
      this.scheduleJob(schedule);
    }
    
    return schedule;
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(id) {
    const job = this.jobs.get(id);
    if (job) {
      job.stop();
      this.jobs.delete(id);
    }
    
    await prisma.scrapeSchedule.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Get all schedules with execution history
   */
  async getAllSchedules() {
    const schedules = await prisma.scrapeSchedule.findMany({
      include: {
        executions: {
          orderBy: { executedAt: 'desc' },
          take: 10
        }
      }
    });
    
    return schedules;
  }

  /**
   * Run manual scrape immediately
   */
  async runNow(scheduleId) {
    const schedule = await prisma.scrapeSchedule.findUnique({
      where: { id: scheduleId }
    });
    
    if (!schedule) {
      throw new Error('Schedule not found');
    }
    
    return this.executeScrapeJob(schedule);
  }
}

// Predefined schedule templates
const SCHEDULE_TEMPLATES = {
  // Shopee Indonesia - daily product price check
  shopee_id_daily_price: {
    name: 'Shopee ID - Daily Price Check',
    platform: 'shopee-id',
    frequency: 'daily',
    target: 'products',
    params: {
      productIds: [], // akan diisi manual
      fields: ['name', 'price', 'rating', 'soldCount']
    }
  },
  
  // GrabFood - hourly popular restaurants
  grabfood_hourly_trending: {
    name: 'GrabFood - Hourly Trending',
    platform: 'grabfood',
    frequency: 'hourly',
    target: 'restaurants',
    params: {
      cities: ['Jakarta', 'Surabaya', 'Bandung'],
      limit: 50,
      sortBy: 'rating'
    }
  },
  
  // Shopee International - weekly price comparison
  shopee_intl_weekly_compare: {
    name: 'Shopee Intl - Weekly Price Compare',
    platform: 'shopee-intl',
    frequency: 'weekly',
    target: 'compare',
    params: {
      regions: ['sg', 'my', 'ph', 'th'],
      productIds: []
    }
  },
  
  // GoFood - daily merchant monitoring
  gofood_daily_merchants: {
    name: 'GoFood - Daily Merchant Monitor',
    platform: 'gofood',
    frequency: 'daily',
    target: 'merchants',
    params: {
      cities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan'],
      cuisineTypes: ['Nasi Goreng', 'Bakmi', 'Sushi', 'Burgers']
    }
  },
  
  // ShopeeFood - hourly restaurant status
  shopeefood_hourly_status: {
    name: 'ShopeeFood - Hourly Restaurant Status',
    platform: 'shopeefood',
    frequency: 'hourly',
    target: 'restaurants',
    params: {
      location: { lat: -6.2088, lng: 106.8456 },
      radius: 5
    }
  }
};

module.exports = { ScrapeScheduler, SCHEDULE_TEMPLATES };