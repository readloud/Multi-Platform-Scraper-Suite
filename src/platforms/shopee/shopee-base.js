/**
 * Base Shopee Scraper - Extended by region-specific scrapers
 */

const BaseScraper = require('../../core/base-scraper');
const { getPlatformConfig, getPlatformDomain } = require('../../core/stealth-config');

class ShopeeBaseScraper extends BaseScraper {
  constructor(region = 'intl', config = {}) {
    const platformConfig = getPlatformConfig('shopee', region);
    super({
      ...platformConfig,
      ...config,
      region
    });
    
    this.region = region;
    this.domain = getPlatformDomain('shopee', region);
    this.baseUrl = `https://${this.domain}`;
    
    // Region-specific selectors (may override base)
    this.selectors = {
      ...platformConfig.selectors,
      ...config.selectors
    };
  }
  
  /**
   * Scrape single product
   */
  async scrapeProduct(productUrl) {
    await this.launchBrowser();
    
    try {
      // Navigate to product page
      await this.navigateWithRetry(productUrl);
      
      // Wait for product data to load
      await this.page.waitForSelector(this.selectors.productTitle, { timeout: 10000 });
      
      // Scroll to load all content
      await this.humanScroll(3, 500);
      
      // Extract product data
      const productData = await this.page.evaluate((selectors) => {
        const findText = (selectorList) => {
          const selectors = selectorList.split(', ');
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText?.trim()) {
              return el.innerText.trim();
            }
          }
          return null;
        };
        
        return {
          title: findText(selectors.productTitle),
          price: findText(selectors.productPrice),
          rating: findText(selectors.rating),
          soldCount: findText(selectors.soldCount),
          shopName: findText(selectors.shopName),
          description: findText(selectors.description),
          images: Array.from(document.querySelectorAll(selectors.images))
            .map(img => img.src || img.getAttribute('data-src'))
            .filter(src => src && src.startsWith('http')),
          url: window.location.href,
          platform: 'shopee',
          region: this.region,
          scrapedAt: new Date().toISOString()
        };
      }, this.selectors);
      
      // Take screenshot for debugging
      await this.takeScreenshot(`shopee-${this.region}-product`);
      
      return productData;
      
    } finally {
      await this.close();
    }
  }
  
  /**
   * Search products by keyword
   */
  async searchProducts(keyword, limit = 50) {
    await this.launchBrowser();
    
    try {
      const searchUrl = `${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}`;
      await this.navigateWithRetry(searchUrl);
      
      await this.page.waitForSelector('[data-sqe="item"]', { timeout: 10000 });
      
      // Scroll to load more products
      await this.humanScroll(10, 300);
      
      const products = await this.page.evaluate((limit) => {
        const items = document.querySelectorAll('[data-sqe="item"]');
        const results = [];
        
        for (let i = 0; i < Math.min(items.length, limit); i++) {
          const item = items[i];
          results.push({
            title: item.querySelector('[data-sqe="name"]')?.innerText?.trim(),
            price: item.querySelector('[data-sqe="price"]')?.innerText?.trim(),
            soldCount: item.querySelector('[data-sqe="sold"]')?.innerText?.trim(),
            rating: item.querySelector('[data-sqe="rating"]')?.innerText?.trim(),
            link: item.querySelector('a')?.href
          });
        }
        
        return results;
      }, limit);
      
      return {
        keyword,
        totalFound: products.length,
        products,
        platform: 'shopee',
        region: this.region,
        scrapedAt: new Date().toISOString()
      };
      
    } finally {
      await this.close();
    }
  }
  
  /**
   * Get product by ID
   */
  async getProductById(shopId, itemId) {
    const productUrl = `${this.baseUrl}/product/${shopId}/${itemId}`;
    return this.scrapeProduct(productUrl);
  }
}

module.exports = ShopeeBaseScraper;