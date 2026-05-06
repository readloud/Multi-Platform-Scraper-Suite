/**
 * GoFood Indonesia Scraper
 */

const BaseScraper = require('../../core/base-scraper');

class GoFoodBaseScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      locale: 'id-ID',
      timezone: 'Asia/Jakarta',
      domain: 'gofood.co.id',
      ...config
    });
    
    this.baseUrl = 'https://gofood.co.id';
    this.apiUrl = 'https://gofood.co.id/api';
  }
  
  /**
   * Search merchants by location
   */
  async searchMerchants(lat, lng, keyword = '', limit = 30) {
    await this.launchBrowser();
    
    try {
      // Use GoFood API endpoint
      const searchUrl = `${this.apiUrl}/v2/merchants?lat=${lat}&lng=${lng}&keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
      
      // Set geolocation
      await this.context.setGeolocation({ latitude: lat, longitude: lng });
      
      const response = await this.page.goto(searchUrl, {
        waitUntil: 'networkidle'
      });
      
      const data = await response.json();
      
      const merchants = data.merchants?.map(merchant => ({
        id: merchant.id,
        name: merchant.name,
        cuisine: merchant.cuisine_type,
        rating: merchant.rating,
        reviewCount: merchant.review_count,
        minOrder: merchant.min_order,
        deliveryFee: merchant.delivery_fee,
        estimatedTime: merchant.estimated_delivery_time,
        distance: merchant.distance_km,
        isOpen: merchant.is_open,
        promo: merchant.promo?.description,
        imageUrl: merchant.image_url,
        url: `${this.baseUrl}/merchant/${merchant.slug}`
      })) || [];
      
      return {
        location: { lat, lng },
        keyword: keyword || 'all',
        totalFound: merchants.length,
        merchants,
        platform: 'gofood',
        region: 'indonesia',
        scrapedAt: new Date().toISOString()
      };
      
    } finally {
      await this.close();
    }
  }
  
  /**
   * Get merchant products/menu
   */
  async getMerchantProducts(merchantId) {
    await this.launchBrowser();
    
    try {
      const productsUrl = `${this.apiUrl}/v2/merchants/${merchantId}/products`;
      const response = await this.page.goto(productsUrl, {
        waitUntil: 'networkidle'
      });
      
      const data = await response.json();
      
      const categories = data.categories?.map(category => ({
        name: category.name,
        products: category.products?.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          originalPrice: product.original_price,
          isAvailable: product.is_available,
          imageUrl: product.image_url,
          modifierGroups: product.modifier_groups?.map(group => ({
            name: group.name,
            minChoice: group.min_choice,
            maxChoice: group.max_choice,
            options: group.options?.map(opt => ({
              name: opt.name,
              price: opt.price
            }))
          }))
        }))
      })) || [];
      
      return {
        merchantId,
        categories,
        totalProducts: categories.reduce((sum, cat) => sum + (cat.products?.length || 0), 0),
        platform: 'gofood',
        region: 'indonesia',
        scrapedAt: new Date().toISOString()
      };
      
    } finally {
      await this.close();
    }
  }
  
  /**
   * Search by Indonesian city
   */
  async searchByCity(city, keyword = '') {
    const cityCoordinates = {
      jakarta: { lat: -6.2088, lng: 106.8456 },
      surabaya: { lat: -7.2575, lng: 112.7521 },
      bandung: { lat: -6.9175, lng: 107.6191 },
      bekasi: { lat: -6.2383, lng: 106.9756 },
      tangerang: { lat: -6.1783, lng: 106.6319 },
      depok: { lat: -6.4025, lng: 106.7942 },
      semarang: { lat: -6.9667, lng: 110.4167 },
      medan: { lat: 3.5952, lng: 98.6722 },
      makassar: { lat: -5.1477, lng: 119.4327 },
      palembang: { lat: -2.9761, lng: 104.7754 },
      batam: { lat: 1.1301, lng: 104.0531 },
      pekanbaru: { lat: 0.5071, lng: 101.4478 }
    };
    
    const coords = cityCoordinates[city.toLowerCase()];
    if (!coords) {
      throw new Error(`City not found: ${city}. Supported: ${Object.keys(cityCoordinates).join(', ')}`);
    }
    
    return this.searchMerchants(coords.lat, coords.lng, keyword);
  }
}

module.exports = GoFoodBaseScraper;