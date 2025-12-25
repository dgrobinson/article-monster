// Article Bookmarklet - DEBUG VERSION
// Loads production extractor and shows extracted content alongside page HTML
(function() {
  'use strict';

  if (window.__ARTICLE_MONSTER_DEBUG_ACTIVE__) {
    alert('Debug extraction is already running on this page.');
    return;
  }
  window.__ARTICLE_MONSTER_DEBUG_ACTIVE__ = true;

  var rawHTML = document.documentElement.outerHTML;
  var fullHTML = rawHTML
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT REMOVED]')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '[STYLE REMOVED]');

  var debugHandled = false;
  var debugCaptureSent = false;

  window.__ARTICLE_MONSTER_DEBUG_HOOK__ = function(payload) {
    if (debugHandled) return { skipSend: true };
    debugHandled = true;

    captureDebugSnapshot(payload);

    var article = (payload && payload.article) || {};
    var normalized = {
      title: article.title || document.title || 'No Title',
      content: article.content || 'No content extracted',
      textContent: article.textContent || '',
      length: article.length || (article.textContent ? article.textContent.length : 0),
      excerpt: article.excerpt || '',
      byline: article.byline || '',
      siteName: article.siteName || window.location.hostname,
      publishedTime: article.publishedTime || '',
      extractionMethod: article.extractionMethod || article.source || '',
      extractionNote: article.extractionNote || '',
      configSource: article.configSource || ''
    };

    showDebugComparison(fullHTML, normalized, !article || !article.content);
    window.__ARTICLE_MONSTER_DEBUG_ACTIVE__ = false;
    return { skipSend: true };
  };

  setTimeout(function() {
    if (debugHandled) return;
    debugHandled = true;
    var fallbackArticle = {
      title: document.title || 'Could not extract title',
      content: 'EXTRACTION FAILED - No content could be extracted by the production pipeline',
      textContent: 'EXTRACTION FAILED',
      length: 0,
      excerpt: 'No excerpt available - extraction failed',
      byline: 'Unknown',
      siteName: window.location.hostname,
      publishedTime: 'Unknown',
      extractionMethod: 'failed',
      extractionNote: 'No production extraction result returned'
    };

    captureDebugSnapshot({ article: fallbackArticle, debugInfo: [] });
    showDebugComparison(fullHTML, fallbackArticle, true);
    window.__ARTICLE_MONSTER_DEBUG_ACTIVE__ = false;
  }, 12000);

  try {
    var serviceOrigin = getServiceOrigin();
    if (!window.__BOOKMARKLET_SERVICE_URL__) {
      window.__BOOKMARKLET_SERVICE_URL__ = serviceOrigin + '/process-article';
    }

    var id = 'article-monster-script';
    var s = document.getElementById(id);
    if (s && s.parentNode) s.parentNode.removeChild(s);
    s = document.createElement('script');
    s.id = id;
    s.src = serviceOrigin + '/bookmarklet.js?v=' + Date.now();
    s.referrerPolicy = 'no-referrer-when-downgrade';
    document.body.appendChild(s);
  } catch (error) {
    window.__ARTICLE_MONSTER_DEBUG_ACTIVE__ = false;
    alert('❌ Debug extraction failed: ' + (error && error.message ? error.message : error));
  }

  function getServiceOrigin() {
    var script = document.getElementById('article-monster-debug-script') || document.currentScript;
    if (script && script.src) {
      try {
        return new URL(script.src).origin;
      } catch {
        // Fall through
      }
    }
    return window.location.origin;
  }

  function captureDebugSnapshot(payload) {
    if (debugCaptureSent) return;
    debugCaptureSent = true;

    var serviceUrl = window.__BOOKMARKLET_SERVICE_URL__ || (getServiceOrigin() + '/process-article');
    var articlePayload = (payload && payload.article) || {};
    if (payload && payload.content_b64 && !articlePayload.content_b64) {
      articlePayload = Object.assign({}, articlePayload, { content_b64: payload.content_b64 });
    }

    var body = {
      url: window.location.href,
      title: articlePayload.title || document.title || '',
      article: articlePayload,
      page_html: rawHTML,
      debug_capture_only: true,
      debug_source: 'bookmarklet-debug',
      debugInfo: (payload && payload.debugInfo) || []
    };

    showUploadStatus('Uploading debug snapshot...');
    fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function(response) {
      if (!response.ok) {
        throw new Error('Upload failed (' + response.status + ')');
      }
      return response.json().catch(function() { return {}; });
    }).then(function() {
      showUploadStatus('Debug snapshot uploaded.', false, true);
    }).catch(function(error) {
      showUploadStatus('Debug upload failed: ' + error.message, true);
    });
  }

  function showUploadStatus(message, isError, autoHide) {
    var id = 'article-monster-debug-upload';
    var banner = document.getElementById(id);
    if (!banner) {
      banner = document.createElement('div');
      banner.id = id;
      banner.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'right:0',
        'z-index:2000001',
        'padding:8px 12px',
        'font:13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif',
        'text-align:center'
      ].join(';');
      document.body.appendChild(banner);
    }

    banner.textContent = message;
    banner.style.background = isError ? '#b00020' : '#2c3e50';
    banner.style.color = '#fff';

    if (autoHide) {
      setTimeout(function() {
        if (banner && banner.parentNode) {
          banner.parentNode.removeChild(banner);
        }
      }, 2500);
    }
  }

  function showDebugComparison(fullHTML, extractedArticle, isExtractionFailure) {
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

    var methodLine = extractedArticle.extractionMethod ? escapeHtml(extractedArticle.extractionMethod) : 'Unknown';
    var noteLine = extractedArticle.extractionNote ? escapeHtml(extractedArticle.extractionNote) : 'None';
    var configLine = extractedArticle.configSource ? escapeHtml(extractedArticle.configSource) : 'None';

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
                  <strong>Length:</strong> ${extractedArticle.length || 0} chars<br>
                  <strong>Published:</strong> ${escapeHtml(extractedArticle.publishedTime || 'Unknown')}<br>
                  <strong>Method:</strong> ${methodLine}<br>
                  <strong>Config:</strong> ${configLine}<br>
                  <strong>Note:</strong> ${noteLine}
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
Extraction Status: ${extractedArticle.extractionMethod === 'failed' ? 'FAILED' : 'SUCCESS'}

========================================
EXTRACTION METADATA
========================================
Byline: ${extractedArticle.byline || 'None'}
Site Name: ${extractedArticle.siteName || 'Unknown'}
Content Length: ${extractedArticle.length || 0} characters
Published Time: ${extractedArticle.publishedTime || 'Unknown'}
Method: ${extractedArticle.extractionMethod || 'Unknown'}
Config: ${extractedArticle.configSource || 'None'}
Note: ${extractedArticle.extractionNote || 'None'}
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
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();
