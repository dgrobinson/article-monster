const Epub = require('epub-gen');
const path = require('path');
const fs = require('fs').promises;

async function generateEpub(article) {
  try {
    console.log(`Generating EPUB for: "${article.title}"`);
    
    // Log detailed article structure for comparison
    console.log('EPUB Generation - Input Article:', JSON.stringify({
      title: article.title,
      byline: article.byline,
      siteName: article.siteName,
      url: article.url,
      publishedTime: article.publishedTime,
      contentLength: article.content?.length || 0,
      hasImages: article.content?.includes('<img') || false,
      lang: article.lang
    }, null, 2));

    const filename = `${sanitizeFilename(article.title)}.epub`;
    const outputPath = path.join('/tmp', filename);
    
    console.log('EPUB Generation - Filename:', filename);
    console.log('EPUB Generation - Output path:', outputPath);
    
    const options = {
      title: article.title,
      author: article.byline || 'Unknown Author',
      publisher: article.siteName || 'Robinsonian Article Monster',
      output: outputPath,
      cover: null, // We could add cover generation later
      appendChapterTitles: false, // Don't add automatic h1 titles
      css: `
        body {
          font-family: Georgia, serif;
          line-height: 1.6;
          color: #333;
          margin: 2em;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 0.5em;
          margin-bottom: 1em;
        }
        .meta {
          color: #7f8c8d;
          font-size: 0.9em;
          margin-bottom: 2em;
          padding: 1em;
          background-color: #f8f9fa;
          border-left: 4px solid #3498db;
        }
        .content p {
          margin-bottom: 1em;
          text-align: justify;
        }
        .content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 2em auto;
        }
        .source {
          margin-top: 3em;
          padding-top: 2em;
          border-top: 1px solid #ecf0f1;
          font-size: 0.9em;
          color: #7f8c8d;
          text-align: center;
        }
      `,
      content: createEpubChapters(article),
      tempDir: '/tmp',
      verbose: false
    };

    // Generate EPUB
    const epub = new Epub(options);
    
    await epub.promise;
    
    // Read the generated file
    const epubBuffer = await fs.readFile(outputPath);
    
    // Clean up temp file
    try {
      await fs.unlink(outputPath);
    } catch (e) {
      console.warn('Could not clean up temp EPUB file:', e.message);
    }

    console.log(`Successfully generated EPUB: "${article.title}"`);
    console.log('EPUB Generation - Stats:', {
      filename: filename,
      sizeKB: (epubBuffer.length / 1024).toFixed(2),
      sizeBytes: epubBuffer.length
    });
    
    // Save a copy for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      const debugPath = path.join('/tmp', `debug_${Date.now()}_${filename}`);
      await fs.writeFile(debugPath, epubBuffer);
      console.log('EPUB Generation - Debug copy saved to:', debugPath);
    }
    
    return {
      filename,
      buffer: epubBuffer,
      size: epubBuffer.length
    };

  } catch (error) {
    console.error('EPUB generation failed:', error.message);
    throw new Error(`EPUB generation failed: ${error.message}`);
  }
}

function createEpubChapters(article) {
  // Check if content has multiple sections
  var hasMultipleSections = article.content && article.content.includes('content-section');
  
  if (hasMultipleSections) {
    return createMultiChapterEpub(article);
  } else {
    return createSingleChapterEpub(article);
  }
}

function createMultiChapterEpub(article) {
  var chapters = [];
  
  // Add introduction chapter with metadata
  chapters.push({
    title: 'Article Information',
    data: createMetadataChapter(article)
  });
  
  // Simple regex-based section parsing (avoid JSDOM dependency)
  var sectionRegex = /<section[^>]*class="content-section"[^>]*>(.*?)<\/section>/gs;
  var sections = [];
  var match;
  
  while ((match = sectionRegex.exec(article.content)) !== null) {
    sections.push(match[1]);
  }
  
  if (sections.length > 0) {
    sections.forEach(function(sectionContent, index) {
      // Extract title from first header in section
      var headerMatch = sectionContent.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
      var title = headerMatch ? headerMatch[1].replace(/<[^>]*>/g, '').trim() : `Section ${index + 1}`;
      
      chapters.push({
        title: title,
        data: `<div class="content">${sectionContent}</div>`
      });
    });
  } else {
    // Fallback to single chapter
    chapters.push({
      title: article.title,
      data: createMainContent(article)
    });
  }
  
  // Add source information as final chapter
  chapters.push({
    title: 'Source Information',
    data: createSourceChapter(article)
  });
  
  return chapters;
}

function createSingleChapterEpub(article) {
  return [
    {
      title: article.title,
      data: createEpubContent(article)
    }
  ];
}

function createEpubContent(article) {
  return `
    <h1>${escapeHtml(article.title)}</h1>
    
    <div class="meta">
      <p><strong>Source:</strong> ${escapeHtml(article.siteName)}</p>
      <p><strong>Author:</strong> ${escapeHtml(article.byline)}</p>
      <p><strong>Published:</strong> ${formatDate(article.publishedTime)}</p>
      <p><strong>Reading time:</strong> ~${Math.ceil(article.length / 200)} minutes</p>
      ${article.hasImages ? '<p><strong>Images:</strong> Included</p>' : ''}
    </div>

    <div class="content">
      ${article.content}
    </div>

    <div class="source">
      <p><strong>Original URL:</strong><br>
      <a href="${article.url}">${article.url}</a></p>
      <p><em>Generated by Robinsonian Article Monster</em></p>
    </div>
  `;
}

function createMetadataChapter(article) {
  return `
    <h1>Article Information</h1>
    
    <div class="meta">
      <p><strong>Title:</strong> ${escapeHtml(article.title)}</p>
      <p><strong>Source:</strong> ${escapeHtml(article.siteName)}</p>
      <p><strong>Author:</strong> ${escapeHtml(article.byline)}</p>
      <p><strong>Published:</strong> ${formatDate(article.publishedTime)}</p>
      <p><strong>Reading time:</strong> ~${Math.ceil(article.length / 200)} minutes</p>
      <p><strong>Language:</strong> ${article.lang || 'en'}</p>
      ${article.hasImages ? '<p><strong>Images:</strong> Included in content</p>' : '<p><strong>Images:</strong> None detected</p>'}
      <p><strong>Content Length:</strong> ${(article.length || 0).toLocaleString()} characters</p>
    </div>
    
    ${article.excerpt ? `<div class="excerpt"><h2>Summary</h2><p>${escapeHtml(article.excerpt)}</p></div>` : ''}
  `;
}

function createMainContent(article) {
  return `
    <div class="content">
      ${article.content}
    </div>
  `;
}

function createSourceChapter(article) {
  return `
    <h1>Source Information</h1>
    
    <div class="source">
      <p><strong>Original URL:</strong><br>
      <a href="${article.url}">${article.url}</a></p>
      
      <p><strong>Extracted:</strong> ${new Date().toLocaleString()}</p>
      
      <p><strong>Service:</strong> Robinsonian Article Monster</p>
      
      <p><em>This article was automatically extracted and formatted for reading. 
      For the most up-to-date version, please visit the original URL above.</em></p>
    </div>
  `;
}

function sanitizeFilename(filename) {
  // Preserve proper capitalization, special characters, and use hyphens for readability
  var baseFilename = filename
    .trim()
    .replace(/[<>:"/\\|?*]/g, '') // Remove filesystem-unsafe characters only
    .replace(/\s+/g, '-') // Replace spaces with hyphens  
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 80); // Leave room for unique suffix
  
  // Generate unique 8-character suffix like FiveFilters (timestamp + random)
  var timestamp = Date.now().toString(36); // Base36 encoding
  var random = Math.random().toString(36).substring(2, 5); // 3 random chars
  var uniqueId = (timestamp + random).substring(0, 8).toUpperCase();
  
  return baseFilename + '_' + uniqueId;
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

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Unknown';
  }
}

module.exports = { generateEpub };