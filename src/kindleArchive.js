const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const DEFAULT_MAX_COUNT = 200;
const DEFAULT_MAX_AGE_DAYS = 30;

function getArchiveDir() {
  return process.env.KINDLE_ARCHIVE_DIR || path.join(process.cwd(), 'kindle-archive');
}

function getNumberEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name], 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getRetentionConfig() {
  return {
    maxCount: getNumberEnv('KINDLE_ARCHIVE_MAX_COUNT', DEFAULT_MAX_COUNT),
    maxAgeDays: getNumberEnv('KINDLE_ARCHIVE_MAX_AGE_DAYS', DEFAULT_MAX_AGE_DAYS)
  };
}

function slugifyTitle(title) {
  const safeTitle = (title || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return safeTitle || 'untitled';
}

function toIdTimestamp(isoTimestamp) {
  return isoTimestamp.replace(/[:.]/g, '-');
}

function getPayloadMetrics(html) {
  return {
    contentLength: html.length,
    imageCount: (html.match(/<img\b/gi) || []).length,
    hash: crypto.createHash('sha256').update(html).digest('hex')
  };
}

async function ensureArchiveDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readArchiveEntries(dir) {
  let files = [];
  try {
    files = await fs.readdir(dir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const metadataFiles = files.filter((file) => file.endsWith('.json'));
  const entries = await Promise.all(metadataFiles.map(async (file) => {
    const fullPath = path.join(dir, file);
    try {
      const raw = await fs.readFile(fullPath, 'utf8');
      const data = JSON.parse(raw);
      const id = data.id || path.basename(file, '.json');
      const timestampMs = Number.isFinite(Date.parse(data.timestamp))
        ? Date.parse(data.timestamp)
        : (await fs.stat(fullPath)).mtimeMs;
      return {
        ...data,
        id,
        _timestampMs: timestampMs,
        _metadataPath: fullPath,
        _htmlPath: path.join(dir, `${id}.html`)
      };
    } catch (error) {
      return null;
    }
  }));

  return entries
    .filter(Boolean)
    .sort((a, b) => b._timestampMs - a._timestampMs);
}

async function removeEntryFiles(entry) {
  const files = [entry._metadataPath, entry._htmlPath];
  for (const file of files) {
    try {
      await fs.unlink(file);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

async function pruneArchive(dir) {
  const { maxCount, maxAgeDays } = getRetentionConfig();
  if ((!maxCount || maxCount <= 0) && (!maxAgeDays || maxAgeDays <= 0)) {
    return { removed: 0 };
  }

  const entries = await readArchiveEntries(dir);
  const removals = new Set();

  if (maxAgeDays && maxAgeDays > 0) {
    const cutoffMs = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    entries.forEach((entry) => {
      if (entry._timestampMs < cutoffMs) {
        removals.add(entry);
      }
    });
  }

  if (maxCount && maxCount > 0 && entries.length > maxCount) {
    entries.slice(maxCount).forEach((entry) => removals.add(entry));
  }

  for (const entry of removals) {
    await removeEntryFiles(entry);
  }

  return { removed: removals.size };
}

async function storeKindlePayload({ html, title, url, hostname, metrics }) {
  if (!html) {
    throw new Error('HTML content is required for Kindle archive');
  }

  const timestamp = new Date().toISOString();
  const resolvedHostname = hostname || (() => {
    if (!url) return 'unknown-host';
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown-host';
    }
  })();

  const titleSlug = slugifyTitle(title);
  const payloadMetrics = metrics || getPayloadMetrics(html);
  const hashPrefix = payloadMetrics.hash.slice(0, 12);
  const id = `${toIdTimestamp(timestamp)}_${resolvedHostname}_${titleSlug}_${hashPrefix}`;
  const archiveDir = getArchiveDir();

  await ensureArchiveDir(archiveDir);

  const htmlPath = path.join(archiveDir, `${id}.html`);
  const metadataPath = path.join(archiveDir, `${id}.json`);

  const metadata = {
    id,
    timestamp,
    hostname: resolvedHostname,
    title: title || 'Untitled',
    titleSlug,
    url: url || null,
    hash: payloadMetrics.hash,
    contentLength: payloadMetrics.contentLength,
    imageCount: payloadMetrics.imageCount
  };

  await fs.writeFile(htmlPath, html, 'utf8');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  await pruneArchive(archiveDir);

  return metadata;
}

async function listKindlePayloads({ limit = 50 } = {}) {
  const archiveDir = getArchiveDir();
  const entries = await readArchiveEntries(archiveDir);
  return entries.slice(0, limit).map((entry) => ({
    id: entry.id,
    timestamp: entry.timestamp,
    hostname: entry.hostname,
    title: entry.title,
    titleSlug: entry.titleSlug,
    url: entry.url,
    hash: entry.hash,
    contentLength: entry.contentLength,
    imageCount: entry.imageCount
  }));
}

async function getKindlePayload(id) {
  const archiveDir = getArchiveDir();
  const htmlPath = path.join(archiveDir, `${id}.html`);
  const metadataPath = path.join(archiveDir, `${id}.json`);
  const [html, metadataRaw] = await Promise.all([
    fs.readFile(htmlPath, 'utf8'),
    fs.readFile(metadataPath, 'utf8')
  ]);
  const metadata = JSON.parse(metadataRaw);
  return { html, metadata };
}

module.exports = {
  getArchiveDir,
  getPayloadMetrics,
  storeKindlePayload,
  listKindlePayloads,
  getKindlePayload
};
