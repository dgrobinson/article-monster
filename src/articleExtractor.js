const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Configure proxy agent if environment specifies one
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy ||
                 process.env.HTTP_PROXY || process.env.http_proxy;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

async function extractArticle(url) {
  try {
    console.log(`Fetching article from: ${url}`);
    
    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000,
      httpsAgent: proxyAgent,
      proxy: false
    });

    // Parse with JSDOM
    const dom = new JSDOM(response.data, { url });
    const doc = dom.window.document;

    // Extract with Readability
    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article) {
      throw new Error('Could not extract article content');
    }

    // Clean and enhance the article data
    const cleanArticle = {
      title: article.title || extractTitleFromUrl(url),
      content: article.content,
      textContent: article.textContent,
      length: article.length,
      excerpt: article.excerpt || article.textContent.substring(0, 300) + '...',
      byline: article.byline || 'Unknown',
      siteName: article.siteName || extractSiteFromUrl(url),
      url: url,
      publishedTime: extractPublishedTime(doc) || new Date().toISOString(),
      lang: article.lang || 'en'
    };

    console.log(`Successfully extracted article: "${cleanArticle.title}"`);
    return cleanArticle;

  } catch (error) {
    console.error('Article extraction failed:', error.message);
    throw new Error(`Failed to extract article: ${error.message}`);
  }
}

function extractTitleFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').pop().replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, '');
  } catch {
    return 'Untitled Article';
  }
}

function extractSiteFromUrl(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'Unknown Site';
  }
}

function extractPublishedTime(doc) {
  // Try various meta tags for published time
  const selectors = [
    'meta[property="article:published_time"]',
    'meta[name="date"]',
    'meta[name="publish-date"]',
    'time[datetime]',
    '.date',
    '.published'
  ];

  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const content = element.getAttribute('content') || 
                     element.getAttribute('datetime') || 
                     element.textContent;
      if (content) {
        const date = new Date(content);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
  }
  
  return null;
}

module.exports = { extractArticle };