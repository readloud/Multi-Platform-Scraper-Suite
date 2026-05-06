/**
 * Stealth Configuration - Anti-detection settings for each platform
 */

const STEALTH_CONFIGS = {
  // Shopee International (sg, my, ph, th)
  shopee_intl: {
    locale: 'en-SG',
    timezone: 'Asia/Singapore',
    selectors: {
      productTitle: '[data-sqe="name"], .product-briefing__name',
      productPrice: '[data-sqe="price"], .product-briefing__price--normal',
      rating: '[data-sqe="rating"], .product-rating-overview__rating',
      soldCount: '[data-sqe="sold"], .product-rating-overview__sales',
      shopName: '[data-sqe="shop-name"], .shop-name',
      description: '[data-sqe="description"], .product-description',
      images: 'img[src*="cf.shopee"]',
      variants: '[class*="variant-unit"], [class*="variation"]'
    },
    antiDetection: {
      removeWebdriver: true,
      fakePlugins: true,
      fakeLanguages: true,
      fakeChromeRuntime: true,
      fakeWebGL: true
    }
  },
  
  // Shopee Indonesia
  shopee_id: {
    locale: 'id-ID',
    timezone: 'Asia/Jakarta',
    domain: 'shopee.co.id',
    selectors: {
      productTitle: '[data-sqe="name"], .product-briefing__name',
      productPrice: '[data-sqe="price"], .product-briefing__price--normal',
      rating: '[data-sqe="rating"], .product-rating-overview__rating',
      soldCount: '[data-sqe="sold"], .product-rating-overview__sales',
      shopName: '[data-sqe="shop-name"], .shop-name',
      description: '[data-sqe="description"], .product-description'
    },
    antiDetection: {
      removeWebdriver: true,
      fakePlugins: true,
      fakeLanguages: true,
      fakeChromeRuntime: true
    }
  },
  
  // GrabFood
  grabfood: {
    locale: 'en-SG',
    timezone: 'Asia/Singapore',
    domain: 'food.grab.com',
    apiEndpoints: {
      guestCategory: '/guest/v2/category',
      restaurantSearch: '/guest/v2/restaurant'
    },
    selectors: {
      restaurantName: '[data-testid="restaurant-name"]',
      cuisineType: '[data-testid="cuisine-tag"]',
      rating: '[data-testid="rating-stars"]',
      deliveryFee: '[data-testid="delivery-fee"]',
      eta: '[data-testid="delivery-time"]'
    },
    authRequired: true,
    tokenCapture: true
  },
  
  // GoFood
  gofood: {
    locale: 'id-ID',
    timezone: 'Asia/Jakarta',
    domain: 'gofood.co.id',
    apiEndpoints: {
      merchantSearch: '/api/v2/merchants',
      productList: '/api/v2/products'
    },
    selectors: {
      merchantName: '[data-testid="merchant-name"]',
      rating: '[data-testid="rating"]',
      price: '[data-testid="product-price"]'
    },
    headers: {
      'X-AppVersion': '5.0.0',
      'X-Platform': 'web'
    }
  },
  
  // ShopeeFood
  shopee_food: {
    locale: 'id-ID',
    timezone: 'Asia/Jakarta',
    domain: 'shopeefood.co.id',
    selectors: {
      restaurantName: '[data-sqe="restaurant-name"]',
      category: '[data-sqe="category"]',
      rating: '[data-sqe="rating"]',
      minOrder: '[data-sqe="min-order"]'
    }
  }
};

/**
 * Get configuration for specific platform
 */
function getPlatformConfig(platform, region = 'intl') {
  if (platform === 'shopee') {
    if (region === 'id') return STEALTH_CONFIGS.shopee_id;
    return STEALTH_CONFIGS.shopee_intl;
  }
  
  if (platform === 'grabfood') return STEALTH_CONFIGS.grabfood;
  if (platform === 'gofood') return STEALTH_CONFIGS.gofood;
  if (platform === 'shopee_food') return STEALTH_CONFIGS.shopee_food;
  
  return null;
}

/**
 * Get domain for platform and region
 */
function getPlatformDomain(platform, region = 'intl') {
  const domains = {
    shopee: {
      id: 'shopee.co.id',
      sg: 'shopee.sg',
      my: 'shopee.com.my',
      th: 'shopee.co.th',
      ph: 'shopee.ph',
      vn: 'shopee.vn',
      tw: 'shopee.tw'
    },
    grabfood: {
      sg: 'food.grab.com/sg',
      my: 'food.grab.com/my',
      id: 'food.grab.com/id',
      th: 'food.grab.com/th',
      ph: 'food.grab.com/ph',
      vn: 'food.grab.com/vn'
    },
    gofood: {
      id: 'gofood.co.id'
    },
    shopee_food: {
      id: 'shopeefood.co.id',
      sg: 'shopeefood.sg'
    }
  };
  
  return domains[platform]?.[region] || domains[platform]?.intl || null;
}

module.exports = {
  STEALTH_CONFIGS,
  getPlatformConfig,
  getPlatformDomain
};