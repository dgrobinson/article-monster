// FiveFilters configuration fetcher
// Reads site configs from local git submodule

const fs = require('fs').promises;
const path = require('path');

class ConfigFetcher {
  constructor() {
    this.configCache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.configDir = path.join(__dirname, '../site-configs');
    this.loadBuiltInConfigs();
  }

  // Built-in configs as fallback for deployment issues
  loadBuiltInConfigs() {
    // Pre-load critical site configs directly
    this.configCache.set('theatlantic.com', {
      config: {
        title: ["//meta[@property='og:title']/@content"],
        body: [
          "//article[@id='main-article']",
          "//div[@id='main-article']",
          "//article[contains(@class, 'ArticleLayout_article')]",
          "//div[@itemprop='articleBody']",
          "//div[@class='articleText']",
          "//div[@class='articleContent']",
          "//div[@id='article']"
        ],
        author: [
          "//meta[@name=\"author\"]/@content",
          "//div[@id='profile']//*[@class='authors']//a[1]",
          "//*[@class='author']/span"
        ],
        strip: [
          "//*[contains(@class, 'share-social') or contains(@id, 'share-social')]",
          "//header",
          "//gpt-ad",
          "//div[contains(@class, 'ArticleBio_social')]",
          "//*[contains(@class, 'ArticleRecirc')]",
          "//*[contains(@class, 'ArticleRelatedContentModule')]",
          "//aside[contains(@class, 'Pullquote')]",
          "//div[@class='moreOnBoxWithImages']",
          "//aside[@role=\"complementary\"]"
        ],
        date: ["//*[contains(@class, 'date')]"]
      },
      timestamp: Date.now()
    });

    this.configCache.set('nytimes.com', {
      config: {
        title: ["//meta[@property='og:title']/@content"],
        body: [
          "//section[@name='articleBody']",
          "//div[@class='StoryBodyCompanionColumn']",
          "//div[contains(@class, 'ArticleBody')]"
        ],
        author: ["//meta[@name='author']/@content"],
        strip: [
          "//aside",
          "//*[contains(@class, 'ad')]",
          "//*[contains(@class, 'newsletter')]"
        ]
      },
      timestamp: Date.now()
    });

    console.log('Built-in configs loaded for deployment');
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
      // Read from local submodule
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
      date: []
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
      }
    }

    // Only return if we have at least title and body rules
    return (config.title.length > 0 && config.body.length > 0) ? config : null;
  }

  // Preload configs for high-priority sites
  async preloadConfigs() {
    const prioritySites = [
      'theatlantic.com',
      'newyorker.com', 
      'substack.com',
      'ft.com',
      'wsj.com',
      'nytimes.com',
      'washingtonpost.com',
      'reuters.com',
      'bbc.com',
      'cnn.com'
    ];

    const promises = prioritySites.map(site => 
      this.getConfigForSite(site).catch(e => console.log(`Preload failed for ${site}`))
    );

    await Promise.allSettled(promises);
    console.log('Site config preloading completed');
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