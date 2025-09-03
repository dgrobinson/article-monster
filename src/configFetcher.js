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

    // Build list of candidate config files to try
    // Try exact hostname first, then wildcard matches like .example.com.txt
    const candidates = [cleanHost];
    const parts = cleanHost.split('.');
    for (let i = 1; i < parts.length - 1; i++) {
      candidates.push(`.${parts.slice(i).join('.')}`);
    }

    // Check cache for any candidate before hitting disk
    for (const candidate of candidates) {
      const cached = this.configCache.get(candidate);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        // Re-cache under the original hostname for faster lookup next time
        this.configCache.set(cleanHost, cached);
        return cached.config;
      }
    }

    for (const candidate of candidates) {
      try {
        const configPath = path.join(this.configDir, `${candidate}.txt`);
        const configContent = await fs.readFile(configPath, 'utf8');

        // Parse the FiveFilters config format
        const config = this.parseFtrConfig(configContent);

        const cacheEntry = {
          config: config,
          timestamp: Date.now()
        };

        // Cache under both the candidate (for future subdomains) and the requested host
        this.configCache.set(candidate, cacheEntry);
        this.configCache.set(cleanHost, cacheEntry);

        return config;
      } catch (error) {
        // Continue to next candidate
      }
    }

    console.log(`No FiveFilters config found for ${cleanHost}`);
    return null;
  }

  parseFtrConfig(configText) {
    const lines = configText.split('\n');
    const config = {
      title: [],
      body: [],
      author: [],
      strip: [],
      date: [],
      preferJsonLd: false,
      // PHP-matching directive arrays
      find_string: [],
      replace_string: [],
      strip_id_or_class: [],
      strip_image_src: [],
      single_page_link: [],
      next_page_link: [],
      test_url: [],
      // PHP-matching boolean/string directives
      prune: null,
      tidy: null,
      autodetect_on_failure: null,
      parser: null
    };

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines (PHP: $line == '' || $line[0] == '#')
      if (!trimmed || trimmed[0] === '#') continue;

      // Split command and value (PHP: explode(':', $line, 2))
      // Only split on the FIRST colon to preserve XPath expressions like "article:author"
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const command = trimmed.substring(0, colonIndex).trim();
      const val = trimmed.substring(colonIndex + 1).trim();

      if (!command || !val) continue;

      // Multi-statement commands (PHP: in_array check for arrays)
      if (['title', 'body', 'author', 'date', 'strip', 'strip_id_or_class', 'strip_image_src',
        'single_page_link', 'next_page_link', 'test_url', 'find_string', 'replace_string'].includes(command)) {
        config[command].push(val);
      }
      // Boolean commands (PHP: $config->$command = ($val == 'yes' || $val == 'true'))
      else if (['tidy', 'prune', 'autodetect_on_failure'].includes(command)) {
        config[command] = (val === 'yes' || val === 'true');
      }
      // String commands
      else if (['parser'].includes(command)) {
        config[command] = val;
      }
      // Parameterized commands: replace_string(find_text): replace_text
      else if (command.endsWith(')')) {
        const match = command.match(/^([a-z0-9_]+)\((.*?)\)$/i);
        if (match && match[1] === 'replace_string') {
          config.find_string.push(match[2]);
          config.replace_string.push(val);
        }
      }
      // Legacy preference
      else if (command === 'prefer_jsonld') {
        config.preferJsonLd = (val === 'true' || val === '1');
      }
    }

    // Convert find_string/replace_string pairs to preprocessing format for bookmarklet
    const htmlPreprocessing = [];
    for (let i = 0; i < Math.min(config.find_string.length, config.replace_string.length); i++) {
      htmlPreprocessing.push({
        find: config.find_string[i],
        replace: config.replace_string[i]
      });
    }
    config.htmlPreprocessing = htmlPreprocessing;

    // Only require body rules; title extraction can fall back to defaults
    return config.body.length > 0 ? config : null;
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

