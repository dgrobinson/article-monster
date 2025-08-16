const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');

// Configure proxy agents if environment specifies one, with NO_PROXY support
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy ||
                 process.env.HTTP_PROXY || process.env.http_proxy;
const noProxyEnv = process.env.NO_PROXY || process.env.no_proxy;

const httpsProxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
const httpProxyAgent = proxyUrl ? new HttpProxyAgent(proxyUrl) : undefined;

function hostMatchesNoProxy(hostname, noProxyList) {
  if (!noProxyList) return false;
  const entries = noProxyList.split(',').map(s => s.trim()).filter(Boolean);
  if (entries.length === 0) return false;

  // If wildcard present, bypass proxy for all
  if (entries.includes('*')) return true;

  // Normalize hostname (strip port if present)
  const hostOnly = hostname.split(':')[0].toLowerCase();

  return entries.some(entryRaw => {
    const entry = entryRaw.toLowerCase();
    // Exact match
    if (hostOnly === entry) return true;
    // Leading dot means domain suffix match (e.g., .example.com matches a.example.com)
    if (entry.startsWith('.')) {
      return hostOnly.endsWith(entry);
    }
    // Suffix match without leading dot (common practice)
    if (hostOnly === entry || hostOnly.endsWith(`.${entry}`)) return true;
    return false;
  });
}

async function extractArticle(url) {
  try {
    console.log(`Fetching article from: ${url}`);
    
    // Fetch the webpage
    const { hostname } = new URL(url);
    const useProxy = Boolean(proxyUrl) && !hostMatchesNoProxy(hostname, noProxyEnv);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000,
      httpAgent: useProxy ? httpProxyAgent : undefined,
      httpsAgent: useProxy ? httpsProxyAgent : undefined,
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