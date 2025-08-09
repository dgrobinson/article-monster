// Site-specific extraction configurations
// Based on FiveFilters' ftr-site-config approach
// https://github.com/fivefilters/ftr-site-config

class SiteConfigManager {
  constructor() {
    this.configs = new Map();
    this.loadBuiltInConfigs();
  }

  loadBuiltInConfigs() {
    // High-priority sites with custom configurations
    this.configs.set('theatlantic.com', {
      title: [
        "//meta[@property='og:title']/@content",
        "//h1[@class='ArticleHeader_headline__B8PsX']",
        "//h1"
      ],
      body: [
        "//article[@id='main-article']",
        "//div[@id='main-article']", 
        "//div[@class='ArticleBody_root__2jqPc']",
        "//div[@itemprop='articleBody']",
        "//div[@class='articleText']"
      ],
      author: [
        "//meta[@name='author']/@content",
        "//div[@class='AttributionDetails_author__1uPE-']//a"
      ],
      strip: [
        "//nav",
        "//header[@class='SiteHeader_root__1-QhY']", 
        "//div[contains(@class, 'Advertisement')]",
        "//div[contains(@class, 'Share')]",
        "//div[contains(@class, 'Newsletter')]"
      ]
    });

    this.configs.set('substack.com', {
      title: [
        "//meta[@property='og:title']/@content",
        "//h1[@class='post-title']"
      ],
      body: [
        "//div[@class='available-content']",
        "//div[@class='body markup']//div[1]"
      ],
      author: [
        "//meta[@name='author']/@content",
        "//a[@class='publication-logo']"
      ],
      strip: [
        "//div[contains(@class, 'subscription')]",
        "//div[contains(@class, 'paywall')]",
        "//button",
        "//svg"
      ]
    });

    this.configs.set('newyorker.com', {
      title: [
        "//meta[@property='og:title']/@content",
        "//h1"
      ],
      // New Yorker has full content in JSON-LD, prefer that
      preferJsonLd: true,
      body: [
        "//div[@data-testid='ArticleBodyWrapper']",
        "//article//div[@class='GridItem']"
      ],
      author: [
        "//meta[@name='author']/@content",
        "//span[@class='byline-name']//a"
      ]
    });
  }

  getConfig(hostname) {
    // Remove www. prefix
    const cleanHost = hostname.replace(/^www\./, '');
    return this.configs.get(cleanHost);
  }

  // XPath evaluation helper for browser context
  evaluateXPath(xpath, contextNode = document) {
    try {
      const result = document.evaluate(
        xpath, 
        contextNode, 
        null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, 
        null
      );
      return result.singleNodeValue;
    } catch (e) {
      console.warn('XPath evaluation failed:', xpath, e);
      return null;
    }
  }

  // Extract content using site-specific config
  extractWithConfig(hostname) {
    const config = this.getConfig(hostname);
    if (!config) return null;

    // If site prefers JSON-LD, return null to let JSON-LD handler take over
    if (config.preferJsonLd) return null;

    const result = {
      source: 'site-config',
      hostname: hostname
    };

    // Extract title
    if (config.title) {
      for (const xpath of config.title) {
        const element = this.evaluateXPath(xpath);
        if (element) {
          result.title = xpath.endsWith('/@content') ? 
            element.value : element.textContent?.trim();
          if (result.title) break;
        }
      }
    }

    // Extract body
    if (config.body) {
      for (const xpath of config.body) {
        const element = this.evaluateXPath(xpath);
        if (element && element.textContent?.length > 500) {
          // Clone and clean the element
          const cleanElement = this.cleanElement(element, config.strip || []);
          result.content = cleanElement.innerHTML;
          result.textContent = cleanElement.textContent || '';
          result.length = result.textContent.length;
          break;
        }
      }
    }

    // Extract author
    if (config.author) {
      for (const xpath of config.author) {
        const element = this.evaluateXPath(xpath);
        if (element) {
          result.byline = xpath.endsWith('/@content') ? 
            element.value : element.textContent?.trim();
          if (result.byline) break;
        }
      }
    }

    // Only return if we successfully extracted content
    return result.content ? result : null;
  }

  cleanElement(element, stripXPaths) {
    const clone = element.cloneNode(true);
    
    // Remove elements specified in strip rules
    for (const stripXPath of stripXPaths) {
      const elementsToRemove = document.evaluate(
        stripXPath,
        clone,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      
      for (let i = elementsToRemove.snapshotLength - 1; i >= 0; i--) {
        const elementToRemove = elementsToRemove.snapshotItem(i);
        elementToRemove?.remove();
      }
    }

    return clone;
  }
}

// Export for use in bookmarklet
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SiteConfigManager;
} else {
  window.SiteConfigManager = SiteConfigManager;
}