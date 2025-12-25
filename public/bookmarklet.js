// Article Bookmarklet - Browser-side extraction
(function() {
  'use strict';

  // Client-side debug capture (console + errors)
  var __bmLog = [];
  function logDebug(category, message, details) {
    try {
      __bmLog.push({ t: Date.now(), category: category, message: String(message), details: details || null });
    } catch {}
    try {
      console.log('[bm:' + category + ']', message, details || '');
    } catch {}
  }

  // Proxy console methods into __bmLog while preserving original behavior
  (function() {
    var __orig = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    ['log', 'info', 'warn', 'error', 'debug'].forEach(function(level) {
      var orig = __orig[level] || function() {};
      console[level] = function() {
        var args = Array.prototype.slice.call(arguments);
        try {
          var safeArgs = args.map(function(a) {
            try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); }
          }).slice(0, 10);
          __bmLog.push({ t: Date.now(), level: level, args: safeArgs });
        } catch {}
        return orig.apply(console, args);
      };
    });
    window.addEventListener('error', function(e) {
      try { __bmLog.push({ t: Date.now(), level: 'error', message: e.message, source: e.filename, line: e.lineno, col: e.colno }); } catch {}
    });
    window.addEventListener('unhandledrejection', function(e) {
      try {
        var reason = e.reason;
        var msg = reason && (reason.message || String(reason));
        __bmLog.push({ t: Date.now(), level: 'error', message: msg || 'unhandledrejection' });
      } catch {}
    });
  })();

  function summarizeContentStats(html, textOverride) {
    var safeHtml = typeof html === 'string' ? html : '';
    var text = (typeof textOverride === 'string' && textOverride.trim().length > 0)
      ? textOverride
      : safeHtml.replace(/<[^>]*>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    var tailLength = 240;
    var tail = text.slice(Math.max(0, text.length - tailLength));
    return {
      htmlLength: safeHtml.length,
      textLength: text.length,
      paragraphCount: (safeHtml.match(/<p[^>]*>/gi) || []).length,
      lineBreakCount: (safeHtml.match(/<br[^>]*>/gi) || []).length,
      newlineCount: (safeHtml.match(/\n/g) || []).length,
      tailPreview: tail
    };
  }

  function logContentStats(stage, html, textOverride, extra) {
    try {
      var stats = summarizeContentStats(html, textOverride);
      stats.stage = stage;
      if (extra && typeof extra === 'object') {
        for (var key in extra) {
          if (Object.prototype.hasOwnProperty.call(extra, key)) {
            stats[key] = extra[key];
          }
        }
      }
      logDebug('content', 'content-stats', stats);
    } catch {}
  }

  function getBlockedWebApp(hostname) {
    var normalized = (hostname || '').toLowerCase();
    if (!normalized) return null;
    if (normalized === 'docs.google.com' || normalized === 'drive.google.com') {
      return 'Google Docs or Drive';
    }
    if (normalized === 'notion.so' || normalized.endsWith('.notion.so')) {
      return 'Notion';
    }
    if (normalized === 'app.slack.com' || normalized.endsWith('.slack.com')) {
      return 'Slack';
    }
    if (normalized === 'myworkday.com' || normalized.endsWith('.myworkday.com')) {
      return 'Workday';
    }
    return null;
  }

  // Configuration - replace with your actual service URL
  const SERVICE_URL = (window.__BOOKMARKLET_SERVICE_URL__ || 'https://seal-app-t4vff.ondigitalocean.app/process-article');
  var MAX_PAGINATION_PAGES = 5;
  var PAGINATION_SEPARATOR_HTML = '<hr data-page-break="true" />';

  // Check if we're already processing to avoid double-clicks
  var isTestMode = !!window.__BOOKMARKLET_TEST__;
  if (!isTestMode) {
    if (window.articleBookmarkletProcessing) {
      alert('Already processing this article...');
      return;
    }

    window.articleBookmarkletProcessing = true;

    var blockedApp = getBlockedWebApp(window.location.hostname);
    if (blockedApp) {
      logDebug('guard', 'Blocked authenticated web app extraction', {
        hostname: window.location.hostname,
        app: blockedApp
      });
      showResult('Blocked for safety.\n\nThis looks like a private web app (' + blockedApp + '). Article Monster does not extract from authenticated web apps to avoid sending private data to the server.\n\nIf this is a public article, open the public URL and try again.');
      window.articleBookmarkletProcessing = false;
      return;
    }
  }

  // Simplified Readability implementation (must be defined before use)
  function Readability(doc, options) {
    this._doc = doc;
    this._options = options || {};
  }

  Readability.prototype = {
    parse: function() {
      try {
        this._skipJsonLd = false;
        // First try site-specific configuration
        var siteConfig = this._extractWithSiteConfig();
        if (siteConfig) {
          siteConfig.extractionMethod = 'site-config';
          siteConfig.configSource = window.location.hostname.replace(/^www\./, '');
          console.log('Extraction successful using FiveFilters config for:', siteConfig.configSource);
          return siteConfig;
        }

        // Then try JSON-LD structured data if available
        if (!this._skipJsonLd) {
          var jsonLdContent = this._extractFromJsonLd();
          if (jsonLdContent) {
            jsonLdContent.extractionMethod = 'json-ld';
            console.log('Extraction successful using JSON-LD structured data');
            return jsonLdContent;
          }
        } else {
          console.log('Skipping JSON-LD extraction due to site config directive');
        }

        // (No site-specific fallback here; follow ADR to avoid hardcoding)

        console.log('No site config or JSON-LD found, falling back to DOM extraction');
        // Fall back to DOM-based extraction
        var documentClone = this._doc.cloneNode(true);
        var article = this._grabArticle(documentClone);

        if (!article) return null;

        // Fix image URLs and detect images before processing
        var processedContent = this._fixImageUrls(article.innerHTML);
        var hasImages = this._detectImages(processedContent);

        // If no images detected in content, check the whole page as fallback
        if (!hasImages) {
          var pageImages = document.querySelectorAll('article img, main img, .content img, figure img');
          hasImages = pageImages.length > 0;
          console.log('Fallback image check found', pageImages.length, 'images on page');
        }

        var sectionedContent = this._addContentSections(processedContent);

        return {
          title: this._getArticleTitle(),
          content: sectionedContent,
          textContent: article.textContent || article.innerText || '',
          length: (article.textContent || article.innerText || '').length,
          excerpt: this._getExcerpt(article),
          byline: this._getArticleMetadata('author') || this._getArticleMetadata('byline'),
          siteName: this._getArticleMetadata('site_name') || document.title,
          publishedTime: this._getArticleMetadata('published_time') || this._getArticleMetadata('date'),
          hasImages: hasImages,
          lang: this._doc.documentElement.lang || 'en',
          extractionMethod: 'dom-fallback'
        };
      } catch (e) {
        console.error('Readability parsing failed:', e);
        return null;
      }
    },

    _getArticleTitle: function() {
      console.log('_getArticleTitle called - document.title:', this._doc.title);
      var title = this._doc.title || '';
      var h1 = this._doc.querySelector('h1');
      console.log('_getArticleTitle - h1 found:', h1 ? h1.textContent.substring(0, 100) : 'none');
      if (h1 && h1.textContent.length > title.length * 0.5) {
        title = h1.textContent;
        console.log('_getArticleTitle - using h1 title:', title.substring(0, 100));
      } else {
        console.log('_getArticleTitle - using document title:', title);
      }
      var result = title.trim();
      console.log('_getArticleTitle final result:', result.substring(0, 100));
      return result;
    },

    _getExcerpt: function(article) {
      var text = article.textContent || article.innerText || '';
      return text.substring(0, 300).trim() + (text.length > 300 ? '...' : '');
    },

    _getArticleMetadata: function(property) {
      // Enhanced metadata extraction with more fallbacks
      var selectors = [
        'meta[property="article:' + property + '"]',
        'meta[property="og:article:' + property + '"]',
        'meta[property="og:' + property + '"]',
        'meta[name="' + property + '"]',
        'meta[name="article:' + property + '"]',
        'meta[itemprop="' + property + '"]',
        'meta[name="twitter:' + property + '"]',
        'meta[name="dc.' + property + '"]', // Dublin Core
        'meta[name="DC.' + property + '"]'
      ];

      for (var i = 0; i < selectors.length; i++) {
        var meta = this._doc.querySelector(selectors[i]);
        if (meta) {
          var content = meta.getAttribute('content') || meta.getAttribute('value');
          if (content && content.trim()) {
            return content.trim();
          }
        }
      }

      // Additional fallbacks for specific properties
      if (property === 'author' || property === 'byline') {
        return this._extractAuthorFromDOM();
      }

      if (property === 'published_time' || property === 'date') {
        return this._extractDateFromDOM();
      }

      return null;
    },

    _extractAuthorFromDOM: function() {
      // Try to find author in common DOM locations
      var authorSelectors = [
        '[rel="author"]',
        '[class*="author-name"]',
        '[class*="byline"]',
        '[class*="by-line"]',
        '[class*="writer"]',
        '[itemprop="author"]',
        '.author',
        '.byline',
        '.by',
        'address'
      ];

      for (var i = 0; i < authorSelectors.length; i++) {
        var element = this._doc.querySelector(authorSelectors[i]);
        if (element) {
          var text = element.textContent.trim();
          // Clean up common author prefixes
          text = text.replace(/^by\s+/i, '').replace(/^written\s+by\s+/i, '');
          if (text && text.length > 2 && text.length < 100) {
            return text;
          }
        }
      }
      return null;
    },

    _extractDateFromDOM: function() {
      // Try to find publication date in common DOM locations
      var dateSelectors = [
        'time[datetime]',
        'time[pubdate]',
        '[itemprop="datePublished"]',
        '[class*="publish-date"]',
        '[class*="published-date"]',
        '[class*="post-date"]',
        '[class*="entry-date"]',
        '.date',
        '.published',
        '.timestamp'
      ];

      for (var i = 0; i < dateSelectors.length; i++) {
        var element = this._doc.querySelector(dateSelectors[i]);
        if (element) {
          var dateStr = element.getAttribute('datetime') ||
                       element.getAttribute('content') ||
                       element.textContent.trim();
          if (dateStr) {
            try {
              var date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                return date.toISOString();
              }
            } catch {
              // Continue to next selector
            }
          }
        }
      }
      return null;
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
          var raw = script.textContent || script.innerText;
          if (!raw) continue;
          var jsonData;
          try {
            jsonData = JSON.parse(raw);
          } catch (parseError) {
            console.warn('Skipping malformed JSON-LD script:', parseError.message);
            continue;
          }

          // Handle single objects, arrays, @graph collections, and WebPage.mainEntity
          var articles = [];
          if (Array.isArray(jsonData)) {
            articles = jsonData;
          } else if (jsonData && typeof jsonData === 'object') {
            articles = [jsonData];
            if (Array.isArray(jsonData['@graph'])) {
              articles = articles.concat(jsonData['@graph']);
            }
          }

          for (var j = 0; j < articles.length; j++) {
            var data = articles[j];

            // If this is a WebPage pointing at mainEntity, use that
            if (data && data['@type'] === 'WebPage' && data.mainEntity && typeof data.mainEntity === 'object') {
              data = data.mainEntity;
            }

            // Look for NewsArticle or Article types
            if (data['@type'] === 'NewsArticle' || data['@type'] === 'Article' || data['@type'] === 'BlogPosting') {
              var textContent = typeof data.articleBody === 'string' ? data.articleBody.trim() : '';
              var htmlInfo = null;

              if (textContent && textContent.length > 500) {
                htmlInfo = this._buildJsonLdHtmlFromText(textContent);
              }

              if (!htmlInfo) {
                continue;
              }

              // Process content for images and sections
              var processedContent = this._fixImageUrls(htmlInfo.html);
              var sectionedContent = this._addContentSections(processedContent);

              return {
                title: data.headline || data.name || this._getArticleTitle(),
                content: sectionedContent,
                textContent: textContent,
                length: textContent.length,
                excerpt: data.description || this._createExcerpt(textContent),
                byline: this._extractAuthor(data.author) || this._getArticleMetadata('author'),
                siteName: data.publisher && data.publisher.name || this._getArticleMetadata('site_name') || document.title,
                publishedTime: data.datePublished || this._getArticleMetadata('published_time'),
                hasImages: htmlInfo.hasImages || /<img\b/i.test(sectionedContent),
                lang: this._doc.documentElement.lang || 'en',
                source: 'json-ld'
              };
            }
          }
        }

        return null;
      } catch (e) {
        console.error('JSON-LD extraction failed:', e);
        return null;
      }
    },

    _buildJsonLdHtmlFromText: function(text) {
      var htmlContent = this._textToHtml(text);
      var doc = this._doc;
      var pageImages = doc.querySelectorAll('article img, main img, .article-content img, [role="main"] img');
      var hasImages = pageImages.length > 0;

      if (hasImages) {
        console.log('Found', pageImages.length, 'images in page, attempting to include them');
        var articleElement = doc.querySelector('article, main, .article-content, [role="main"]');
        if (articleElement) {
          var imgElements = articleElement.querySelectorAll('img');
          var imageHtml = '';
          imgElements.forEach(function(img) {
            if (img.src) {
              imageHtml += '<figure><img src="' + img.src + '" alt="' + (img.alt || '') + '" /></figure>';
            }
          });
          if (imageHtml) {
            htmlContent = htmlContent.replace('</div>', imageHtml + '</div>');
          }
        }
      }

      return {
        html: htmlContent,
        hasImages: hasImages
      };
    },

    _textToHtml: function(text) {
      // Convert plain text to basic HTML with paragraph breaks
      // Many JSON-LD sources use single newlines between paragraphs
      // So we'll split on any newline and filter out empty results
      var paragraphs = text.split(/\n+/);  // Split on one or more newlines

      // Filter out empty paragraphs and convert to HTML
      return '<div>' + paragraphs
        .map(function(paragraph) {
          var trimmed = paragraph.trim();
          // Only create paragraph if it has substantial content (not just punctuation)
          return trimmed && trimmed.length > 1 ? '<p>' + trimmed + '</p>' : '';
        })
        .filter(Boolean)
        .join('\n') + '</div>';
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

    // REMOVED - Custom site-specific extraction violates zero-hardcoding principle
    // Site config files handle all domain tweaks via FiveFilters format

    _htmlToText: function(html) {
      try {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
      } catch {
        return html.replace(/<[^>]*>/g, '');
      }
    },

    _extractWithSiteConfig: function(configOverride, options) {
      console.log('_extractWithSiteConfig called for hostname:', window.location.hostname);
      logDebug('site-config', '_extractWithSiteConfig enter', { hostname: window.location.hostname.replace(/^www\./, '') });
      try {
        options = options || {};
        var hostname = window.location.hostname.replace(/^www\./, '');
        var config = configOverride;

        // First check cache
        if (!config) {
          config = this._getCachedConfig(hostname);
        }

        if (!config) {
          // Try to fetch config synchronously for immediate use
          console.log('No cached config for', hostname, '- fetching synchronously');
          config = this._fetchSyncConfig(hostname);
          if (!config) {
            console.log('No FiveFilters config available for', hostname);
            return null;
          }
        }

        if (!config) {
          return null;
        }

        if (config.skip_json_ld === true) {
          this._skipJsonLd = true;
        }

        if (config.if_page_contains && config.if_page_contains.length > 0) {
          var pageMatches = false;
          for (var p = 0; p < config.if_page_contains.length; p++) {
            if (this._pageContains(config.if_page_contains[p])) {
              pageMatches = true;
              break;
            }
          }
          if (!pageMatches) {
            console.log('if_page_contains did not match for', hostname, '- skipping config');
            return null;
          }
        }

        // Note: HTML preprocessing now handled before Readability parsing

        var nativeAdDetected = false;
        var nativeAdClue = null;
        if (config.native_ad_clue && config.native_ad_clue.length > 0) {
          for (var n = 0; n < config.native_ad_clue.length; n++) {
            if (this._pageContains(config.native_ad_clue[n])) {
              nativeAdDetected = true;
              nativeAdClue = config.native_ad_clue[n];
              break;
            }
          }
        }

        var result = {
          source: 'site-config',
          hostname: hostname
        };
        if (nativeAdDetected) {
          result.nativeAdDetected = true;
          result.nativeAdClue = nativeAdClue;
        }

        // Extract title (matches PHP: if config has title rules, try them first)
        var titleExtracted = false;
        if (config.title && config.title.length > 0) {
          for (var i = 0; i < config.title.length; i++) {
            var element = this._evaluateXPath(config.title[i]);
            if (element) {
              result.title = config.title[i].endsWith('/@content') ?
                element.value : element.textContent;
              if (result.title) {
                result.title = result.title.trim();
                titleExtracted = true;
                break;
              }
            }
          }
        }

        // Auto-detect title if: 1) no title rules OR 2) title extraction failed AND autodetect_on_failure
        // (matches PHP: empty($this->config->title) || $this->config->autodetect_on_failure())
        var shouldAutoDetectTitle = !config.title || config.title.length === 0 ||
          (!titleExtracted && config.autodetect_on_failure !== false);

        if (!titleExtracted && shouldAutoDetectTitle) {
          console.log('Auto-detecting title: no title rules or extraction failed');
          console.log('config.title:', config.title, 'length:', config.title ? config.title.length : 'undefined');
          console.log('titleExtracted:', titleExtracted);
          console.log('autodetect_on_failure:', config.autodetect_on_failure);
          result.title = this._getArticleTitle();
          console.log('Auto-detected title result:', result.title);
        }

        // Check for single page link before extracting body (PHP: makefulltextfeed.php)
        var singlePageUrl = options.skipSinglePageLink ? null : this._findSinglePageLink(config);
        if (!options.skipSinglePageLink && singlePageUrl && singlePageUrl !== window.location.href) {
          // Found a single page link - navigate to full article
          console.log('Found single page link, navigating to full article:', singlePageUrl);
          window.location.href = singlePageUrl;
          return null; // Don't process current page
        }

        // Extract body (matches PHP: no minimum length, handles multiple elements)
        if (config.body) {
          for (var i = 0; i < config.body.length; i++) {
            console.log('Trying body XPath:', config.body[i]);
            var elements = this._evaluateXPathAll(config.body[i]);
            if (elements && elements.length > 0) {
              console.log('Body matched:', elements.length, 'element(s) for XPath:', config.body[i]);

              var bodyElement;
              if (elements.length === 1) {
                // Single element (matches PHP: $this->body = $elems->item(0))
                bodyElement = elements[0];
              } else {
                // Multiple elements - combine them (matches PHP logic)
                bodyElement = this._doc.createElement('div');
                for (var j = 0; j < elements.length; j++) {
                  var clonedNode = elements[j].cloneNode(true);
                  bodyElement.appendChild(clonedNode);
                }
                console.log('Combined', elements.length, 'body elements into single container');
              }

              if (this._matchesSkipIdOrClass(bodyElement, config.skip_id_or_class)) {
                console.log('Body XPath matched but skipped due to skip_id_or_class:', config.body[i]);
                continue;
              }

              // Clone and clean the element with full config
              var cleanElement = this._cleanElementWithConfig(bodyElement, config);

              if (config.insert_detected_image !== false) {
                this._insertDetectedImage(cleanElement);
              }

              result.content = cleanElement.innerHTML;
              result.textContent = cleanElement.textContent || cleanElement.innerText || '';
              result.length = result.textContent.length;
              logContentStats('site-config-body', result.content, result.textContent, {
                xpath: config.body[i],
                elementCount: elements.length
              });

              // Only accept if we have some content (basic sanity check)
              if (result.textContent && result.textContent.trim().length > 0) {
                break;
              } else {
                console.log('Body XPath matched but content empty/too short:', result.textContent ? result.textContent.length : 'null');
              }
            } else {
              console.log('Body XPath found no elements:', config.body[i]);
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

    _cleanElementWithConfig: function(element, config) {
      var clone = element.cloneNode(true);

      // Apply XPath-based strip rules (PHP: strip array)
      if (config.strip && config.strip.length > 0) {
        for (var i = 0; i < config.strip.length; i++) {
          var elementsToRemove = this._doc.evaluate(
            config.strip[i],
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
      }

      // Apply strip_id_or_class rules (PHP: strip_id_or_class array)
      if (config.strip_id_or_class && config.strip_id_or_class.length > 0) {
        for (var i = 0; i < config.strip_id_or_class.length; i++) {
          var selector = config.strip_id_or_class[i];
          // Remove quotes (PHP: strtr($string, array("'"=>'', '"'=>'')))
          selector = selector.replace(/['"]/g, '');

          // Find elements by class or id containing this string
          var elementsToRemove = clone.querySelectorAll(
            '[class*="' + selector + '"], [id*="' + selector + '"]'
          );

          for (var j = elementsToRemove.length - 1; j >= 0; j--) {
            if (elementsToRemove[j] && elementsToRemove[j].remove) {
              elementsToRemove[j].remove();
            }
          }
        }
      }

      // Apply strip_image_src rules (PHP: strip_image_src array)
      if (config.strip_image_src && config.strip_image_src.length > 0) {
        for (var i = 0; i < config.strip_image_src.length; i++) {
          var srcPattern = config.strip_image_src[i];
          // Remove quotes (PHP: strtr($string, array("'"=>'', '"'=>'')))
          srcPattern = srcPattern.replace(/['"]/g, '');

          // Find img elements with src containing this string
          var imagesToRemove = clone.querySelectorAll('img[src*="' + srcPattern + '"]');

          for (var j = imagesToRemove.length - 1; j >= 0; j--) {
            if (imagesToRemove[j] && imagesToRemove[j].remove) {
              imagesToRemove[j].remove();
            }
          }
        }
      }

      // Apply dissolve rules (PHP: dissolve array)
      if (config.dissolve && config.dissolve.length > 0) {
        for (var i = 0; i < config.dissolve.length; i++) {
          this._dissolveByXPath(clone, config.dissolve[i]);
        }
      }

      // Apply strip_comments rules (PHP: strip_comments)
      if (config.strip_comments === true) {
        this._stripCommentsFromElement(clone);
      }

      // Apply src_lazy_load_attr rules (PHP: src_lazy_load_attr)
      if (config.src_lazy_load_attr && config.src_lazy_load_attr.length > 0) {
        this._applyLazyLoadAttrs(clone, config.src_lazy_load_attr);
      }

      // Apply strip_attr rules (PHP: strip_attr array)
      if (config.strip_attr && config.strip_attr.length > 0) {
        for (var i = 0; i < config.strip_attr.length; i++) {
          this._stripAttributesByXPath(clone, config.strip_attr[i]);
        }
      }

      // Apply prune directive (PHP: $this->readability->prepArticle($this->body))
      if (config.prune === true) {
        this._pruneContent(clone);
      }

      // Apply tidy directive (clean up HTML structure)
      if (config.tidy === true) {
        this._tidyContent(clone);
      }

      // Apply convert_double_br_tags directive
      if (config.convert_double_br_tags === true) {
        this._convertDoubleBrTags(clone);
      }

      // Apply post_strip_attr rules (PHP: post_strip_attr array)
      if (config.post_strip_attr && config.post_strip_attr.length > 0) {
        for (var i = 0; i < config.post_strip_attr.length; i++) {
          this._stripAttributesByXPath(clone, config.post_strip_attr[i]);
        }
      }

      return clone;
    },

    _pageContains: function(expression) {
      if (!expression) return false;
      try {
        var result = this._doc.evaluate(
          expression,
          this._doc,
          null,
          XPathResult.ANY_TYPE,
          null
        );

        switch (result.resultType) {
        case XPathResult.STRING_TYPE:
          return !!(result.stringValue && result.stringValue.trim());
        case XPathResult.NUMBER_TYPE:
          return result.numberValue !== 0;
        case XPathResult.BOOLEAN_TYPE:
          return result.booleanValue;
        case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
        case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
          return !!result.iterateNext();
        case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:
        case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
          return result.snapshotLength > 0;
        default:
          return false;
        }
      } catch (e) {
        try {
          var html = this._doc.documentElement ? this._doc.documentElement.outerHTML : '';
          return html.indexOf(expression) !== -1;
        } catch (_) {
          return false;
        }
      }
    },

    _matchesSkipIdOrClass: function(element, skipList) {
      if (!element || !skipList || skipList.length === 0) return false;
      for (var i = 0; i < skipList.length; i++) {
        var selector = skipList[i];
        if (!selector) continue;
        selector = selector.replace(/['"]/g, '').trim();
        if (!selector) continue;

        if (element.id && element.id.indexOf(selector) !== -1) return true;
        if (element.className && String(element.className).indexOf(selector) !== -1) return true;

        var match = element.querySelector('[class*="' + selector + '"], [id*="' + selector + '"]');
        if (match) return true;
      }
      return false;
    },

    _normalizeXPathForContext: function(xpath, contextNode) {
      if (!xpath || !contextNode) return xpath;
      if (contextNode === this._doc || contextNode.nodeType === Node.DOCUMENT_NODE) return xpath;
      if (xpath.indexOf('/') === 0) return '.' + xpath;
      return xpath;
    },

    _stripAttributesByXPath: function(element, xpath) {
      try {
        var normalized = this._normalizeXPathForContext(xpath, element);
        var results = this._doc.evaluate(
          normalized,
          element,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );

        for (var i = results.snapshotLength - 1; i >= 0; i--) {
          var node = results.snapshotItem(i);
          if (!node) continue;
          if (node.nodeType === Node.ATTRIBUTE_NODE) {
            var owner = node.ownerElement || node.ownerNode;
            if (owner && owner.removeAttribute) {
              owner.removeAttribute(node.name);
            }
          }
        }
      } catch (e) {
        console.warn('strip_attr XPath evaluation failed:', xpath, e);
      }
    },

    _stripCommentsFromElement: function(element) {
      try {
        var walker = element.ownerDocument.createTreeWalker(
          element,
          NodeFilter.SHOW_COMMENT,
          null,
          false
        );
        var nodes = [];
        var node;
        while (node = walker.nextNode()) {
          nodes.push(node);
        }
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].parentNode) {
            nodes[i].parentNode.removeChild(nodes[i]);
          }
        }
      } catch (e) {
        console.warn('strip_comments failed:', e);
      }
    },

    _dissolveByXPath: function(element, xpath) {
      try {
        var normalized = this._normalizeXPathForContext(xpath, element);
        var results = this._doc.evaluate(
          normalized,
          element,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null
        );

        for (var i = results.snapshotLength - 1; i >= 0; i--) {
          var node = results.snapshotItem(i);
          if (!node || node.nodeType !== Node.ELEMENT_NODE) continue;
          var parent = node.parentNode;
          if (!parent) continue;
          while (node.firstChild) {
            parent.insertBefore(node.firstChild, node);
          }
          parent.removeChild(node);
        }
      } catch (e) {
        console.warn('dissolve XPath evaluation failed:', xpath, e);
      }
    },

    _applyLazyLoadAttrs: function(element, attrs) {
      if (!element || !attrs) return;
      var attrList = Array.isArray(attrs) ? attrs : [attrs];
      var images = element.querySelectorAll('img');

      for (var i = 0; i < images.length; i++) {
        var img = images[i];
        var src = img.getAttribute('src');
        if (src && src.trim() !== '') continue;

        for (var j = 0; j < attrList.length; j++) {
          var attrName = attrList[j];
          if (!attrName) continue;
          attrName = attrName.replace(/['"]/g, '').trim();
          if (!attrName) continue;
          var value = img.getAttribute(attrName);
          if (value && value.trim()) {
            img.setAttribute('src', value);
            img.removeAttribute(attrName);
            break;
          }
        }
      }
    },

    _convertDoubleBrTags: function(element) {
      if (!element) return;
      if (element.querySelector('p')) return;

      var html = element.innerHTML;
      var normalized = html.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>');

      if (normalized !== html) {
        element.innerHTML = '<p>' + normalized + '</p>';
        var emptyParagraphs = element.querySelectorAll('p:empty');
        for (var i = emptyParagraphs.length - 1; i >= 0; i--) {
          emptyParagraphs[i].remove();
        }
      }
    },

    _insertDetectedImage: function(element) {
      if (!element || element.querySelector('img')) return false;
      var imageUrl = this._findDetectedImage();
      if (!imageUrl) return false;

      var doc = element.ownerDocument || this._doc;
      var figure = doc.createElement('figure');
      var img = doc.createElement('img');
      img.setAttribute('src', imageUrl);
      figure.appendChild(img);

      if (element.firstChild) {
        element.insertBefore(figure, element.firstChild);
      } else {
        element.appendChild(figure);
      }
      return true;
    },

    _findDetectedImage: function() {
      var selectors = [
        'meta[property="og:image"]',
        'meta[property="og:image:url"]',
        'meta[name="twitter:image"]',
        'meta[name="twitter:image:src"]',
        'meta[itemprop="image"]',
        'link[rel="image_src"]'
      ];

      for (var i = 0; i < selectors.length; i++) {
        var meta = this._doc.querySelector(selectors[i]);
        if (!meta) continue;
        var value = meta.getAttribute('content') || meta.getAttribute('href');
        if (value && value.trim()) {
          var resolved = this._makeAbsoluteUrl(value.trim());
          return resolved || value.trim();
        }
      }
      return null;
    },

    // Content pruning (matches PHP Readability::prepArticle)
    _pruneContent: function(element) {
      // Remove service data attributes
      var serviceData = element.querySelectorAll('[data-candidate]');
      for (var i = 0; i < serviceData.length; i++) {
        serviceData[i].removeAttribute('data-candidate');
      }

      // Remove unrelated links and other elements
      var nofollowLinks = element.querySelectorAll('a[rel="nofollow"]');
      for (var i = nofollowLinks.length - 1; i >= 0; i--) {
        if (nofollowLinks[i] && nofollowLinks[i].remove) {
          nofollowLinks[i].remove();
        }
      }

      // Clean out junk from the article content (matches PHP clean() calls)
      var junkSelectors = ['input', 'button', 'nav', 'object', 'iframe', 'canvas'];
      for (var i = 0; i < junkSelectors.length; i++) {
        var elements = element.querySelectorAll(junkSelectors[i]);
        for (var j = elements.length - 1; j >= 0; j--) {
          if (elements[j] && elements[j].remove) {
            elements[j].remove();
          }
        }
      }

      // Remove h1 elements (already have title)
      var h1Elements = element.querySelectorAll('h1');
      for (var i = h1Elements.length - 1; i >= 0; i--) {
        if (h1Elements[i] && h1Elements[i].remove) {
          h1Elements[i].remove();
        }
      }

      // Clean up empty elements and normalize whitespace
      this._cleanEmptyElements(element);
    },

    _cleanEmptyElements: function(element) {
      // Remove elements that are empty or contain only whitespace
      var emptyElements = element.querySelectorAll('p:empty, div:empty, span:empty');
      for (var i = 0; i < emptyElements.length; i++) {
        if (emptyElements[i] && emptyElements[i].remove) {
          emptyElements[i].remove();
        }
      }

      // Clean up elements that only contain whitespace
      var textNodes = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      var node;
      while (node = textNodes.nextNode()) {
        if (node.nodeValue && /^\s*$/.test(node.nodeValue)) {
          // Node contains only whitespace
          var parent = node.parentNode;
          if (parent && parent.childNodes.length === 1) {
            // Parent only contains this whitespace node, remove parent
            if (parent.remove) {
              parent.remove();
            }
          }
        }
      }
    },

    // HTML tidy functionality (basic cleanup)
    _tidyContent: function(element) {
      // Fix common HTML structure issues
      // Convert multiple BR tags to paragraphs
      var brGroups = element.querySelectorAll('br + br');
      for (var i = 0; i < brGroups.length; i++) {
        var br = brGroups[i];
        if (br.previousElementSibling && br.previousElementSibling.tagName === 'BR') {
          // Replace double BRs with paragraph breaks
          var p = document.createElement('p');
          br.parentNode.insertBefore(p, br);
          br.remove();
          if (br.previousElementSibling) {
            br.previousElementSibling.remove();
          }
        }
      }

      // Clean up excessive whitespace
      var walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      var textNode;
      while (textNode = walker.nextNode()) {
        if (textNode.nodeValue) {
          // Normalize whitespace but preserve intentional line breaks
          textNode.nodeValue = textNode.nodeValue.replace(/[ \t]+/g, ' ');
        }
      }

      // Remove empty attributes
      var allElements = element.querySelectorAll('*');
      for (var i = 0; i < allElements.length; i++) {
        var el = allElements[i];
        for (var j = el.attributes.length - 1; j >= 0; j--) {
          var attr = el.attributes[j];
          if (!attr.value || attr.value.trim() === '') {
            el.removeAttribute(attr.name);
          }
        }
      }
    },

    // Find single page link (matches PHP makefulltextfeed.php logic)
    _findSinglePageLink: function(config) {
      if (!config.single_page_link || config.single_page_link.length === 0) {
        return null;
      }

      // Loop through single_page_link xpath expressions (PHP: foreach ($splink as $pattern))
      for (var i = 0; i < config.single_page_link.length; i++) {
        var pattern = config.single_page_link[i];
        try {
          // Try to evaluate as XPath returning a string (PHP: is_string($elems))
          var result = this._doc.evaluate(
            pattern,
            this._doc,
            null,
            XPathResult.STRING_TYPE,
            null
          );

          if (result.stringValue && result.stringValue.trim()) {
            var url = this._makeAbsoluteUrl(result.stringValue.trim());
            if (url) return url;
          }
        } catch {
          // XPath failed, try as node selector
        }

        try {
          // Try to evaluate as XPath returning nodes (PHP: $elems instanceof DOMNodeList)
          var nodes = this._evaluateXPathAll(pattern);
          if (nodes && nodes.length > 0) {
            for (var j = 0; j < nodes.length; j++) {
              var node = nodes[j];
              // Check if it's an element with href attribute (PHP: hasAttribute('href'))
              if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('href')) {
                var url = this._makeAbsoluteUrl(node.getAttribute('href'));
                if (url) return url;
              }
              // Also check if the text content looks like a URL
              else if (node.textContent) {
                var text = node.textContent.trim();
                if (text.match(/^https?:\/\//)) {
                  var url = this._makeAbsoluteUrl(text);
                  if (url) return url;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Single page link XPath evaluation failed:', pattern, e);
        }
      }

      return null;
    },

    // Find next page link (matches PHP makefulltextfeed.php logic)
    _findNextPageLink: function(config) {
      if (config && config.next_page_link && config.next_page_link.length > 0) {
        for (var i = 0; i < config.next_page_link.length; i++) {
          var pattern = config.next_page_link[i];
          try {
            var result = this._doc.evaluate(
              pattern,
              this._doc,
              null,
              XPathResult.STRING_TYPE,
              null
            );

            if (result.stringValue && result.stringValue.trim()) {
              var url = this._makeAbsoluteUrl(result.stringValue.trim());
              if (url) return url;
            }
          } catch (e) {
            // XPath failed, try as node selector
          }

          try {
            var nodes = this._evaluateXPathAll(pattern);
            if (nodes && nodes.length > 0) {
              for (var j = 0; j < nodes.length; j++) {
                var node = nodes[j];
                if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('href')) {
                  var url = this._makeAbsoluteUrl(node.getAttribute('href'));
                  if (url) return url;
                } else if (node.textContent) {
                  var text = node.textContent.trim();
                  var textUrl = this._makeAbsoluteUrl(text);
                  if (textUrl) return textUrl;
                }
              }
            }
          } catch (e) {
            console.warn('Next page link XPath evaluation failed:', pattern, e);
          }
        }
      }

      if (config && config.autodetect_next_page) {
        var autodetected = this._autoDetectNextPageLink();
        if (autodetected) {
          return this._makeAbsoluteUrl(autodetected);
        }
      }

      return null;
    },

    _autoDetectNextPageLink: function() {
      var relNext = this._doc.querySelector('link[rel="next"][href], a[rel="next"][href]');
      if (relNext) {
        return relNext.getAttribute('href');
      }

      var anchors = this._doc.querySelectorAll('a[href]');
      for (var i = 0; i < anchors.length; i++) {
        var anchor = anchors[i];
        var text = (anchor.textContent || '').trim().toLowerCase();
        var rel = (anchor.getAttribute('rel') || '').toLowerCase();
        var ariaLabel = (anchor.getAttribute('aria-label') || '').toLowerCase();
        var className = (anchor.className || '').toString().toLowerCase();
        var id = (anchor.id || '').toLowerCase();

        if (rel.indexOf('next') !== -1) {
          return anchor.getAttribute('href');
        }

        var label = (text + ' ' + ariaLabel).trim();
        var hint = (className + ' ' + id).trim();

        if ((/\bnext\b|\bolder\b|\bmore\b/.test(label) || /[»›→]/.test(label) || /\bnext\b/.test(hint)) &&
          !/\bprev\b|\bprevious\b|\bback\b|\bnewer\b/.test(label)) {
          return anchor.getAttribute('href');
        }
      }

      return null;
    },

    // Helper to evaluate XPath returning all matching nodes
    _evaluateXPathAll: function(xpath, contextNode) {
      try {
        contextNode = contextNode || this._doc;
        var result = this._doc.evaluate(
          xpath,
          contextNode,
          null,
          XPathResult.ORDERED_NODE_ITERATOR_TYPE,
          null
        );

        var nodes = [];
        var node;
        while (node = result.iterateNext()) {
          nodes.push(node);
        }
        return nodes;
      } catch (e) {
        console.warn('XPath evaluation failed:', xpath, e);
        return [];
      }
    },

    // Make URL absolute (basic implementation)
    _makeAbsoluteUrl: function(url) {
      if (!url) return null;

      var trimmed = url.trim();
      if (!trimmed) return null;

      try {
        var baseHref = null;
        if (this._doc) {
          var baseTag = this._doc.querySelector('base[href]');
          if (baseTag) {
            baseHref = baseTag.getAttribute('href');
          } else if (this._doc.baseURI && this._doc.baseURI.indexOf('about:') !== 0) {
            baseHref = this._doc.baseURI;
          }
        }

        var base = window.location.href;
        if (baseHref) {
          try {
            base = new URL(baseHref, window.location.href).href;
          } catch (e) {
            base = window.location.href;
          }
        }

        var resolved = new URL(trimmed, base);
        if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
          return null;
        }
        return resolved.href;
      } catch (e) {
        return null;
      }
    },

    // Note: HTML preprocessing now handled by standalone applyHtmlPreprocessing() function

    _getCachedConfig: function(hostname) {
      try {
        var cached = sessionStorage.getItem('siteConfig_' + hostname);
        if (cached) {
          var data = JSON.parse(cached);
          // Check if cache is less than 24 hours old
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            console.log('Using cached FiveFilters config for', hostname);
            return data.config;
          }
        }
      } catch {
        // Session storage not available or parsing failed
      }
      return null;
    },

    _getSiteConfig: function(_hostname) {
      // All configs should be fetched from server (FiveFilters)
      // This function is deprecated - configs come from cache or server
      return null;
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
              } catch {
                // Session storage not available, ignore
              }
            }
          })
          .catch(function() {
            // Silently fail - this is a nice-to-have feature
            console.log('No dynamic config available for', hostname);
          });
      } catch {
        // Ignore any errors in dynamic config fetching
      }
    },

    _fetchSyncConfig: function(hostname) {
      try {
        var serviceUrl = SERVICE_URL.replace('/process-article', '');
        var xhr = new XMLHttpRequest();
        xhr.open('GET', serviceUrl + '/site-config/' + hostname, false); // synchronous
        xhr.send();

        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          if (data.success && data.config) {
            // Cache the result for future use
            try {
              sessionStorage.setItem('siteConfig_' + hostname, JSON.stringify({
                config: data.config,
                timestamp: Date.now()
              }));
              console.log('Fetched and cached site config for', hostname, 'from FiveFilters');
            } catch {
              // Session storage not available, ignore
            }
            return data.config;
          }
        }
        return null;
      } catch (e) {
        console.log('Sync config fetch failed for', hostname, ':', e.message);
        return null;
      }
    },

    // Fix image URLs to be absolute and detect images
    _fixImageUrls: function(html) {
      return fixImageUrls(html);
    },

    // Detect if content has images
    _detectImages: function(html) {
      if (!html) return false;

      // Check for img tags
      var imgCount = (html.match(/<img[^>]*>/gi) || []).length;

      // Check for background images in style attributes
      var bgImageCount = (html.match(/background-image\s*:\s*url\(/gi) || []).length;

      // Check for figure/picture elements
      var figureCount = (html.match(/<figure[^>]*>|<picture[^>]*>/gi) || []).length;

      console.log('Image detection:', {
        imgTags: imgCount,
        backgroundImages: bgImageCount,
        figures: figureCount,
        total: imgCount + bgImageCount + figureCount
      });

      return (imgCount + bgImageCount + figureCount) > 0;
    },

    // Add content sections for better navigation
    _addContentSections: function(html) {
      if (!html) return html;

      var div = document.createElement('div');
      div.innerHTML = html;

      // Find all headers for sectioning
      var headers = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
      var sections = [];
      var currentSection = null;

      if (headers.length > 1) {
        // Group content into sections based on headers
        var walker = document.createTreeWalker(
          div,
          NodeFilter.SHOW_ALL,
          null,
          false
        );

        var node;
        while (node = walker.nextNode()) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            var tagName = node.tagName.toLowerCase();

            if (tagName.match(/^h[1-6]$/)) {
              // Start new section
              if (currentSection) {
                sections.push(currentSection);
              }
              currentSection = {
                header: node.cloneNode(true),
                content: [],
                level: parseInt(tagName.charAt(1))
              };
            } else if (currentSection && node.parentNode === div) {
              // Add to current section
              currentSection.content.push(node.cloneNode(true));
            }
          }
        }

        if (currentSection) {
          sections.push(currentSection);
        }

        // Rebuild HTML with better section structure
        if (sections.length > 1) {
          var newDiv = document.createElement('div');
          newDiv.className = 'article-content';

          sections.forEach(function(section, index) {
            var sectionDiv = document.createElement('section');
            sectionDiv.className = 'content-section';
            sectionDiv.setAttribute('data-section', index + 1);

            // Add header with anchor
            var headerId = 'section-' + (index + 1);
            section.header.id = headerId;
            sectionDiv.appendChild(section.header);

            // Add content
            section.content.forEach(function(node) {
              sectionDiv.appendChild(node);
            });

            newDiv.appendChild(sectionDiv);
          });

          return newDiv.innerHTML;
        }
      }

      // No significant sectioning needed, return original with wrapper
      var wrapper = document.createElement('div');
      wrapper.className = 'article-content single-section';
      wrapper.innerHTML = html;
      return wrapper.innerHTML;
    }
  };

  // Standalone HTML preprocessing function (matches PHP str_replace logic)
  function applyHtmlPreprocessing(html, preprocessingRules) {
    console.log('Starting HTML preprocessing with', preprocessingRules.length, 'rules');
    var modifiedHtml = html;
    var extraRules = [];

    for (var i = 0; i < preprocessingRules.length; i++) {
      var rule = preprocessingRules[i];
      if (rule.find && rule.replace !== undefined) {
        // PHP uses str_replace (literal), not regex
        var findString = rule.find;
        var replaceString = rule.replace;
        modifiedHtml = modifiedHtml.split(findString).join(replaceString);
        console.log('Applied HTML preprocessing:', findString, '->', replaceString);

        // Auto-generate closing tag replacement for opening tags
        // Pattern: <tagname -> <newtag should also create </tagname -> </newtag
        var openingTagMatch = findString.match(/^<([a-zA-Z][a-zA-Z0-9-]*)$/);
        var replaceTagMatch = replaceString.match(/^<([a-zA-Z][a-zA-Z0-9-]*)$/);

        if (openingTagMatch && replaceTagMatch) {
          var originalTag = openingTagMatch[1];
          var newTag = replaceTagMatch[1];
          var closingFind = '</' + originalTag + '>';
          var closingReplace = '</' + newTag + '>';

          // Only add if not already explicitly defined
          var alreadyDefined = preprocessingRules.some(function(r) {
            return r.find === closingFind;
          });

          if (!alreadyDefined) {
            extraRules.push({
              find: closingFind,
              replace: closingReplace
            });
            console.log('Auto-generated closing tag rule:', closingFind, '->', closingReplace);
          }
        }
      }
    }

    // Apply auto-generated closing tag rules
    for (var j = 0; j < extraRules.length; j++) {
      var extraRule = extraRules[j];
      modifiedHtml = modifiedHtml.split(extraRule.find).join(extraRule.replace);
      console.log('Applied auto-generated rule:', extraRule.find, '->', extraRule.replace);
    }

    return modifiedHtml;
  }

  function buildDocumentFromHtml(html, baseUrl, preprocessingRules) {
    var finalHtml = html;
    if (preprocessingRules && preprocessingRules.length > 0) {
      finalHtml = applyHtmlPreprocessing(html, preprocessingRules);
    }

    var parser = new DOMParser();
    var doc = parser.parseFromString(finalHtml, 'text/html');
    ensureBaseTag(doc, baseUrl);
    return doc;
  }

  function ensureBaseTag(doc, baseUrl) {
    if (!doc || !baseUrl) return;
    var baseTag = doc.querySelector('base[href]');
    if (baseTag) return;
    var head = doc.querySelector('head');
    if (!head) return;
    var base = doc.createElement('base');
    base.setAttribute('href', baseUrl);
    head.insertBefore(base, head.firstChild);
  }

  function normalizePaginationUrl(url) {
    try {
      var resolved = new URL(url, window.location.href);
      resolved.hash = '';
      return resolved.href;
    } catch (e) {
      return null;
    }
  }

  function isSameOriginUrl(url) {
    try {
      var resolved = new URL(url, window.location.href);
      return resolved.origin === window.location.origin;
    } catch (e) {
      return false;
    }
  }

  function fetchPageHtml(url) {
    return fetch(url, { credentials: 'include' })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Pagination fetch failed with status ' + response.status);
        }
        return response.text();
      })
      .catch(function(error) {
        console.warn('Pagination fetch failed:', url, error);
        return null;
      });
  }

  function mergePaginatedContent(pageBlocks) {
    var mergedHtml = [];
    var mergedText = [];
    var previousBoundary = null;
    var previousText = null;

    function normalizeText(text) {
      return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function findBoundary(container, fromStart) {
      if (!container || !container.children || container.children.length === 0) return null;
      if (fromStart) {
        for (var i = 0; i < container.children.length; i++) {
          var child = container.children[i];
          var text = normalizeText(child.textContent);
          if (text) return { element: child, text: text };
        }
      } else {
        for (var j = container.children.length - 1; j >= 0; j--) {
          var lastChild = container.children[j];
          var lastText = normalizeText(lastChild.textContent);
          if (lastText) return { element: lastChild, text: lastText };
        }
      }
      return null;
    }

    for (var i = 0; i < pageBlocks.length; i++) {
      var block = pageBlocks[i];
      var container = document.createElement('div');
      container.innerHTML = block.html || '';

      var firstBoundary = findBoundary(container, true);
      var lastBoundary = findBoundary(container, false);

      if (previousBoundary) {
        if (firstBoundary && (firstBoundary.text === previousBoundary.first || firstBoundary.text === previousBoundary.last)) {
          firstBoundary.element.remove();
        }
        if (lastBoundary && (lastBoundary.text === previousBoundary.last || lastBoundary.text === previousBoundary.first)) {
          lastBoundary.element.remove();
        }
      }

      firstBoundary = findBoundary(container, true);
      lastBoundary = findBoundary(container, false);

      var pageText = normalizeText(container.textContent || '');
      if (!pageText) continue;
      if (previousText && pageText === previousText) continue;

      mergedHtml.push(container.innerHTML);
      mergedText.push(container.textContent || '');
      previousText = pageText;
      previousBoundary = {
        first: firstBoundary ? firstBoundary.text : '',
        last: lastBoundary ? lastBoundary.text : ''
      };
    }

    return {
      html: mergedHtml.join('\n' + PAGINATION_SEPARATOR_HTML + '\n'),
      text: mergedText.join(' ').trim()
    };
  }

  async function extractSiteConfigWithPagination(config, processedDoc, baseUrl) {
    var reader = new Readability(processedDoc);
    var firstResult = reader._extractWithSiteConfig(config);

    if (!firstResult || !firstResult.content) {
      return firstResult;
    }

    var hasPaginationRules = config && ((config.next_page_link && config.next_page_link.length > 0) || config.autodetect_next_page);
    if (!hasPaginationRules) {
      return firstResult;
    }

    var visited = {};
    var pages = [];
    var pageCount = 0;
    var currentReader = reader;
    var currentResult = firstResult;
    var normalizedBase = normalizePaginationUrl(baseUrl);
    if (normalizedBase) {
      visited[normalizedBase] = true;
    }

    while (currentResult && currentResult.content) {
      pages.push({ html: currentResult.content, text: currentResult.textContent });
      pageCount += 1;

      if (pageCount >= MAX_PAGINATION_PAGES) {
        console.log('Pagination cap reached at', pageCount, 'pages');
        break;
      }

      var nextUrl = currentReader._findNextPageLink(config);
      if (!nextUrl) break;
      if (!isSameOriginUrl(nextUrl)) {
        console.log('Pagination link is cross-origin, skipping:', nextUrl);
        break;
      }

      var normalizedNext = normalizePaginationUrl(nextUrl);
      if (!normalizedNext || visited[normalizedNext]) {
        console.log('Pagination loop detected, stopping at', nextUrl);
        break;
      }
      visited[normalizedNext] = true;

      var nextHtml = await fetchPageHtml(nextUrl);
      if (!nextHtml) break;
      var nextDoc = buildDocumentFromHtml(nextHtml, nextUrl, config.htmlPreprocessing);
      currentReader = new Readability(nextDoc);
      currentResult = currentReader._extractWithSiteConfig(config, { skipSinglePageLink: true });
    }

    if (pages.length > 1) {
      var merged = mergePaginatedContent(pages);
      if (merged && merged.html) {
        firstResult.content = merged.html;
        firstResult.textContent = merged.text || firstResult.textContent;
        firstResult.length = (merged.text || '').length;
        firstResult.pageCount = pages.length;
      }
    }

    return firstResult;
  }

  // Async function to extract article, waiting for site config if needed
  function extractArticleWithConfig(indicator) {
    return new Promise(function(resolve) {
      var hostname = window.location.hostname.replace(/^www\./, '');

      // Check if we have a cached config from a previous fetch
      var tempReader = new Readability(document);
      var config = tempReader._getCachedConfig(hostname);

      if (config) {
        // We have config - follow PHP FiveFilters flow exactly
        var rawHtml = document.documentElement.outerHTML;
        var processedDoc = buildDocumentFromHtml(rawHtml, window.location.href, config.htmlPreprocessing);

        extractSiteConfigWithPagination(config, processedDoc, window.location.href)
          .then(function(siteConfigResult) {
            if (siteConfigResult && siteConfigResult.title && siteConfigResult.content) {
              console.log('Extraction successful using FiveFilters XPath rules');
              resolve(siteConfigResult);
              return;
            }

            // XPath failed, fall back to Readability auto-detection (matches PHP autodetect_on_failure)
            console.log('XPath extraction failed, falling back to Readability auto-detection');
            var fallbackReader = new Readability(processedDoc);
            var article = fallbackReader.parse();
            if (article) {
              article.extractionNote = 'XPath rules failed, used Readability fallback';
            }
            resolve(article);
          })
          .catch(function(error) {
            console.log('Site config pagination failed, falling back to Readability:', error);
            var fallbackReader = new Readability(processedDoc);
            var article = fallbackReader.parse();
            if (article) {
              article.extractionNote = 'Site config pagination failed, used Readability fallback';
            }
            resolve(article);
          });
        return;
      }

      // No config available, try to fetch it
      updateIndicator(indicator, '📖 Getting site-specific extraction rules...');

      var serviceUrl = SERVICE_URL.replace('/process-article', '');
      fetch(serviceUrl + '/site-config/' + hostname)
        .then(function(response) {
          if (response.ok) {
            return response.json();
          }
          throw new Error('No config available');
        })
        .then(function(data) {
          if (data.success && data.config) {
            // Store the config and extract with it
            try {
              sessionStorage.setItem('siteConfig_' + hostname, JSON.stringify({
                config: data.config,
                timestamp: Date.now()
              }));
              console.log('Using fresh FiveFilters config for', hostname);
            } catch {
              // Session storage not available, continue anyway
            }

            updateIndicator(indicator, '📖 Extracting with site-specific rules...');

            // Follow PHP FiveFilters flow exactly (same logic as cached config path)
            var rawHtml = document.documentElement.outerHTML;
            var processedDoc = buildDocumentFromHtml(rawHtml, window.location.href, data.config.htmlPreprocessing);

            extractSiteConfigWithPagination(data.config, processedDoc, window.location.href)
              .then(function(siteConfigResult) {
                var article;
                if (siteConfigResult && siteConfigResult.title && siteConfigResult.content) {
                  console.log('Extraction successful using FiveFilters XPath rules');
                  article = siteConfigResult;
                } else {
                  // Step 4: XPath failed, fall back to Readability
                  console.log('XPath extraction failed, falling back to Readability auto-detection');
                  var fallbackReader = new Readability(processedDoc);
                  article = fallbackReader.parse();
                  if (article) {
                    article.extractionNote = 'XPath rules failed, used Readability fallback';
                  }
                }
                resolve(article);
              })
              .catch(function(error) {
                console.log('Site config pagination failed, falling back to Readability:', error);
                var fallbackReader = new Readability(processedDoc);
                var article = fallbackReader.parse();
                if (article) {
                  article.extractionNote = 'Site config pagination failed, used Readability fallback';
                }
                resolve(article);
              });
            return;
          } else {
            // No config available, fall back to regular extraction
            updateIndicator(indicator, '📖 Extracting with general rules...');
            var fallbackReader = new Readability(document);
            var article = fallbackReader.parse();
            resolve(article);
          }
        })
        .catch(function() {
          // Config fetch failed, fall back to regular extraction
          console.log('Config fetch failed for', hostname, '- using fallback extraction');
          updateIndicator(indicator, '📖 Using general extraction (no site-specific config available)...');
          var fallbackReader = new Readability(document);
          var article = fallbackReader.parse();

          // Add note about fallback extraction
          if (article) {
            article.extractionNote = `Extracted using general rules. For ${hostname}, no site-specific configuration was available.`;
          }

          resolve(article);
        });
    });
  }

  if (!isTestMode) {
    try {
      // Create a simple UI indicator
      const indicator = createIndicator();
      document.body.appendChild(indicator);

      // Extract article content - first try to get site config if needed
      logDebug('extraction', 'Starting article extraction');
      extractArticleWithConfig(indicator).then(function(article) {
        if (!article) {
          logDebug('error', 'Article extraction returned null');
          throw new Error('Could not extract article content from this page');
        }

        logDebug('extraction', 'Article extracted', {
          title: article.title,
          contentLength: article.content?.length || 0,
          method: article.extractionMethod || 'unknown'
        });

        if (article.content) {
          logContentStats('post-extraction', article.content, article.textContent, {
            method: article.extractionMethod || 'unknown'
          });
        }

        // Debug: Check content structure before fixImageUrls
        if (article.content) {
          const beforeBrCount = (article.content.match(/<br>/gi) || []).length;
          const beforeNewlineCount = (article.content.match(/\n/g) || []).length;
          const beforePCount = (article.content.match(/<p>/gi) || []).length;
          console.log(`Before fixImageUrls: ${beforePCount} <p> tags, ${beforeBrCount} <br> tags, ${beforeNewlineCount} newlines`);

          // Fix image URLs to ensure they're absolute
          logContentStats('pre-fix-images', article.content, null);
          article.content = fixImageUrls(article.content);
          logContentStats('post-fix-images', article.content, null);

          // Debug: Check content structure after fixImageUrls
          const afterBrCount = (article.content.match(/<br>/gi) || []).length;
          const afterNewlineCount = (article.content.match(/\n/g) || []).length;
          const afterPCount = (article.content.match(/<p>/gi) || []).length;
          console.log(`After fixImageUrls: ${afterPCount} <p> tags, ${afterBrCount} <br> tags, ${afterNewlineCount} newlines`);

          if (beforeNewlineCount !== afterNewlineCount) {
            console.warn(`fixImageUrls changed newline count from ${beforeNewlineCount} to ${afterNewlineCount}`);
          }
        }

        // Enhance article data
        const enhancedArticle = {
          ...article,
          url: window.location.href,
          domain: window.location.hostname,
          extractedAt: new Date().toISOString(),
          userAgent: navigator.userAgent.substring(0, 100)
        };

        // Base64 encode to prevent truncation but preserve structure
        let contentB64 = null;
        try {
          if (enhancedArticle.content) {
            logContentStats('pre-encode', enhancedArticle.content, enhancedArticle.textContent);
            // Debug: Check what we're encoding
            const brCount = (enhancedArticle.content.match(/<br>/gi) || []).length;
            const newlineCount = (enhancedArticle.content.match(/\n/g) || []).length;
            const pCount = (enhancedArticle.content.match(/<p>/gi) || []).length;
            console.log(`Encoding content with: ${pCount} <p> tags, ${brCount} <br> tags, ${newlineCount} newlines`);

            // Check first paragraph
            const firstChars = enhancedArticle.content.substring(0, 200).replace(/<[^>]*>/g, '').trim();
            console.log('Content to encode starts with:', firstChars.substring(0, 100));

            // Use base64 encoding that preserves Unicode properly
            // The unescape(encodeURIComponent()) pattern converts to Latin-1 for btoa
            // But this might be altering whitespace characters
            contentB64 = btoa(unescape(encodeURIComponent(enhancedArticle.content)));
            console.log('Successfully encoded', enhancedArticle.content.length, 'chars to base64');
            logDebug('content', 'base64-encoded', {
              contentLength: enhancedArticle.content.length,
              base64Length: contentB64.length
            });
          }
        } catch (e) {
          console.error('Failed to base64-encode content:', e);
          logDebug('content', 'base64-encode-failed', { error: e.message });
        }

        var debugHookResult = null;
        if (typeof window.__ARTICLE_MONSTER_DEBUG_HOOK__ === 'function') {
          try {
            debugHookResult = window.__ARTICLE_MONSTER_DEBUG_HOOK__({
              article: enhancedArticle,
              content_b64: contentB64,
              debugInfo: __bmLog
            }) || null;
          } catch (e) {
            console.warn('Debug hook failed:', e);
          }
        }

        if (debugHookResult && debugHookResult.skipSend) {
          if (document.body.contains(indicator)) {
            document.body.removeChild(indicator);
          }
          return { __debugSkipSend: true };
        }

        // Send to service
        updateIndicator(indicator, 'Sending to Kindle and Zotero...');

        // Log extraction results for debugging
        console.log('=== ARTICLE EXTRACTION DEBUG ===');
        console.log('Title:', enhancedArticle.title);
        console.log('Content length:', enhancedArticle.content?.length || 0);
        console.log('Text content length:', enhancedArticle.textContent?.length || 0);
        console.log('Extraction method:', enhancedArticle.extractionMethod);
        console.log('Extraction note:', enhancedArticle.extractionNote);
        console.log('Has images:', enhancedArticle.hasImages);
        if (enhancedArticle.content) {
          var pCount = (enhancedArticle.content.match(/<p[^>]*>/gi) || []).length;
          var brCount = (enhancedArticle.content.match(/<br[^>]*>/gi) || []).length;
          console.log('Content structure:', pCount, '<p> tags,', brCount, '<br> tags');
          console.log('Content preview:', enhancedArticle.content.substring(0, 200) + '...');
        }
        console.log('=== END EXTRACTION DEBUG ===');

        return fetch(SERVICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: window.location.href,
            article: {
              ...enhancedArticle,
              content_b64: contentB64,
              // Also send raw content to compare
              content: enhancedArticle.content
            },
            debugInfo: __bmLog
          })
        });
      })
        .then(response => {
          if (response && response.__debugSkipSend) {
            return response;
          }
          return response.json();
        })
        .then(data => {
          if (data && data.__debugSkipSend) {
            return;
          }
          document.body.removeChild(indicator);

          // Show results
          const results = [];
          if (data.kindle === 'sent') results.push('✅ Sent to Kindle');
          else results.push('❌ Kindle failed');

          if (data.zotero === 'sent') results.push('✅ Saved to Zotero');
          else results.push('❌ Zotero failed');

          const message = `📖 "${data.article.title}"\n\n${results.join('\n')}\n\n👆 Results for your bookmarklet`;
          showResult(message);
        })
        .catch(error => {
          if (document.querySelector('#article-bookmarklet-indicator')) {
            document.body.removeChild(document.querySelector('#article-bookmarklet-indicator'));
          }
          var hostname = window.location.hostname.replace(/^www\./, '');
          var helpMessage = '';

          if (error.message.includes('fetch') || error.message.includes('network')) {
            helpMessage = '\n\n💡 This might be due to:\n- Network connectivity issues\n- Site blocking automated access\n- CORS restrictions\n\nTry refreshing the page and using the bookmarklet again.';
          } else if (error.message.includes('extract')) {
            helpMessage = `\n\n💡 Extraction failed for ${hostname}:\n- This site may use unusual formatting\n- Content might be dynamically loaded\n- The page might not contain a standard article\n\nTry using the bookmarklet on the main article page.`;
          } else {
            helpMessage = '\n\n💡 Please try again or check your internet connection.';
          }

          showResult('❌ Error: ' + error.message + helpMessage);
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
  }

  // Fix relative image URLs to absolute URLs
  function fixImageUrls(html) {
    try {
      if (!html) return html;

      // IMPORTANT: When we set innerHTML, the browser normalizes the HTML
      // This can strip newlines and merge paragraphs
      // Let's try to preserve the original structure as much as possible

      var div = document.createElement('div');
      div.innerHTML = html;
      var baseUrl = window.location.origin;
      var currentUrl = window.location.href;

      div.querySelectorAll('img').forEach(function(img) {
        // Get the actual resolved src from the DOM element
        var actualSrc = img.src || img.getAttribute('src');

        // Fix relative URLs to absolute
        if (actualSrc && !actualSrc.startsWith('http') && !actualSrc.startsWith('data:')) {
          try {
            img.src = new URL(actualSrc, currentUrl).href;
          } catch {
            // If URL construction fails, try with base URL
            if (actualSrc.startsWith('/')) {
              img.src = baseUrl + actualSrc;
            }
          }
        } else if (actualSrc && actualSrc.startsWith('http')) {
          // Ensure we're using the full URL
          img.src = actualSrc;
        }

        // Also fix data-src for lazy-loaded images
        var dataSrc = img.getAttribute('data-src');
        if (dataSrc && !img.src) {
          if (!dataSrc.startsWith('http') && !dataSrc.startsWith('data:')) {
            try {
              img.src = new URL(dataSrc, currentUrl).href;
            } catch {
              if (dataSrc.startsWith('/')) {
                img.src = baseUrl + dataSrc;
              }
            }
          } else {
            img.src = dataSrc;
          }
        }

        // Also fix srcset for responsive images
        if (img.srcset) {
          img.srcset = img.srcset.split(',').map(function(src) {
            var parts = src.trim().split(' ');
            var url = parts[0];
            var descriptor = parts.slice(1).join(' ');

            if (!url.startsWith('http') && !url.startsWith('data:')) {
              try {
                url = new URL(url, currentUrl).href;
              } catch {
                if (url.startsWith('/')) {
                  url = baseUrl + url;
                }
              }
            }

            return descriptor ? url + ' ' + descriptor : url;
          }).join(', ');
        }

        // Add loading attributes for better performance
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }

        // Add a width/height if missing to prevent layout shifts
        if (!img.hasAttribute('width') && img.naturalWidth) {
          img.setAttribute('width', img.naturalWidth);
        }
        if (!img.hasAttribute('height') && img.naturalHeight) {
          img.setAttribute('height', img.naturalHeight);
        }

        console.log('Fixed image:', img.src);
      });

      return div.innerHTML;
    } catch (e) {
      console.error('Error fixing image URLs:', e);
      return html; // Return original HTML if fixing fails
    }
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

  if (isTestMode) {
    window.__ArticleMonsterTestHooks = {
      Readability: Readability,
      applyHtmlPreprocessing: applyHtmlPreprocessing
    };
  }

})();
