// Article Bookmarklet - DEBUG VERSION
// Shows full HTML and extracted content for comparison
(function() {
  'use strict';

  // Simplified Readability implementation (must be defined before use)
  function Readability(doc, options) {
    this._doc = doc;
    this._options = options || {};
  }

  Readability.prototype = {
    parse: function() {
      try {
        // First try JSON-LD structured data if available
        var jsonLdContent = this._extractFromJsonLd();
        if (jsonLdContent) {
          return jsonLdContent;
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
    }
  };

  try {
    // Extract article content using simplified Readability
    const reader = new Readability(document);
    const article = reader.parse();

    // Get the full page HTML (sanitized for display)
    const fullHTML = document.documentElement.outerHTML
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT REMOVED]')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '[STYLE REMOVED]');

    // If extraction failed, create a fallback article object
    if (!article) {
      const fallbackArticle = {
        title: document.title || 'Could not extract title',
        content: 'EXTRACTION FAILED - No content could be extracted by the simplified Readability algorithm',
        textContent: 'EXTRACTION FAILED',
        length: 0,
        excerpt: 'No excerpt available - extraction failed',
        byline: 'Unknown',
        siteName: window.location.hostname,
        publishedTime: 'Unknown',
        extractionError: 'The simplified Readability algorithm could not identify article content on this page'
      };

      showDebugComparison(fullHTML, fallbackArticle, true);
    } else {
      // Show comparison dialog
      showDebugComparison(fullHTML, article, false);
    }

  } catch (error) {
    alert('❌ Debug extraction failed: ' + error.message + '\n\nTrying to show debug info anyway...');

    // Even if there's an error, try to show what we can
    try {
      const fullHTML = document.documentElement.outerHTML;
      const errorArticle = {
        title: document.title || 'Error during extraction',
        content: 'CRITICAL ERROR: ' + error.message,
        textContent: 'CRITICAL ERROR: ' + error.message,
        length: 0,
        excerpt: 'Error occurred',
        byline: 'Error',
        siteName: window.location.hostname,
        publishedTime: 'Error',
        extractionError: error.message
      };

      showDebugComparison(fullHTML, errorArticle, true);
    } catch (secondError) {
      alert('❌ Complete failure: ' + secondError.message);
    }
  }

  function showDebugComparison(fullHTML, extractedArticle, isExtractionFailure = false) {
    // Create debug dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.9);
      z-index: 2000000;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    `;

    dialog.innerHTML = `
      <div style="padding: 20px; color: white;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="color: ${isExtractionFailure ? '#e74c3c' : 'white'}; margin: 0;">
            🐛 Article Extraction Debug ${isExtractionFailure ? '(EXTRACTION FAILED)' : ''}
          </h2>
          <div>
            <button onclick="copyBothToClipboard()" style="
              background: #f39c12; color: white; border: none; padding: 10px 20px;
              border-radius: 5px; cursor: pointer; font-size: 16px; margin-right: 10px;">
              📋 Copy Both (Structured)
            </button>
            <button onclick="this.closest('div').parentNode.remove()" style="
              background: #e74c3c; color: white; border: none; padding: 10px 20px;
              border-radius: 5px; cursor: pointer; font-size: 16px;">
              Close
            </button>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 80vh;">
          <!-- Full HTML Panel -->
          <div style="background: #2c3e50; border-radius: 8px; padding: 15px; overflow: hidden;">
            <h3 style="color: #3498db; margin: 0 0 15px 0;">Full Page HTML</h3>
            <div style="background: #34495e; border-radius: 4px; padding: 10px; overflow: auto; height: calc(100% - 50px);">
              <button onclick="copyToClipboard(this.nextElementSibling.textContent, 'Full HTML')" style="
                background: #3498db; color: white; border: none; padding: 5px 10px;
                border-radius: 3px; cursor: pointer; margin-bottom: 10px;">
                📋 Copy Full HTML
              </button>
              <pre style="color: #ecf0f1; font-size: 11px; line-height: 1.3; margin: 0; white-space: pre-wrap; word-break: break-all;">${escapeHtml(fullHTML.substring(0, 50000))}${fullHTML.length > 50000 ? '\n\n[TRUNCATED - Full content available via copy button]' : ''}</pre>
            </div>
          </div>
          
          <!-- Extracted Content Panel -->
          <div style="background: #27ae60; border-radius: 8px; padding: 15px; overflow: hidden;">
            <h3 style="color: white; margin: 0 0 15px 0;">Extracted Article Content</h3>
            <div style="background: #2ecc71; border-radius: 4px; padding: 10px; overflow: auto; height: calc(100% - 50px);">
              <button onclick="copyToClipboard(this.nextElementSibling.textContent, 'Extracted Content')" style="
                background: #27ae60; color: white; border: none; padding: 5px 10px;
                border-radius: 3px; cursor: pointer; margin-bottom: 10px;">
                📋 Copy Extracted
              </button>
              <div style="background: white; color: black; padding: 15px; border-radius: 4px; overflow: auto; height: calc(100% - 60px);">
                <h4 style="color: #2c3e50; margin: 0 0 10px 0;">${escapeHtml(extractedArticle.title || 'No Title')}</h4>
                <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 15px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                  <strong>Byline:</strong> ${escapeHtml(extractedArticle.byline || 'None')}<br>
                  <strong>Site:</strong> ${escapeHtml(extractedArticle.siteName || 'Unknown')}<br>
                  <strong>Length:</strong> ${extractedArticle.length} chars<br>
                  <strong>Published:</strong> ${escapeHtml(extractedArticle.publishedTime || 'Unknown')}
                </div>
                <div style="line-height: 1.6;">${extractedArticle.content || 'No content extracted'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #bdc3c7;">
          <p>Compare the full page HTML (left) with what was extracted (right). Copy either section to share for debugging.</p>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Add global copy functions
    window.copyToClipboard = function(text, type) {
      navigator.clipboard.writeText(type === 'Full HTML' ? fullHTML : text).then(function() {
        alert('✅ ' + type + ' copied to clipboard!');
      }, function() {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = type === 'Full HTML' ? fullHTML : text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('✅ ' + type + ' copied to clipboard!');
      });
    };

    window.copyBothToClipboard = function() {
      const structuredOutput = `ARTICLE EXTRACTION DEBUG REPORT
URL: ${window.location.href}
Title: ${extractedArticle.title || 'No Title'}
Date: ${new Date().toISOString()}
Extraction Status: ${extractedArticle.extractionError ? 'FAILED' : 'SUCCESS'}
${extractedArticle.extractionError ? 'Error: ' + extractedArticle.extractionError : ''}

========================================
EXTRACTION METADATA
========================================
Byline: ${extractedArticle.byline || 'None'}
Site Name: ${extractedArticle.siteName || 'Unknown'}
Content Length: ${extractedArticle.length} characters
Published Time: ${extractedArticle.publishedTime || 'Unknown'}
Excerpt: ${extractedArticle.excerpt || 'No excerpt'}

========================================
EXTRACTED CONTENT (What goes to Kindle/Zotero)
========================================
${extractedArticle.textContent || 'No text content extracted'}

========================================
EXTRACTED HTML (What goes to Kindle/Zotero)
========================================
${extractedArticle.content || 'No HTML content extracted'}

========================================
FULL PAGE HTML (Original source - truncated if very long)
========================================
${fullHTML.length > 100000 ? fullHTML.substring(0, 100000) + '\n\n[TRUNCATED - Full HTML was ' + fullHTML.length + ' characters]' : fullHTML}

========================================
END REPORT
========================================`;

      navigator.clipboard.writeText(structuredOutput).then(function() {
        alert('✅ Complete debug report copied to clipboard!\n\nThis includes:\n- Extraction metadata\n- Extracted content\n- Extracted HTML\n- Full page HTML\n\nPaste this to share with Claude for debugging.');
      }, function() {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = structuredOutput;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('✅ Complete debug report copied to clipboard!');
      });
    };
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();