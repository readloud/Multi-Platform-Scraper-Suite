/**
 * GrabFood Base Scraper
 * Note: GrabFood does not provide official API - this uses reverse-engineered endpoints
 */

const BaseScraper = require('../../core/base-scraper');
const { getPlatformDomain } = require('../../core/stealth-config');

class GrabFoodBaseScraper extends BaseScraper {
  constructor(region = 'sg', config = {}) {
    const domains = {
      sg: 'food.grab.com/sg',
      my: 'food.grab.com/my',
      id: 'food.grab.com/id',
      th: 'food.grab.com/th',
      ph: 'food.grab.com/ph',
      vn: 'food.grab.com/vn'
    };
    
    super({
      locale: config.locale || (region === 'id' ? 'id-ID' : 'en-SG'),
      timezone: config.timezone || (region === 'id' ? 'Asia/Jakarta' : 'Asia/Singapore'),
      domain: domains[region],
      ...config
    });
    
    this.region = region;
    this.baseUrl = `https://${domains[region]}`;
    this.authTokens = null;
    this.tokenFile = `grabfood-tokens-${region}.json`;
  }
  
  /**
   * Capture authentication token using Playwright
   */
  async captureAuthToken(lat, lng) {
    await this.launchBrowser();
    
    try {
      const url = `${this.baseUrl}/en/${this.region}/`;
      await this.navigateWithRetry(url);
      
      // Wait for network requests to capture token
      const token = await this.page.evaluate(async () => {
        // Intercept network requests to extract x-recaptcha-token
        let capturedToken = null;
        
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
          const response = await originalFetch(...args);
          
          // Clone response to read headers
          const clonedResponse = response.clone();
          const headers = clonedResponse.headers;
          
          if (headers.get('x-recaptcha-token')) {
            capturedToken = headers.get('x-recaptcha-token');
          }
          
          return response;
        };
        
        // Wait a bit for requests to fire
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return capturedToken;
      });
      
      // Save tokens
      this.authTokens = {
        token,
        capturedAt: new Date().toISOString(),
        location: { lat, lng }
      };
      
      const fs = require('fs');
      fs.writeFileSync(this.tokenFile, JSON.stringify(this.authTokens, null, 2));
      
      return this.authTokens;
      
    } finally {
      await this.close();
    }
  }
  
  /**
   * Search restaurants near location
   */
  async searchRestaurants(lat, lng, keyword = '', limit = 50) {
    // Ensure we have valid token
    if (!this.authTokens) {
      await this.captureAuthToken(lat, lng);
    }
    
    // Use guest endpoint (doesn't require recaptcha token)
    const searchUrl = `${this.baseUrl}/guest/v2/category?lat=${lat}&lng=${lng}&keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
    
    await this.launchBrowser();
    
    try {
      // Set geolocation
      await this.context.setGeolocation({ latitude: lat, longitude: lng });
      
      // Navigate to search
      await this.navigateWithRetry(searchUrl);
      
      // Wait for restaurants to load
      await this.page.waitForSelector('[data-testid="restaurant-card"]', { timeout: 10000 });
      
      const restaurants = await this.page.evaluate((limit) => {
        const cards = document.querySelectorAll('[data-testid="restaurant-card"]');
        const results = [];
        
        for (let i = 0; i < Math.min(cards.length, limit); i++) {
          const card = cards[i];
          results.push({
            name: card.querySelector('[data-testid="restaurant-name"]')?.innerText,
            cuisine: card.querySelector('[data-testid="cuisine-tag"]')?.innerText,
            rating: card.querySelector('[data-testid="rating-stars"]')?.innerText,
            deliveryFee: card.querySelector('[data-testid="delivery-fee"]')?.innerText,
            eta: card.querySelector('[data-testid="delivery-time"]')?.innerText,
            isOpen: card.querySelector('[data-testid="open-status"]')?.innerText === 'Open',
            link: card.querySelector('a')?.href
          });
        }
        
        return results;
      }, limit);
      
      return {
        location: { lat, lng },
        keyword: keyword || 'all',
        totalFound: restaurants.length,
        restaurants,
        platform: 'grabfood',
        region: this.region,
        scrapedAt: new Date().toISOString()
      };
      
    } finally {
      await this.close();
    }
  }
  
  /**
   * Get restaurant menu
   */
  async getRestaurantMenu(restaurantId) {
    await this.launchBrowser();
    
    try {
      const menuUrl = `${this.baseUrl}/en/${this.region}/restaurant/${restaurantId}`;
      await this.navigateWithRetry(menuUrl);
      
      await this.page.waitForSelector('[data-testid="menu-item"]', { timeout: 10000 });
      
      const menu = await this.page.evaluate(() => {
        const items = document.querySelectorAll('[data-testid="menu-item"]');
        const categories = new Map();
        
        items.forEach(item => {
          const category = item.closest('[data-testid="menu-category"]');
          const categoryName = category?.querySelector('[data-testid="category-name"]')?.innerText || 'Uncategorized';
          
          if (!categories.has(categoryName)) {
            categories.set(categoryName, []);
          }
          
          categories.get(categoryName).push({
            name: item.querySelector('[data-testid="item-name"]')?.innerText,
            description: item.querySelector('[data-testid="item-description"]')?.innerText,
            price: item.querySelector('[data-testid="item-price"]')?.innerText,
            isAvailable: item.querySelector('[data-testid="item-available"]')?.innerText !== 'Out of Stock',
            image: item.querySelector('img')?.src
          });
        });
        
        return Object.fromEntries(categories);
      });
      
      return {
        restaurantId,
        menu,
        platform: 'grabfood',
        region: this.region,
        scrapedAt: new Date().toISOString()
      };
      
    } finally {
      await this.close();
    }
  }
}

module.exports = GrabFoodBaseScraper;