/**
 * Base Scraper Class - Extended by all platform scrapers
 */

const { chromium } = require('playwright');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class BaseScraper extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      headless: process.env.HEADLESS !== 'false',
      timeout: parseInt(process.env.TIMEOUT) || 45000,
      retries: parseInt(process.env.RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.RETRY_DELAY) || 2000,
      viewport: { width: 1920, height: 1080 },
      locale: config.locale || 'en-SG',
      timezone: config.timezone || 'Asia/Singapore',
      ...config
    };
    
    this.browser = null;
    this.context = null;
    this.page = null;
    
    // Platform-specific selectors (to be overridden)
    this.selectors = {};
    
    // Rate limiting
    this.lastRequestTime = 0;
    this.minRequestInterval = parseInt(process.env.MIN_REQUEST_INTERVAL) || 2000;
  }

  /**
   * Apply stealth patches to avoid detection
   */
  async applyStealthPatches(page) {
    await page.addInitScript(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // Fake plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
      
      // Fake languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
      
      // Chrome runtime
      window.chrome = { runtime: {} };
      
      // WebGL vendor
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter(parameter);
      };
    });
  }

  /**
   * Launch browser with stealth configuration
   */
  async launchBrowser() {
    this.emit('browser_launching', { headless: this.config.headless });
    
    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-features=BlockInsecurePrivateNetworkRequests',
        '--disable-features=OutOfBlinkCors'
      ]
    });
    
    this.context = await this.browser.newContext({
      viewport: this.config.viewport,
      userAgent: this.getRandomUserAgent(),
      locale: this.config.locale,
      timezoneId: this.config.timezone,
      permissions: ['geolocation'],
      geolocation: this.config.geolocation,
      extraHTTPHeaders: {
        'Accept-Language': this.config.locale.replace('_', '-'),
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"'
      }
    });
    
    this.page = await this.context.newPage();
    await this.applyStealthPatches(this.page);
    
    // Set default timeout
    this.page.setDefaultTimeout(this.config.timeout);
    this.page.setDefaultNavigationTimeout(this.config.timeout);
    
    this.emit('browser_launched', { browser: this.browser });
    
    return { browser: this.browser, context: this.context, page: this.page };
  }

  /**
   * Get random User-Agent
   */
  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Throttle requests
   */
  async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestInterval) {
      const delay = this.minRequestInterval - elapsed;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Human-like scrolling
   */
  async humanScroll(scrollCount = 5, delayBetween = 500) {
    for (let i = 0; i < scrollCount; i++) {
      await this.page.evaluate((scrollY) => {
        window.scrollBy(0, scrollY);
      }, Math.floor(Math.random() * 300) + 200);
      
      await new Promise(resolve => setTimeout(resolve, delayBetween + Math.random() * 300));
    }
  }

  /**
   * Random delay between actions
   */
  async randomDelay(min = 500, max = 1500) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Navigate with retry
   */
  async navigateWithRetry(url, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        await this.throttle();
        this.emit('navigation_start', { url, attempt });
        
        const response = await this.page.goto(url, {
          waitUntil: options.waitUntil || 'networkidle',
          timeout: this.config.timeout
        });
        
        // Check for blocking
        const status = response.status();
        if (status === 403 || status === 429) {
          throw new Error(`Blocked with status ${status}`);
        }
        
        await this.randomDelay(1000, 2000);
        this.emit('navigation_success', { url, attempt });
        
        return response;
        
      } catch (error) {
        lastError = error;
        this.emit('navigation_retry', { url, attempt, error: error.message });
        
        if (attempt < this.config.retries) {
          const backoffDelay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Save cookies for session persistence
   */
  async saveCookies(filepath) {
    const cookies = await this.context.cookies();
    fs.writeFileSync(filepath, JSON.stringify(cookies, null, 2));
    this.emit('cookies_saved', { filepath, count: cookies.length });
  }

  /**
   * Load cookies from file
   */
  async loadCookies(filepath) {
    if (fs.existsSync(filepath)) {
      const cookies = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      await this.context.addCookies(cookies);
      this.emit('cookies_loaded', { filepath, count: cookies.length });
    }
  }

  /**
   * Take screenshot (useful for debugging)
   */
  async takeScreenshot(name) {
    const screenshotDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const filename = `${name}-${Date.now()}.png`;
    const filepath = path.join(screenshotDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: false });
    
    return filepath;
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.emit('browser_closed');
    }
  }

  /**
   * Main scrape method - to be overridden by child classes
   */
  async scrape(target) {
    throw new Error('Scrape method must be implemented by child class');
  }
}

module.exports = BaseScraper;