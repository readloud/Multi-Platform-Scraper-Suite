/**
 * Output Handler
 * Save scraped data to JSON, CSV, and other formats
 */

const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

class OutputHandler {
  constructor(config = {}) {
    this.outputDir = config.outputDir || process.env.OUTPUT_DIR || './output';
    this.formats = config.formats || ['json', 'csv'];
    this.compress = config.compress || false;
    this.createOutputDir();
  }

  /**
   * Create output directory if not exists
   */
  createOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate filename with timestamp
   */
  generateFilename(prefix, platform, extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(this.outputDir, `${prefix}-${platform}-${timestamp}.${extension}`);
  }

  /**
   * Save data to JSON file
   */
  async saveToJSON(data, options = {}) {
    const {
      prefix = 'scrape',
      platform = 'unknown',
      pretty = true,
      filename = null
    } = options;

    const filepath = filename || this.generateFilename(prefix, platform, 'json');
    const jsonString = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    
    fs.writeFileSync(filepath, jsonString);
    console.log(`💾 JSON saved: ${filepath}`);
    
    return filepath;
  }

  /**
   * Save data to CSV file
   */
  async saveToCSV(data, options = {}) {
    const {
      prefix = 'scrape',
      platform = 'unknown',
      fields = null,
      filename = null
    } = options;

    // Handle different data structures
    let records = [];
    
    if (Array.isArray(data)) {
      records = data;
    } else if (data.products || data.restaurants || data.merchants) {
      records = data.products || data.restaurants || data.merchants || [data];
    } else {
      records = [data];
    }

    if (records.length === 0) {
      console.warn('No data to save to CSV');
      return null;
    }

    const filepath = filename || this.generateFilename(prefix, platform, 'csv');
    
    try {
      const parser = new Parser({ fields });
      const csv = parser.parse(records);
      fs.writeFileSync(filepath, csv);
      console.log(`📊 CSV saved: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error(`Failed to save CSV: ${error.message}`);
      return null;
    }
  }

  /**
   * Save screenshot
   */
  async saveScreenshot(page, options = {}) {
    const {
      prefix = 'screenshot',
      platform = 'unknown',
      fullPage = false,
      filename = null
    } = options;

    const screenshotDir = path.join(this.outputDir, 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const filepath = filename || path.join(screenshotDir, `${prefix}-${platform}-${Date.now()}.png`);
    
    await page.screenshot({ path: filepath, fullPage });
    console.log(`📸 Screenshot saved: ${filepath}`);
    
    return filepath;
  }

  /**
   * Save data in multiple formats
   */
  async saveAll(data, options = {}) {
    const results = {};
    
    if (this.formats.includes('json')) {
      results.json = await this.saveToJSON(data, options);
    }
    
    if (this.formats.includes('csv')) {
      results.csv = await this.saveToCSV(data, options);
    }
    
    if (options.screenshot && options.page) {
      results.screenshot = await this.saveScreenshot(options.page, options);
    }
    
    return results;
  }

  /**
   * Save product data with specific structure
   */
  async saveProduct(productData, options = {}) {
    const enrichedData = {
      ...productData,
      savedAt: new Date().toISOString(),
      schema: 'shopee-product-v1'
    };
    
    return this.saveAll(enrichedData, {
      prefix: 'product',
      platform: productData.platform || productData.region || 'shopee',
      ...options
    });
  }

  /**
   * Save restaurant data
   */
  async saveRestaurant(restaurantData, options = {}) {
    const enrichedData = {
      ...restaurantData,
      savedAt: new Date().toISOString(),
      schema: 'food-restaurant-v1'
    };
    
    return this.saveAll(enrichedData, {
      prefix: 'restaurant',
      platform: restaurantData.platform || 'grabfood',
      ...options
    });
  }

  /**
   * Save search results
   */
  async saveSearchResults(results, options = {}) {
    const enrichedData = {
      ...results,
      savedAt: new Date().toISOString(),
      schema: 'search-results-v1'
    };
    
    return this.saveAll(enrichedData, {
      prefix: 'search',
      platform: results.platform || 'shopee',
      ...options
    });
  }

  /**
   * Save to database (PostgreSQL)
   */
  async saveToDatabase(data, model, prisma) {
    try {
      const result = await prisma[model].create({
        data: this.prepareForDatabase(data)
      });
      console.log(`💾 Database saved: ${model} (ID: ${result.id})`);
      return result;
    } catch (error) {
      console.error(`Failed to save to database: ${error.message}`);
      return null;
    }
  }

  /**
   * Prepare data for database insertion
   */
  prepareForDatabase(data) {
    // Remove circular references and functions
    const cleaned = JSON.parse(JSON.stringify(data));
    
    // Truncate long strings
    for (const key in cleaned) {
      if (typeof cleaned[key] === 'string' && cleaned[key].length > 10000) {
        cleaned[key] = cleaned[key].substring(0, 10000);
      }
    }
    
    return cleaned;
  }

  /**
   * Save to multiple outputs (JSON, CSV, DB)
   */
  async saveToMultiple(data, options = {}) {
    const {
      toJSON = true,
      toCSV = true,
      toDatabase = false,
      toScreenshot = false,
      model = null,
      prisma = null,
      page = null
    } = options;
    
    const results = {};
    
    if (toJSON) {
      results.json = await this.saveToJSON(data, options);
    }
    
    if (toCSV) {
      results.csv = await this.saveToCSV(data, options);
    }
    
    if (toDatabase && model && prisma) {
      results.database = await this.saveToDatabase(data, model, prisma);
    }
    
    if (toScreenshot && page) {
      results.screenshot = await this.saveScreenshot(page, options);
    }
    
    return results;
  }

  /**
   * Archive old outputs
   */
  async archiveOldOutputs(daysOld = 30) {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let archivedCount = 0;
    
    const files = fs.readdirSync(this.outputDir);
    const archiveDir = path.join(this.outputDir, 'archive');
    
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    for (const file of files) {
      const filepath = path.join(this.outputDir, file);
      const stats = fs.statSync(filepath);
      
      if (stats.mtimeMs < cutoff) {
        const archivePath = path.join(archiveDir, file);
        fs.renameSync(filepath, archivePath);
        archivedCount++;
      }
    }
    
    console.log(`📦 Archived ${archivedCount} files older than ${daysOld} days`);
    return archivedCount;
  }

  /**
   * Get output statistics
   */
  getStats() {
    const files = fs.readdirSync(this.outputDir);
    let totalSize = 0;
    let fileTypes = {};
    
    for (const file of files) {
      const filepath = path.join(this.outputDir, file);
      const stats = fs.statSync(filepath);
      totalSize += stats.size;
      
      const ext = path.extname(file);
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
    }
    
    return {
      totalFiles: files.length,
      totalSize: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
      fileTypes,
      outputDir: this.outputDir
    };
  }
}

/**
 * Batch output handler for multiple products
 */
class BatchOutputHandler extends OutputHandler {
  constructor(config = {}) {
    super(config);
    this.batch = [];
    this.batchSize = config.batchSize || 100;
  }

  add(data) {
    this.batch.push(data);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.batch.length === 0) return;
    
    const batchData = [...this.batch];
    this.batch = [];
    
    await this.saveToJSON(batchData, {
      prefix: 'batch',
      platform: 'multiple',
      filename: path.join(this.outputDir, `batch-${Date.now()}.json`)
    });
    
    console.log(`📦 Flushed ${batchData.length} items to batch file`);
  }

  async finalize() {
    await this.flush();
  }
}

module.exports = { OutputHandler, BatchOutputHandler };