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
      // Remove unwanted elements
      this._removeNodes(doc, 'script, style, noscript, iframe, object, embed');
      
      // Try to find the main content
      var candidates = this._getCandidates(doc);
      var topCandidate = this._getTopCandidate(candidates);
      
      if (topCandidate) {
        return topCandidate;
      }

      // Fallback: try common selectors
      var selectors = ['article', '.post', '.entry', '.content', '#content', 'main', '.main'];
      for (var i = 0; i < selectors.length; i++) {
        var element = doc.querySelector(selectors[i]);
        if (element && element.textContent.length > 500) {
          return element;
        }
      }

      // Last resort: return body
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