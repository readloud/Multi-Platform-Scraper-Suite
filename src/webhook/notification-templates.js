/**
 * Notification Templates for different platforms
 */

const TEMPLATES = {
  // Shopee templates
  shopee: {
    product_found: (data) => ({
      title: `🛒 Product Found: ${data.name}`,
      body: `Price: ${data.price}\nShop: ${data.shopName}\nRating: ${data.rating || 'N/A'}`,
      color: '#ee4d2d'
    }),
    
    price_drop: (oldPrice, newPrice, product) => ({
      title: `💰 Price Drop Alert!`,
      body: `${product.name}\nOld: ${oldPrice} → New: ${newPrice}\nSave: ${oldPrice - newPrice}`,
      color: '#00ff00'
    }),
    
    out_of_stock: (product) => ({
      title: `⚠️ Out of Stock`,
      body: `${product.name} is no longer available`,
      color: '#ff0000'
    })
  },
  
  // GrabFood templates
  grabfood: {
    restaurant_open: (restaurant) => ({
      title: `🍔 ${restaurant.name} is Now Open!`,
      body: `Cuisine: ${restaurant.cuisine}\nDelivery: ${restaurant.deliveryFee}\nETA: ${restaurant.eta}`,
      color: '#00b14f'
    }),
    
    new_promo: (restaurant, promo) => ({
      title: `🎉 New Promo at ${restaurant.name}`,
      body: `${promo.description}\nValid until: ${promo.expiry}`,
      color: '#ff6600'
    })
  },
  
  // GoFood templates
  gofood: {
    merchant_trending: (merchant) => ({
      title: `🔥 Trending: ${merchant.name}`,
      body: `Rating: ${merchant.rating} ⭐\nReviews: ${merchant.reviewCount}\nDistance: ${merchant.distance}`,
      color: '#00aa13'
    })
  },
  
  // ShopeeFood templates
  shopeefood: {
    restaurant_new: (restaurant) => ({
      title: `🍜 New Restaurant: ${restaurant.name}`,
      body: `${restaurant.cuisine}\nMin Order: ${restaurant.minOrder}`,
      color: '#ee4d2d'
    })
  },
  
  // General alerts
  general: {
    error: (error) => ({
      title: `❌ Scraper Error`,
      body: `${error.platform}: ${error.message}\nTime: ${error.timestamp}`,
      color: '#ff0000'
    }),
    
    rate_limit: (platform, remaining) => ({
      title: `⚠️ Rate Limit Warning`,
      body: `${platform} has ${remaining} requests remaining`,
      color: '#ffaa00'
    })
  }
};

module.exports = TEMPLATES;