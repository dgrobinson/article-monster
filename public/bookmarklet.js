// Article Bookmarklet - Browser-side extraction
(function() {
  'use strict';
  
  // Configuration - replace with your actual service URL
  const SERVICE_URL = 'https://your-service.digitalocean.app/process-article';
  
  // Check if we're already processing to avoid double-clicks
  if (window.articleBookmarkletProcessing) {
    alert('Already processing this article...');
    return;
  }
  
  window.articleBookmarkletProcessing = true;
  
  // Simplified Readability implementation (must be defined before use)
  function Readability(doc, options) {
    this._doc = doc;
    this._options = options || {};
  }

  Readability.prototype = {
    parse: function() {
      try {
        // First try site-specific configuration
        var siteConfig = this._extractWithSiteConfig();
        if (siteConfig) {
          return siteConfig;
        }
        
        // Then try JSON-LD structured data (New Yorker, Atlantic, etc.)
        var jsonLdContent = this._extractFromJsonLd();
        if (jsonLdContent) {
          return jsonLdContent;
        }
        
        // Try Substack data format 
        var substackContent = this._extractFromSubstack();
        if (substackContent) {
          return substackContent;
        }
        
        // Fall back to DOM-based extraction
        var documentClone = this._doc.cloneNode(true);
        var article = this._grabArticle(documentClone);
        
        if (!article) return null;

        return {
          title: this._getArticleTitle(),
          content: article.innerHTML,
          textContent: article.textContent || article.innerText || '',
          length: (article.textContent || article.innerText || '').length,
          excerpt: this._getExcerpt(article),
          byline: this._getArticleMetadata('author') || this._getArticleMetadata('byline'),
          siteName: this._getArticleMetadata('site_name') || document.title,
          publishedTime: this._getArticleMetadata('published_time') || this._getArticleMetadata('date')
        };
      } catch (e) {
        console.error('Readability parsing failed:', e);
        return null;
      }
    },

    _getArticleTitle: function() {
      var title = this._doc.title || '';
      var h1 = this._doc.querySelector('h1');
      if (h1 && h1.textContent.length > title.length * 0.5) {
        title = h1.textContent;
      }
      return title.trim();
    },

    _getExcerpt: function(article) {
      var text = article.textContent || article.innerText || '';
      return text.substring(0, 300).trim() + (text.length > 300 ? '...' : '');
    },

    _getArticleMetadata: function(property) {
      var meta = this._doc.querySelector('meta[property="article:' + property + '"], meta[name="' + property + '"], meta[property="og:' + property + '"]');
      return meta ? meta.getAttribute('content') : null;
    },

    _grabArticle: function(doc) {
      // Remove unwanted elements (more aggressive)
      this._removeNodes(doc, 'script, style, noscript, iframe, object, embed, nav, header, footer, aside');
      
      // Remove common ad and social elements
      this._removeNodes(doc, '[class*="ad"], [id*="ad"], [class*="social"], [class*="share"], [class*="newsletter"], [class*="subscribe"], [class*="popup"], [class*="modal"], [class*="overlay"]');
      
      // Remove elements with ad-like text content
      this._removeAdContent(doc);
      
      // Try to find the main content
      var candidates = this._getCandidates(doc);
      var topCandidate = this._getTopCandidate(candidates);
      
      if (topCandidate) {
        // Clean the selected content further
        this._cleanContent(topCandidate);
        return topCandidate;
      }

      // Fallback: try common selectors
      var selectors = ['article', '.post', '.entry', '.content', '#content', 'main', '.main'];
      for (var i = 0; i < selectors.length; i++) {
        var element = doc.querySelector(selectors[i]);
        if (element && element.textContent.length > 500) {
          this._cleanContent(element);
          return element;
        }
      }

      // Last resort: return body (but clean it)
      this._cleanContent(doc.body);
      return doc.body;
    },

    _removeNodes: function(doc, selector) {
      var nodes = doc.querySelectorAll(selector);
      for (var i = nodes.length - 1; i >= 0; i--) {
        nodes[i].remove();
      }
    },

    _getCandidates: function(doc) {
      var candidates = [];
      var paragraphs = doc.querySelectorAll('p');
      
      for (var i = 0; i < paragraphs.length; i++) {
        var p = paragraphs[i];
        var parent = p.parentNode;
        if (!parent || parent.tagName === 'BLOCKQUOTE') continue;
        
        var score = this._getContentScore(p);
        if (score > 0) {
          candidates.push({ element: parent, score: score });
        }
      }
      
      return candidates;
    },

    _getContentScore: function(element) {
      var text = element.textContent || element.innerText || '';
      if (text.length < 50) return 0;
      
      var score = text.length / 100;
      
      // Bonus for paragraph tags
      if (element.tagName === 'P') score += 1;
      
      // Penalty for unlikely classes/ids
      var className = element.className || '';
      var id = element.id || '';
      if (/(comment|meta|footer|sidebar)/i.test(className + ' ' + id)) {
        score -= 5;
      }
      
      return score;
    },

    _getTopCandidate: function(candidates) {
      if (candidates.length === 0) return null;
      
      candidates.sort(function(a, b) { return b.score - a.score; });
      return candidates[0].element;
    },

    _removeAdContent: function(doc) {
      // Remove elements with ad-like text patterns
      var allElements = doc.querySelectorAll('*');
      for (var i = allElements.length - 1; i >= 0; i--) {
        var element = allElements[i];
        var text = element.textContent || '';
        var className = element.className || '';
        var id = element.id || '';
        
        // Remove if contains ad-like text or attributes
        if (/advertisement|sponsored|promo|banner|popup/i.test(text + ' ' + className + ' ' + id)) {
          if (text.length < 200) { // Only remove short ad-like content
            element.remove();
          }
        }
      }
    },

    _cleanContent: function(element) {
      if (!element) return;
      
      // Remove remaining unwanted elements within the content
      var unwantedSelectors = [
        '.advertisement', '.ad', '.ads', '.sponsored', '.promo',
        '.social-share', '.share-buttons', '.newsletter', '.subscribe',
        '.popup', '.modal', '.overlay', '.sidebar', '.related-articles',
        '[data-ad]', '[data-advertisement]'
      ];
      
      for (var i = 0; i < unwantedSelectors.length; i++) {
        var unwanted = element.querySelectorAll(unwantedSelectors[i]);
        for (var j = unwanted.length - 1; j >= 0; j--) {
          unwanted[j].remove();
        }
      }
    },

    _extractFromJsonLd: function() {
      try {
        var jsonLdScripts = this._doc.querySelectorAll('script[type="application/ld+json"]');
        
        for (var i = 0; i < jsonLdScripts.length; i++) {
          var script = jsonLdScripts[i];
          var jsonData = JSON.parse(script.textContent || script.innerText);
          
          // Handle both single objects and arrays
          var articles = Array.isArray(jsonData) ? jsonData : [jsonData];
          
          for (var j = 0; j < articles.length; j++) {
            var data = articles[j];
            
            // Look for NewsArticle or Article types
            if (data['@type'] === 'NewsArticle' || data['@type'] === 'Article') {
              if (data.articleBody && data.articleBody.length > 500) {
                // Convert plain text to basic HTML with paragraphs
                var htmlContent = this._textToHtml(data.articleBody);
                
                return {
                  title: data.headline || data.name || this._getArticleTitle(),
                  content: htmlContent,
                  textContent: data.articleBody,
                  length: data.articleBody.length,
                  excerpt: data.description || this._createExcerpt(data.articleBody),
                  byline: this._extractAuthor(data.author) || this._getArticleMetadata('author'),
                  siteName: data.publisher && data.publisher.name || this._getArticleMetadata('site_name') || document.title,
                  publishedTime: data.datePublished || this._getArticleMetadata('published_time'),
                  source: 'json-ld'
                };
              }
            }
          }
        }
        
        return null;
      } catch (e) {
        console.error('JSON-LD extraction failed:', e);
        return null;
      }
    },

    _textToHtml: function(text) {
      // Convert plain text to basic HTML with paragraph breaks
      return '<div>' + text
        .split(/\n\s*\n/)  // Split on double line breaks
        .map(function(paragraph) {
          return '<p>' + paragraph.replace(/\n/g, ' ').trim() + '</p>';
        })
        .join('') + '</div>';
    },

    _extractAuthor: function(authorData) {
      if (!authorData) return null;
      
      if (typeof authorData === 'string') return authorData;
      
      if (Array.isArray(authorData)) {
        return authorData.map(function(author) {
          return author.name || author;
        }).join(', ');
      }
      
      return authorData.name || null;
    },

    _createExcerpt: function(text) {
      if (!text) return '';
      return text.substring(0, 300).trim() + (text.length > 300 ? '...' : '');
    },

    _extractFromSubstack: function() {
      try {
        // Look for Substack's window._preloads object
        if (!window._preloads) return null;
        
        var preloads = typeof window._preloads === 'string' ? JSON.parse(window._preloads) : window._preloads;
        
        // Navigate through the data structure to find post content
        if (preloads.feedData && preloads.feedData.readingQueue && preloads.feedData.readingQueue.posts) {
          var posts = preloads.feedData.readingQueue.posts;
          
          // Find the current post by checking URL slug or ID
          var currentSlug = this._getCurrentSlug();
          
          for (var i = 0; i < posts.length; i++) {
            var post = posts[i];
            
            // Match by slug or if it's the only/first post
            if (posts.length === 1 || (post.slug && currentSlug && currentSlug.includes(post.slug))) {
              if (post.body_html && post.body_html.length > 500) {
                var author = '';
                if (post.publishedBylines && post.publishedBylines.length > 0) {
                  author = post.publishedBylines.map(function(byline) {
                    return byline.name;
                  }).join(', ');
                }
                
                return {
                  title: post.title || this._getArticleTitle(),
                  content: post.body_html,
                  textContent: this._htmlToText(post.body_html),
                  length: post.wordcount || this._htmlToText(post.body_html).length,
                  excerpt: post.description || this._createExcerpt(this._htmlToText(post.body_html)),
                  byline: author || this._getArticleMetadata('author'),
                  siteName: 'Substack',
                  publishedTime: post.post_date || this._getArticleMetadata('published_time'),
                  source: 'substack-preloads'
                };
              }
            }
          }
        }
        
        return null;
      } catch (e) {
        console.error('Substack extraction failed:', e);
        return null;
      }
    },

    _getCurrentSlug: function() {
      try {
        var pathname = window.location.pathname;
        var parts = pathname.split('/');
        return parts[parts.length - 1] || parts[parts.length - 2];
      } catch (e) {
        return '';
      }
    },

    _htmlToText: function(html) {
      try {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
      } catch (e) {
        return html.replace(/<[^>]*>/g, '');
      }
    },

    _extractWithSiteConfig: function() {
      try {
        var hostname = window.location.hostname.replace(/^www\./, '');
        var config = this._getSiteConfig(hostname);
        if (!config) {
          // Try to fetch dynamic config from server (non-blocking)
          this._fetchDynamicConfig(hostname);
          return null;
        }

        // If site prefers JSON-LD, let that handler take over
        if (config.preferJsonLd) return null;

        var result = {
          source: 'site-config',
          hostname: hostname
        };

        // Extract title
        if (config.title) {
          for (var i = 0; i < config.title.length; i++) {
            var element = this._evaluateXPath(config.title[i]);
            if (element) {
              result.title = config.title[i].endsWith('/@content') ? 
                element.value : element.textContent;
              if (result.title) {
                result.title = result.title.trim();
                break;
              }
            }
          }
        }

        // Extract body
        if (config.body) {
          for (var i = 0; i < config.body.length; i++) {
            var element = this._evaluateXPath(config.body[i]);
            if (element && element.textContent && element.textContent.length > 500) {
              // Clone and clean the element
              var cleanElement = this._cleanElementWithConfig(element, config.strip || []);
              result.content = cleanElement.innerHTML;
              result.textContent = cleanElement.textContent || cleanElement.innerText || '';
              result.length = result.textContent.length;
              break;
            }
          }
        }

        // Extract author
        if (config.author) {
          for (var i = 0; i < config.author.length; i++) {
            var element = this._evaluateXPath(config.author[i]);
            if (element) {
              result.byline = config.author[i].endsWith('/@content') ? 
                element.value : element.textContent;
              if (result.byline) {
                result.byline = result.byline.trim();
                break;
              }
            }
          }
        }

        // Add other metadata
        result.excerpt = this._createExcerpt(result.textContent);
        result.siteName = hostname;
        result.publishedTime = this._getArticleMetadata('published_time') || this._getArticleMetadata('date');

        // Only return if we successfully extracted content
        return result.content ? result : null;

      } catch (e) {
        console.error('Site config extraction failed:', e);
        return null;
      }
    },

    _evaluateXPath: function(xpath, contextNode) {
      try {
        contextNode = contextNode || this._doc;
        var result = this._doc.evaluate(
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
    },

    _cleanElementWithConfig: function(element, stripXPaths) {
      var clone = element.cloneNode(true);
      
      // Remove elements specified in strip rules
      for (var i = 0; i < stripXPaths.length; i++) {
        var elementsToRemove = this._doc.evaluate(
          stripXPaths[i],
          clone,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );
        
        for (var j = elementsToRemove.snapshotLength - 1; j >= 0; j--) {
          var elementToRemove = elementsToRemove.snapshotItem(j);
          if (elementToRemove && elementToRemove.remove) {
            elementToRemove.remove();
          }
        }
      }

      return clone;
    },

    _getSiteConfig: function(hostname) {
      var configs = {
        'theatlantic.com': {
          title: [
            "//meta[@property='og:title']/@content",
            "//h1[@class='ArticleHeader_headline__B8PsX']",
            "//h1"
          ],
          body: [
            "//article[@id='main-article']",
            "//div[@id='main-article']", 
            "//div[@class='ArticleBody_root__2jqPc']",
            "//div[contains(@class, 'ArticleBody')]//div[@class='markup']",
            "//div[@itemprop='articleBody']",
            "//div[@class='articleText']"
          ],
          author: [
            "//meta[@name='author']/@content",
            "//div[@class='AttributionDetails_author__1uPE-']//a"
          ],
          strip: [
            "//nav",
            "//header[contains(@class, 'SiteHeader')]", 
            "//div[contains(@class, 'Advertisement')]",
            "//div[contains(@class, 'Share')]",
            "//div[contains(@class, 'Newsletter')]"
          ]
        },
        
        'substack.com': {
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
        },

        'newyorker.com': {
          preferJsonLd: true, // New Yorker has full content in JSON-LD
          title: [
            "//meta[@property='og:title']/@content",
            "//h1"
          ],
          body: [
            "//div[@data-testid='ArticleBodyWrapper']",
            "//article//div[@class='GridItem']"
          ],
          author: [
            "//meta[@name='author']/@content",
            "//span[@class='byline-name']//a"
          ]
        }
      };
      
      return configs[hostname];
    },

    _fetchDynamicConfig: function(hostname) {
      // This is asynchronous and will help improve future extractions
      // Not used for current extraction but stored for next time
      try {
        var serviceUrl = SERVICE_URL.replace('/process-article', '');
        fetch(serviceUrl + '/site-config/' + hostname)
          .then(function(response) {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Config not found');
          })
          .then(function(data) {
            if (data.success && data.config) {
              // Store in session storage for potential future use
              try {
                sessionStorage.setItem('siteConfig_' + hostname, JSON.stringify({
                  config: data.config,
                  timestamp: Date.now()
                }));
                console.log('Fetched site config for', hostname, 'from FiveFilters');
              } catch (e) {
                // Session storage not available, ignore
              }
            }
          })
          .catch(function(error) {
            // Silently fail - this is a nice-to-have feature
            console.log('No dynamic config available for', hostname);
          });
      } catch (e) {
        // Ignore any errors in dynamic config fetching
      }
    }
  };
  
  try {
    // Create a simple UI indicator
    const indicator = createIndicator();
    document.body.appendChild(indicator);
    
    // Extract article content using simplified Readability
    const reader = new Readability(document);
    const article = reader.parse();
    
    if (!article) {
      throw new Error('Could not extract article content from this page');
    }
    
    // Enhance article data
    const enhancedArticle = {
      ...article,
      url: window.location.href,
      domain: window.location.hostname,
      extractedAt: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 100)
    };
    
    // Send to service
    updateIndicator(indicator, 'Sending to Kindle and Zotero...');
    
    fetch(SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: window.location.href,
        article: enhancedArticle
      })
    })
    .then(response => response.json())
    .then(data => {
      document.body.removeChild(indicator);
      
      if (data.success) {
        showResult('✅ Article sent successfully!\n\n' + 
                   '📧 Kindle: ' + data.kindle + '\n' +
                   '📚 Zotero: ' + data.zotero + '\n\n' +
                   '📄 "' + article.title + '"');
      } else {
        throw new Error(data.message || 'Service returned an error');
      }
    })
    .catch(error => {
      document.body.removeChild(indicator);
      showResult('❌ Error: ' + error.message + '\n\nPlease try again or check your internet connection.');
    })
    .finally(() => {
      window.articleBookmarkletProcessing = false;
    });
    
  } catch (error) {
    if (document.querySelector('#article-bookmarklet-indicator')) {
      document.body.removeChild(document.querySelector('#article-bookmarklet-indicator'));
    }
    showResult('❌ Extraction failed: ' + error.message);
    window.articleBookmarkletProcessing = false;
  }
  
  function createIndicator() {
    const div = document.createElement('div');
    div.id = 'article-bookmarklet-indicator';
    div.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2c3e50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
      border: 2px solid #3498db;
    `;
    div.innerHTML = '📖 Extracting article...';
    return div;
  }
  
  function updateIndicator(indicator, message) {
    indicator.innerHTML = message;
  }
  
  function showResult(message) {
    // Create a nicer result dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      color: #333;
      padding: 25px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      z-index: 1000000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      max-width: 400px;
      border: 2px solid #3498db;
      white-space: pre-line;
      text-align: center;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      margin-top: 15px;
      padding: 8px 16px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    `;
    closeBtn.onclick = () => document.body.removeChild(dialog);
    
    dialog.innerHTML = message;
    dialog.appendChild(document.createElement('br'));
    dialog.appendChild(closeBtn);
    
    document.body.appendChild(dialog);
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      if (document.body.contains(dialog)) {
        document.body.removeChild(dialog);
      }
    }, 10000);
  }

})();