const { createTransport } = require('nodemailer');

async function sendToKindle(article) {
  try {
    console.log(`Sending to Kindle: "${article.title}"`);

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

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.KINDLE_EMAIL, // User's @kindle.com email
      subject: article.title,
      html: htmlContent,
      attachments: [{
        filename: `${sanitizeFilename(article.title)}.html`,
        content: htmlContent,
        contentType: 'text/html'
      }]
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    console.log(`Successfully sent to Kindle: ${result.messageId}`);
    
    return { success: true, messageId: result.messageId };

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
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100);
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