const axios = require('axios');
const { extractArticle } = require('./articleExtractor');
const GitHubAuth = require('./githubAuth');
const { triggerCodexAgent } = require('./codexAgentClient');

class FailureReportError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'FailureReportError';
    this.status = status;
  }
}

function truncateText(text, limit) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.slice(0, limit - 3).trimEnd() + '...';
}

function collapseWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function formatBlock(text) {
  return text
    .split(/\r?\n/)
    .map(line => `> ${line.trimEnd()}`)
    .join('\n');
}

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') {
    return 'screenshot.png';
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return 'screenshot.png';
  }
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned.slice(0, 80) || 'screenshot.png';
}

function extractBase64Payload(source) {
  if (!source || typeof source !== 'string') {
    throw new FailureReportError('Screenshot data is missing', 400);
  }

  const trimmed = source.trim();
  const dataUrlMatch = trimmed.match(/^data:([^;,]+);base64,(.+)$/);

  if (dataUrlMatch) {
    return {
      mime: dataUrlMatch[1],
      base64: dataUrlMatch[2].replace(/\s+/g, '')
    };
  }

  return {
    mime: '',
    base64: trimmed.replace(/\s+/g, '')
  };
}

function normalizeScreenshots(rawScreenshots) {
  if (!Array.isArray(rawScreenshots) || !rawScreenshots.length) {
    return {
      screenshots: [],
      limits: {
        maxCount: parsePositiveInt(process.env.PARSE_REPORT_MAX_SCREENSHOTS, 3),
        maxBytes: parsePositiveInt(process.env.PARSE_REPORT_MAX_SCREENSHOT_BYTES, 2 * 1024 * 1024)
      }
    };
  }

  const maxCount = parsePositiveInt(process.env.PARSE_REPORT_MAX_SCREENSHOTS, 3);
  const maxBytes = parsePositiveInt(process.env.PARSE_REPORT_MAX_SCREENSHOT_BYTES, 2 * 1024 * 1024);
  const screenshots = [];

  for (const entry of rawScreenshots) {
    if (screenshots.length >= maxCount) {
      break;
    }

    if (!entry || typeof entry !== 'object') {
      continue;
    }

    let payload;
    try {
      payload = extractBase64Payload(entry.dataUrl || entry.data || '');
    } catch (error) {
      throw new FailureReportError(error.message, 400);
    }

    let buffer;
    try {
      buffer = Buffer.from(payload.base64, 'base64');
    } catch (error) {
      throw new FailureReportError('Screenshot payload is not valid base64 data', 400);
    }

    if (!buffer.length) {
      throw new FailureReportError('Screenshot payload is empty', 400);
    }

    if (buffer.length > maxBytes) {
      const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
      const safeName = sanitizeFilename(entry.name);
      throw new FailureReportError(`Screenshot "${safeName}" exceeds the ${maxMb}MB limit`, 400);
    }

    const safeName = sanitizeFilename(entry.name);
    const mimeType = entry.type && typeof entry.type === 'string' && entry.type.startsWith('image/')
      ? entry.type
      : (payload.mime && payload.mime.startsWith('image/') ? payload.mime : 'image/png');

    screenshots.push({
      name: safeName,
      type: mimeType,
      size: buffer.length,
      base64: payload.base64
    });
  }

  return {
    screenshots,
    limits: {
      maxCount,
      maxBytes
    }
  };
}

function buildIssueTitle(parsedUrl) {
  const segments = parsedUrl.pathname.split('/').filter(Boolean);
  const lastSegment = segments.length ? segments[segments.length - 1] : '';
  const slug = lastSegment ? `/${truncateText(lastSegment, 40)}` : '';
  let title = `Parse failure: ${parsedUrl.hostname}${slug}`;
  if (title.length > 120) {
    title = truncateText(title, 120);
  }
  return title;
}

function buildScreenshotSection(screenshots) {
  if (!Array.isArray(screenshots) || !screenshots.length) {
    return '_No screenshots supplied._';
  }

  const lines = screenshots.map((shot, index) => {
    const sizeKb = Math.max(1, Math.round(shot.size / 1024));
    const label = shot.name || `Screenshot ${index + 1}`;
    return `- ${label} (${shot.type || 'image'}, ~${sizeKb} KB)`;
  });

  lines.push('_Binary data is included in an automated comment below._');
  return lines.join('\n');
}

function buildIssueBody({ url, notes, analysis, screenshots }) {
  const notesSection = notes ? formatBlock(notes) : '_None provided._';

  const lines = [
    `- Analysis timestamp: ${analysis.timestamp}`,
    `- Config lookup: ${analysis.config.available ? 'Found' : 'Missing'}${analysis.config.detail ? ` (${analysis.config.detail})` : ''}`,
    `- Extraction attempt: ${analysis.extraction.success ? 'Succeeded' : 'Failed'}`
  ];

  if (analysis.extraction.success) {
    lines.push(`- Extracted title: ${analysis.extraction.title || 'n/a'}`);
    lines.push(`- Extracted length: ${analysis.extraction.contentLength || 0} characters`);
  } else if (analysis.extraction.error) {
    lines.push(`- Error: ${analysis.extraction.error}`);
  }

  let body = `## Reported URL\n${url}\n\n## Reporter Notes\n${notesSection}\n\n## Automated Analysis\n${lines.join('\n')}`;

  if (analysis.extraction.success && analysis.extraction.textPreview) {
    body += `\n\n#### Text sample\n${formatBlock(analysis.extraction.textPreview)}`;
  }

  body += `\n\n## Screenshots\n${buildScreenshotSection(screenshots)}`;

  return body;
}

function buildScreenshotComment(screenshots) {
  if (!Array.isArray(screenshots) || !screenshots.length) {
    return '';
  }

  const parts = [
    '## User Screenshots',
    '_Uploaded automatically from the parse failure form._'
  ];

  screenshots.forEach((shot, index) => {
    const label = shot.name || `Screenshot ${index + 1}`;
    const sizeKb = Math.max(1, Math.round(shot.size / 1024));
    const mimeType = shot.type || 'image/png';

    parts.push('');
    parts.push('<details>');
    parts.push(`<summary>${label} (${mimeType}, ~${sizeKb.toLocaleString()} KB)</summary>`);
    parts.push('');
    parts.push('```base64');
    parts.push(`data:${mimeType};base64,${shot.base64}`);
    parts.push('```');
    parts.push('');
    parts.push('</details>');
  });

  parts.push('');
  parts.push('> Tip: copy the base64 block into a file and decode it with `base64 --decode` to recreate the image.');

  return parts.join('\n');
}

async function analyzeUrl(url, configFetcher) {
  const parsedUrl = new URL(url);
  const analysis = {
    url,
    hostname: parsedUrl.hostname,
    timestamp: new Date().toISOString(),
    config: {
      available: false,
      detail: ''
    },
    extraction: {
      success: false,
      title: '',
      contentLength: 0,
      textPreview: '',
      error: ''
    }
  };

  if (configFetcher) {
    try {
      const config = await configFetcher.getConfigForSite(parsedUrl.hostname);
      if (config) {
        analysis.config.available = true;
        analysis.config.detail = `title rules: ${config.title?.length || 0}, body rules: ${config.body?.length || 0}, strip rules: ${config.strip?.length || 0}, preferJsonLd: ${config.preferJsonLd ? 'yes' : 'no'}`;
      } else {
        analysis.config.detail = 'No FiveFilters config found.';
      }
    } catch (error) {
      analysis.config.detail = `Config lookup failed: ${error.message}`;
    }
  } else {
    analysis.config.detail = 'Config fetcher unavailable.';
  }

  try {
    const article = await extractArticle(url);
    analysis.extraction.success = true;
    analysis.extraction.title = article.title || '';
    analysis.extraction.contentLength = article.content ? article.content.length : 0;

    if (article.textContent) {
      const preview = truncateText(collapseWhitespace(article.textContent), 400);
      analysis.extraction.textPreview = preview;
    }
  } catch (error) {
    analysis.extraction.error = error.message;
  }

  return analysis;
}

async function createIssue({ title, body, githubAuth }) {
  if (!process.env.GITHUB_REPOSITORY) {
    throw new FailureReportError('GITHUB_REPOSITORY is not configured', 500);
  }

  let headers;
  try {
    headers = await githubAuth.getAuthHeaders();
  } catch (error) {
    throw new FailureReportError(error.message, 500);
  }

  try {
    const response = await axios.post(
      `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues`,
      { title, body },
      { headers }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data && error.response.data.message ? error.response.data.message : `status ${status}`;
      throw new FailureReportError(`GitHub issue creation failed: ${detail}`, status >= 400 && status < 500 ? status : 502);
    }
    throw new FailureReportError(`GitHub issue creation failed: ${error.message}`, 502);
  }
}

async function postScreenshotComment({ githubAuth, issueNumber, screenshots }) {
  if (!Array.isArray(screenshots) || !screenshots.length) {
    return null;
  }

  if (!process.env.GITHUB_REPOSITORY) {
    throw new FailureReportError('GITHUB_REPOSITORY is not configured', 500);
  }

  let headers;
  try {
    headers = await githubAuth.getAuthHeaders();
  } catch (error) {
    throw new FailureReportError(error.message, 500);
  }

  try {
    const response = await axios.post(
      `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues/${issueNumber}/comments`,
      { body: buildScreenshotComment(screenshots) },
      { headers }
    );

    return {
      id: response.data?.id || null,
      url: response.data?.html_url || null
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data && error.response.data.message ? error.response.data.message : `status ${status}`;
      throw new FailureReportError(`Failed to attach screenshots: ${detail}`, status >= 400 && status < 500 ? status : 502);
    }
    throw new FailureReportError(`Failed to attach screenshots: ${error.message}`, 502);
  }
}

async function reportParsingIssue({ url, notes = '', screenshots = [], configFetcher }) {
  if (!url || typeof url !== 'string') {
    throw new FailureReportError('URL is required', 400);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new FailureReportError('Invalid URL provided', 400);
  }

  const githubAuth = new GitHubAuth();
  if (!githubAuth.authMethod || githubAuth.authMethod === 'ssh-deploy-key') {
    throw new FailureReportError('GitHub token or app credentials are required for issue creation', 500);
  }

  const trimmedNotes = typeof notes === 'string' ? notes.trim() : '';
  const { screenshots: normalizedScreenshots, limits } = normalizeScreenshots(Array.isArray(screenshots) ? screenshots : []);

  const analysis = await analyzeUrl(url, configFetcher);
  const attachmentSummaries = normalizedScreenshots.map(shot => ({
    name: shot.name,
    type: shot.type,
    size: shot.size
  }));

  if (attachmentSummaries.length) {
    analysis.attachments = attachmentSummaries;
  }

  const issueTitle = buildIssueTitle(parsedUrl);
  const issueBody = buildIssueBody({ url, notes: trimmedNotes, analysis, screenshots: normalizedScreenshots });
  const issue = await createIssue({ title: issueTitle, body: issueBody, githubAuth });

  const codexTask = await triggerCodexAgent({
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    notes: trimmedNotes,
    analysis
  });

  let screenshotComment = null;
  if (normalizedScreenshots.length) {
    try {
      screenshotComment = await postScreenshotComment({
        githubAuth,
        issueNumber: issue.number,
        screenshots: normalizedScreenshots
      });
    } catch (error) {
      console.error('Failed to upload screenshots:', error);
      screenshotComment = {
        error: error.message,
        status: error.status || null
      };
    }
  }

  return {
    issueNumber: issue.number,
    issueUrl: issue.html_url,
    analysis,
    codexTask,
    attachments: attachmentSummaries,
    screenshotComment,
    attachmentLimits: limits
  };
}

module.exports = {
  reportParsingIssue,
  FailureReportError
};
