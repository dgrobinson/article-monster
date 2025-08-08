const axios = require('axios');
const { generateEpub } = require('./epubGenerator');

async function sendToZotero(article) {
  try {
    console.log(`Sending to Zotero: "${article.title}"`);

    // Get environment variables for Zotero API
    const userId = process.env.ZOTERO_USER_ID;
    const apiKey = process.env.ZOTERO_API_KEY;
    const testCollection = process.env.ZOTERO_TEST_COLLECTION; // Optional: specific test collection

    if (!userId || !apiKey) {
      throw new Error('Zotero credentials not configured (ZOTERO_USER_ID and ZOTERO_API_KEY required)');
    }

    // Base API URL
    const baseUrl = `https://api.zotero.org/users/${userId}`;
    
    // Headers for all requests
    const headers = {
      'Zotero-API-Key': apiKey,
      'Content-Type': 'application/json'
    };

    // Step 1: Create the main item (webpage)
    const mainItem = createZoteroItem(article);
    
    console.log('Creating Zotero item...');
    const itemResponse = await axios.post(`${baseUrl}/items`, [mainItem], { headers });
    
    if (!itemResponse.data.successful || itemResponse.data.successful.length === 0) {
      throw new Error('Failed to create Zotero item: ' + JSON.stringify(itemResponse.data));
    }

    const itemKey = itemResponse.data.successful[0].key;
    console.log(`Successfully created Zotero item with key: ${itemKey}`);

    // Step 2: Generate and attach EPUB (non-fatal if fails)
    let attachmentKey = null;
    try {
      console.log('Generating EPUB for Zotero attachment...');
      const epub = await generateEpub(article);
      
      // Step 3: Upload EPUB as attachment
      console.log('Uploading EPUB attachment to Zotero...');
      attachmentKey = await uploadAttachment(baseUrl, headers, itemKey, epub, article);
    } catch (attachmentError) {
      console.warn('EPUB attachment failed (item still created):', attachmentError.message);
      // Don't throw - the main item was successfully created
    }
    
    // Step 4: Optionally add to test collection
    if (testCollection) {
      console.log(`Adding item to collection: ${testCollection}`);
      await addToCollection(baseUrl, headers, itemKey, testCollection);
    }

    const message = attachmentKey 
      ? `item ${itemKey}, attachment ${attachmentKey}`
      : `item ${itemKey} (attachment failed)`;
    console.log(`Successfully sent to Zotero: ${message}`);
    
    return {
      success: true,
      itemKey: itemKey,
      attachmentKey: attachmentKey,
      url: `https://www.zotero.org/groups/library/items/${itemKey}`
    };

  } catch (error) {
    console.error('Failed to send to Zotero:', error.message);
    
    // Log more details for debugging
    if (error.response) {
      console.error('Zotero API Error:', error.response.status, error.response.data);
    }
    
    throw new Error(`Zotero sending failed: ${error.message}`);
  }
}

function createZoteroItem(article) {
  // Create a Zotero item of type "webpage"
  return {
    itemType: 'webpage',
    title: article.title || 'Untitled Article',
    creators: article.byline ? [{ creatorType: 'author', name: article.byline }] : [],
    url: article.url,
    websiteTitle: article.siteName || extractSiteFromUrl(article.url),
    date: formatZoteroDate(article.publishedTime),
    abstractNote: article.excerpt || '',
    language: article.lang || 'en',
    accessDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    extra: `Extracted via Article Bookmarklet\\nLength: ${article.length} characters\\nExtracted: ${article.extractedAt || new Date().toISOString()}`,
    tags: [
      { tag: 'article-bookmarklet', type: 1 },
      { tag: 'web-article', type: 1 }
    ]
  };
}

async function uploadAttachment(baseUrl, headers, parentKey, epub, article) {
  try {
    // Step 1: Register the attachment
    const attachmentItem = {
      itemType: 'attachment',
      parentItem: parentKey,
      linkMode: 'imported_file',
      title: `${article.title} (EPUB)`,
      filename: epub.filename,
      contentType: 'application/epub+zip',
      tags: [{ tag: 'epub', type: 1 }]
    };

    const attachmentResponse = await axios.post(`${baseUrl}/items`, [attachmentItem], { headers });
    
    if (!attachmentResponse.data.successful || attachmentResponse.data.successful.length === 0) {
      throw new Error('Failed to register attachment: ' + JSON.stringify(attachmentResponse.data));
    }

    const attachmentKey = attachmentResponse.data.successful[0].key;

    // Step 2: Get upload authorization
    const uploadHeaders = {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded',
      'If-None-Match': '*'
    };

    const authResponse = await axios.post(
      `${baseUrl}/items/${attachmentKey}/file`,
      `md5=${generateMD5(epub.buffer)}&filename=${encodeURIComponent(epub.filename)}&filesize=${epub.size}&mtime=${Date.now()}`,
      { headers: uploadHeaders }
    );

    // Step 3: Upload the file
    if (authResponse.data.exists) {
      console.log('File already exists in Zotero');
      return attachmentKey;
    }

    const uploadUrl = authResponse.data.url;
    const uploadParams = authResponse.data.params || {};
    
    console.log('Upload auth response:', {
      exists: authResponse.data.exists,
      url: uploadUrl ? 'present' : 'missing',
      params: uploadParams ? Object.keys(uploadParams).length + ' params' : 'missing'
    });

    // Create form data for upload
    const FormData = require('form-data');
    const form = new FormData();
    
    // Add all required parameters
    if (uploadParams && typeof uploadParams === 'object') {
      Object.keys(uploadParams).forEach(key => {
        form.append(key, uploadParams[key]);
      });
    }
    
    // Add file
    form.append('file', epub.buffer, {
      filename: epub.filename,
      contentType: 'application/epub+zip'
    });

    await axios.post(uploadUrl, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // Step 4: Register upload
    await axios.post(`${baseUrl}/items/${attachmentKey}/file`, 'upload=' + authResponse.data.uploadKey, {
      headers: uploadHeaders
    });

    console.log(`Successfully uploaded EPUB attachment: ${attachmentKey}`);
    return attachmentKey;

  } catch (error) {
    console.error('Attachment upload failed:', error.message);
    throw error;
  }
}

async function addToCollection(baseUrl, headers, itemKey, collectionKey) {
  try {
    console.log(`Adding item to collection: ${collectionKey}`);
    
    await axios.patch(`${baseUrl}/collections/${collectionKey}/items`, itemKey, {
      headers: {
        ...headers,
        'Content-Type': 'text/plain'
      }
    });
    
    console.log('Successfully added to collection');
  } catch (error) {
    console.warn('Failed to add to collection (continuing anyway):', error.message);
  }
}

function extractSiteFromUrl(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'Unknown Site';
  }
}

function formatZoteroDate(dateString) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return '';
  }
}

function generateMD5(buffer) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(buffer).digest('hex');
}

module.exports = { sendToZotero };