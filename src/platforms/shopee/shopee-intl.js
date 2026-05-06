/**
 * Shopee International Scraper - Support multiple regions
 */

const ShopeeBaseScraper = require('./shopee-base');

class ShopeeInternationalScraper extends ShopeeBaseScraper {
  constructor(region = 'sg', config = {}) {
    super(region, {
      locale: config.locale || 'en-SG',
      timezone: config.timezone || 'Asia/Singapore',
      ...config
    });
    
    this.supportedRegions = ['sg', 'my', 'th', 'ph', 'vn', 'tw'];
    
    if (!this.supportedRegions.includes(region)) {
      throw new Error(`Unsupported region: ${region}. Supported: ${this.supportedRegions.join(', ')}`);
    }
  }
  
  /**
   * Get multi-region product data
   */
  async getMultiRegionProduct(shopId, itemId, regions = ['sg', 'my', 'ph']) {
    const results = {};
    
    for (const region of regions) {
      try {
        const scraper = new ShopeeInternationalScraper(region);
        const product = await scraper.getProductById(shopId, itemId);
        results[region] = product;
      } catch (error) {
        results[region] = { error: error.message };
      }
    }
    
    return {
      shopId,
      itemId,
      regions: results,
      scrapedAt: new Date().toISOString()
    };
  }
  
  /**
   * Compare prices across regions
   */
  async comparePriceAcrossRegions(shopId, itemId, regions = ['sg', 'my', 'ph', 'id']) {
    const priceData = {};
    
    for (const region of regions) {
      try {
        // Skip ID if using international scraper
        if (region === 'id') continue;
        
        const scraper = new ShopeeInternationalScraper(region);
        const product = await scraper.getProductById(shopId, itemId);
        priceData[region] = {
          price: product.price,
          currency: region === 'sg' ? 'SGD' : region === 'my' ? 'MYR' : region === 'ph' ? 'PHP' : 'THB',
          url: product.url
        };
      } catch (error) {
        priceData[region] = { error: error.message };
      }
    }
    
    return {
      shopId,
      itemId,
      prices: priceData,
      scrapedAt: new Date().toISOString()
    };
  }
}

module.exports = ShopeeInternationalScraper;