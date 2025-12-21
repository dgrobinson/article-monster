const { createTransport } = require('nodemailer');
const { getPayloadMetrics, storeKindlePayload } = require('./kindleArchive');

async function sendToKindle(article, debugLogger = null) {
  try {
    const log = (category, message, data) => {
      if (debugLogger) debugLogger.log(category, message, data);
      else console.log(`[${category}] ${message}`, data);
    };

    log('kindle', `Sending to Kindle: "${article.title}"`);

    // Log detailed input for comparison with FiveFilters
    log('kindle', 'Article metadata', {
      title: article.title,
      byline: article.byline,
      siteName: article.siteName,
      url: article.url,
      publishedTime: article.publishedTime,
      contentLength: article.content?.length || 0,
      hasImages: article.content?.includes('<img') || false
    });

    // Create email transporter (will need to be configured with environment variables)
    const transporter = createTransport({
      service: 'gmail', // or your preferred email service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Create clean HTML content for Kindle
    const htmlContent = createKindleHTML(article);
    const payloadMetrics = getPayloadMetrics(htmlContent);

    log('kindle', 'Kindle payload metrics', {
      contentLength: payloadMetrics.contentLength,
      imageCount: payloadMetrics.imageCount,
      hash: payloadMetrics.hash
    });

    let archiveMetadata = null;
    let archiveHostname = null;
    if (article.url) {
      try {
        archiveHostname = new URL(article.url).hostname;
      } catch {
        archiveHostname = null;
      }
    }
    try {
      archiveMetadata = await storeKindlePayload({
        html: htmlContent,
        title: article.title,
        url: article.url,
        hostname: archiveHostname || undefined,
        metrics: payloadMetrics
      });
      log('kindle', 'Kindle payload archived', {
        id: archiveMetadata.id,
        hash: archiveMetadata.hash
      });
    } catch (error) {
      log('kindle', 'Kindle payload archive failed', { error: error.message });
    }

    // Email options
    const sanitizedFilename = `${sanitizeFilename(article.title)}.html`;
    log('kindle', 'Email preparation', {
      filename: sanitizedFilename,
      contentSizeKB: (htmlContent.length / 1024).toFixed(2)
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.KINDLE_EMAIL, // User's @kindle.com email
      subject: article.title,
      html: htmlContent,
      attachments: [{
        filename: sanitizedFilename,
        content: htmlContent,
        contentType: 'text/html'
      }]
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    log('kindle', 'Successfully sent to Kindle', {
      messageId: result.messageId,
      filename: sanitizedFilename,
      subject: article.title,
      sizekB: (htmlContent.length / 1024).toFixed(2)
    });

    return {
      success: true,
      messageId: result.messageId,
      emailContent: htmlContent,
      archive: archiveMetadata
    };

  } catch (error) {
    console.error('Failed to send to Kindle:', error.message);
    throw new Error(`Kindle sending failed: ${error.message}`);
  }
}

function createKindleHTML(article) {
  return `
<!DOCTYPE html>
<html lang="${article.lang || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(article.title)}</title>
    <style>
        body {
            font-family: Georgia, serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .meta {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
        }
        .content {
            font-size: 1.1em;
            line-height: 1.8;
        }
        .content p {
            margin-bottom: 1em;
        }
        .content img {
            max-width: 100%;
            height: auto;
            margin: 20px 0;
        }
        .source {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
            font-size: 0.9em;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <h1>${escapeHtml(article.title)}</h1>
    
    <div class="meta">
        <strong>Source:</strong> ${escapeHtml(article.siteName)}<br>
        <strong>Author:</strong> ${escapeHtml(article.byline)}<br>
        <strong>Published:</strong> ${formatDate(article.publishedTime)}<br>
        <strong>Reading time:</strong> ~${Math.ceil(article.length / 200)} minutes
    </div>

    <div class="content">
        ${article.content}
    </div>

    <div class="source">
        <p><strong>Original URL:</strong> <a href="${article.url}">${article.url}</a></p>
        <p>Sent via Article Bookmarklet Service</p>
    </div>
</body>
</html>`;
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

module.exports = { sendToKindle };
