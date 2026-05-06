/**
 * GrabFood Indonesia Scraper
 */

const GrabFoodBaseScraper = require('./grabfood-base');

class GrabFoodIDScraper extends GrabFoodBaseScraper {
  constructor(config = {}) {
    super('id', {
      locale: 'id-ID',
      timezone: 'Asia/Jakarta',
      ...config
    });
  }
  
  /**
   * Search with Indonesian cities
   */
  async searchByCity(city, keyword = '') {
    const cityCoordinates = {
      jakarta: { lat: -6.2088, lng: 106.8456 },
      surabaya: { lat: -7.2575, lng: 112.7521 },
      bandung: { lat: -6.9175, lng: 107.6191 },
      medan: { lat: 3.5952, lng: 98.6722 },
      semarang: { lat: -6.9667, lng: 110.4167 },
      makassar: { lat: -5.1477, lng: 119.4327 },
      palembang: { lat: -2.9761, lng: 104.7754 },
      denpasar: { lat: -8.6705, lng: 115.2126 }
    };
    
    const coords = cityCoordinates[city.toLowerCase()];
    if (!coords) {
      throw new Error(`City not found: ${city}`);
    }
    
    return this.searchRestaurants(coords.lat, coords.lng, keyword);
  }
}

module.exports = GrabFoodIDScraper;