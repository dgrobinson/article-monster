// FiveFilters configuration fetcher
// Reads site configs from local directory

const fs = require('fs').promises;
const path = require('path');

class ConfigFetcher {
  constructor() {
    this.configCache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.configDir = path.join(__dirname, '../site-configs');
  }

  async getConfigForSite(hostname) {
    // Remove www. prefix
    const cleanHost = hostname.replace(/^www\./, '');

    // Check cache first
    const cached = this.configCache.get(cleanHost);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.config;
    }

    try {
      const configPath = path.join(this.configDir, `${cleanHost}.txt`);
      const configContent = await fs.readFile(configPath, 'utf8');

      // Parse the FiveFilters config format
      const config = this.parseFtrConfig(configContent);

      // Cache the result
      this.configCache.set(cleanHost, {
        config: config,
        timestamp: Date.now()
      });

      return config;

    } catch (error) {
      console.log(`No FiveFilters config found for ${cleanHost}:`, error.message);
      return null;
    }
  }

  parseFtrConfig(configText) {
    const lines = configText.split('\n');
    const config = {
      title: [],
      body: [],
      author: [],
      strip: [],
      date: [],
      preferJsonLd: false
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

      if (trimmed.startsWith('title:')) {
        config.title.push(trimmed.substring(6).trim());
      } else if (trimmed.startsWith('body:')) {
        config.body.push(trimmed.substring(5).trim());
      } else if (trimmed.startsWith('author:')) {
        config.author.push(trimmed.substring(7).trim());
      } else if (trimmed.startsWith('date:')) {
        config.date.push(trimmed.substring(5).trim());
      } else if (trimmed.startsWith('strip:')) {
        config.strip.push(trimmed.substring(6).trim());
      } else if (trimmed.startsWith('strip_id_or_class:')) {
        // Convert class-based strips to XPath
        const className = trimmed.substring(18).trim();
        config.strip.push(`//*[contains(@class, '${className}') or contains(@id, '${className}')]`);
      } else if (trimmed.startsWith('prefer_jsonld:')) {
        const value = trimmed.substring(14).trim().toLowerCase();
        config.preferJsonLd = value === 'true' || value === '1';
      }
    }

    // Only return if we have at least title and body rules
    return (config.title.length > 0 && config.body.length > 0) ? config : null;
  }

  // Preload all configs present in the directory
  async preloadConfigs() {
    try {
      const files = await fs.readdir(this.configDir);
      const promises = files
        .filter(f => f.endsWith('.txt'))
        .map(f => this.getConfigForSite(path.basename(f, '.txt')));
      await Promise.allSettled(promises);
      console.log('Site config preloading completed');
    } catch (error) {
      console.log('Site config preloading skipped:', error.message);
    }
  }

  // Generate client-side config for bookmarklet
  generateClientConfig(hostname) {
    const cached = this.configCache.get(hostname.replace(/^www\./, ''));
    if (!cached) return null;

    return {
      hostname: hostname,
      config: cached.config,
      updatedAt: new Date(cached.timestamp).toISOString()
    };
  }
}

module.exports = ConfigFetcher;

