/**
 * Shopee Indonesia Scraper - khusus untuk domain shopee.co.id
 */

const ShopeeBaseScraper = require('./shopee-base');

class ShopeeIDScraper extends ShopeeBaseScraper {
  constructor(config = {}) {
    super('id', {
      locale: 'id-ID',
      timezone: 'Asia/Jakarta',
      ...config
    });
    
    // Additional Indonesia-specific selectors
    this.selectors = {
      ...this.selectors,
      codAvailable: '[data-sqe="cod"]',
      voucher: '[data-sqe="voucher"]',
      installment: '[data-sqe="installment"]'
    };
  }
  
  /**
   * Scrape with COD information
   */
  async scrapeProductWithDetails(productUrl) {
    const baseData = await this.scrapeProduct(productUrl);
    
    // Add Indonesia-specific data
    const additionalData = await this.page.evaluate((selectors) => {
      return {
        codAvailable: !!document.querySelector(selectors.codAvailable),
        voucherCount: document.querySelectorAll(selectors.voucher).length,
        installmentAvailable: !!document.querySelector(selectors.installment)
      };
    }, this.selectors);
    
    return { ...baseData, ...additionalData };
  }
  
  /**
   * Get product recommendations (Indonesia specific)
   */
  async getRecommendations(productId) {
    await this.launchBrowser();
    
    try {
      const url = `${this.baseUrl}/recommendations/${productId}`;
      await this.navigateWithRetry(url);
      
      const recommendations = await this.page.evaluate(() => {
        const items = document.querySelectorAll('[data-sqe="recommendation-item"]');
        return Array.from(items).map(item => ({
          title: item.querySelector('[data-sqe="name"]')?.innerText,
          price: item.querySelector('[data-sqe="price"]')?.innerText,
          link: item.querySelector('a')?.href
        }));
      });
      
      return {
        productId,
        recommendations,
        platform: 'shopee',
        region: 'indonesia',
        scrapedAt: new Date().toISOString()
      };
      
    } finally {
      await this.close();
    }
  }
}

module.exports = ShopeeIDScraper;