/**
 * ShopeeFood Scraper - Food delivery service by Shopee
 */

const BaseScraper = require('../../core/base-scraper');

class ShopeeFoodBaseScraper extends BaseScraper {
  constructor(region = 'id', config = {}) {
    const domains = {
      id: 'shopeefood.co.id',
      sg: 'shopeefood.sg',
      my: 'shopeefood.com.my',
      th: 'shopeefood.co.th'
    };
    
    super({
      locale: region === 'id' ? 'id-ID' : 'en-SG',
      timezone: region === 'id' ? 'Asia/Jakarta' : 'Asia/Singapore',
      domain: domains[region],
      ...config
    });
    
    this.region = region;
    this.baseUrl = `https://${domains[region]}`;
    this.apiBase = `${this.baseUrl}/api/v4`;
  }
  
  /**
   * Search restaurants by location
   */
  async searchRestaurants(lat, lng, keyword = '', limit = 50) {
    await this.launchBrowser();
    
    try {
      // Set geolocation
      await this.context.setGeolocation({ latitude: lat, longitude: lng });
      
      // Navigate to search page
      const searchUrl = `${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}&lat=${lat}&lng=${lng}`;
      await this.navigateWithRetry(searchUrl);
      
      // Wait for restaurants to load
      await this.page.waitForSelector('[data-sqe="restaurant-card"]', { timeout: 10000 });
      await this.humanScroll(3, 500);
      
      const restaurants = await this.page.evaluate((limit) => {
        const cards = document.querySelectorAll('[data-sqe="restaurant-card"]');
        const results = [];
        
        for (let i = 0; i < Math.min(cards.length, limit); i++) {
          const card = cards[i];
          results.push({
            id: card.getAttribute('data-id'),
            name: card.querySelector('[data-sqe="restaurant-name"]')?.innerText,
            cuisine: card.querySelector('[data-sqe="cuisine"]')?.innerText,
            rating: card.querySelector('[data-sqe="rating"]')?.innerText,
            minOrder: card.querySelector('[data-sqe="min-order"]')?.innerText,
            deliveryFee: card.querySelector('[data-sqe="delivery-fee"]')?.innerText,
            estimatedTime: card.querySelector('[data-sqe="eta"]')?.innerText,
            distance: card.querySelector('[data-sqe="distance"]')?.innerText,
            promo: card.querySelector('[data-sqe="promo"]')?.innerText,
            image: card.querySelector('img')?.src,
            isOpen: card.querySelector('[data-sqe="open-status"]')?.innerText === 'Open'
          });
        }
        
        return results;
      }, limit);
      
      return {
        location: { lat, lng },
        keyword: keyword || 'all',
        totalFound: restaurants.length,
        restaurants,
        platform: 'shopeefood',
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
      const menuUrl = `${this.baseUrl}/restaurant/${restaurantId}`;
      await this.navigateWithRetry(menuUrl);
      
      await this.page.waitForSelector('[data-sqe="menu-item"]', { timeout: 10000 });
      
      const menu = await this.page.evaluate(() => {
        const categories = document.querySelectorAll('[data-sqe="menu-category"]');
        const result = {};
        
        categories.forEach(category => {
          const categoryName = category.querySelector('[data-sqe="category-name"]')?.innerText || 'Main Menu';
          const items = category.querySelectorAll('[data-sqe="menu-item"]');
          
          result[categoryName] = Array.from(items).map(item => ({
            name: item.querySelector('[data-sqe="item-name"]')?.innerText,
            description: item.querySelector('[data-sqe="item-desc"]')?.innerText,
            price: item.querySelector('[data-sqe="item-price"]')?.innerText,
            isAvailable: item.querySelector('[data-sqe="item-status"]')?.innerText !== 'Sold Out',
            image: item.querySelector('img')?.src
          }));
        });
        
        return result;
      });
      
      return {
        restaurantId,
        menu,
        totalItems: Object.values(menu).reduce((sum, items) => sum + items.length, 0),
        platform: 'shopeefood',
        region: this.region,
        scrapedAt: new Date().toISOString()
      };
      
    } finally {
      await this.close();
    }
  }
}

module.exports = ShopeeFoodBaseScraper;