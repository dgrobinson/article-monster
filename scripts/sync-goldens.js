#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const AdmZip = require('adm-zip');
const { generateEpub } = require('../src/epubGenerator');

async function findOutputPathByMatch(debugCheckoutPath, matchToken) {
  const outputsRoot = path.join(debugCheckoutPath, 'outputs');
  if (!fs.existsSync(outputsRoot)) return null;
  const entries = await fsp.readdir(outputsRoot, { withFileTypes: true });
  const folders = entries.filter(e => e.isDirectory()).map(e => e.name);

  const token = String(matchToken).toLowerCase();
  let candidates = [];

  for (const folder of folders) {
    const folderPath = path.join(outputsRoot, folder);
    const summaryPath = path.join(folderPath, 'summary.md');
    const payloadPath = path.join(folderPath, 'payload.json');

    let haystacks = [folder.toLowerCase()];
    try {
      if (fs.existsSync(summaryPath)) {
        const s = await fsp.readFile(summaryPath, 'utf8');
        haystacks.push(s.toLowerCase());
      }
    } catch {}
    try {
      if (fs.existsSync(payloadPath)) {
        const p = await fsp.readFile(payloadPath, 'utf8');
        haystacks.push(p.toLowerCase());
      }
    } catch {}

    if (haystacks.some(h => h.includes(token))) {
      candidates.push(folder);
    }
  }

  if (candidates.length === 0) return null;
  // Prefer the lexicographically latest (timestamps sort ascending lexicographically)
  candidates.sort();
  return path.join('outputs', candidates[candidates.length - 1]);
}

function extractPlainTextFromEpub(epubPath) {
  const zip = new AdmZip(epubPath);
  const entries = zip.getEntries();
  let xhtml = '';
  entries.forEach(entry => {
    if (entry.entryName.endsWith('.xhtml') || entry.entryName.endsWith('.html')) {
      xhtml += zip.readAsText(entry);
    }
  });
  return xhtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadArticleFromPayload(payloadPath, fallbackUrl, fallbackTitle) {
  if (!fs.existsSync(payloadPath)) return null;

  try {
    const payload = JSON.parse(await fsp.readFile(payloadPath, 'utf8'));
    const article = payload.article || payload;

    if (!article || !article.content) {
      return null;
    }

    return {
      title: article.title || payload.title || fallbackTitle || fallbackUrl || 'Untitled Article',
      byline: article.byline || article.author || '',
      siteName: article.siteName || article.hostname || payload.domain || '',
      url: article.url || payload.url || fallbackUrl || '',
      publishedTime: article.publishedTime || article.published || '',
      content: article.content,
      lang: article.lang || 'en',
      extractionMethod: article.source || article.extractionMethod || payload.extractionMethod || 'unknown'
    };
  } catch (e) {
    console.warn('Could not parse payload.json:', e.message);
    return null;
  }
}

async function ensureEpub({
  fromEpub,
  toEpub,
  payloadPath,
  fallbackUrl,
  fallbackTitle
}) {
  let shouldGenerate = false;

  if (!fs.existsSync(fromEpub)) {
    shouldGenerate = true;
  } else {
    try {
      const stat = await fsp.stat(fromEpub);
      if (stat.size < 1024) {
        shouldGenerate = true;
      } else {
        new AdmZip(fromEpub);
      }
    } catch (e) {
      shouldGenerate = true;
    }
  }

  if (!shouldGenerate) {
    await fsp.copyFile(fromEpub, toEpub);
    return 'copied';
  }

  const article = await loadArticleFromPayload(payloadPath, fallbackUrl, fallbackTitle);
  if (!article) {
    throw new Error('Missing usable article payload to generate EPUB');
  }

  const epubResult = await generateEpub(article);
  await fsp.writeFile(toEpub, epubResult.buffer);
  return 'generated';
}

async function main() {
  const repoRoot = path.join(__dirname, '..');
  const manifestPath = path.join(repoRoot, 'test', 'goldens.manifest.json');
  const debugCheckoutPath = path.join(repoRoot, 'debug-goldens');
  const solvedDir = path.join(repoRoot, 'test-cases', 'solved');
  const outputsRoot = path.join(debugCheckoutPath, 'outputs');

  if (!fs.existsSync(manifestPath)) {
    console.error('goldens.manifest.json not found:', manifestPath);
    process.exit(1);
  }

  const manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.cases)) {
    console.error('Manifest missing cases array');
    process.exit(1);
  }

  if (!fs.existsSync(outputsRoot)) {
    console.warn(
      `No debug outputs folder found at ${outputsRoot}. ` +
      'Did you checkout latest-outputs-debug into debug-goldens? Skipping golden sync.'
    );
    return;
  }

  const outputEntries = await fsp.readdir(outputsRoot, { withFileTypes: true });
  const outputFolders = outputEntries.filter(entry => entry.isDirectory());
  if (outputFolders.length === 0) {
    console.warn(
      `No debug output folders found under ${outputsRoot}. ` +
      'Ensure latest-outputs-debug has outputs/ entries. Skipping golden sync.'
    );
    return;
  }

  await fsp.mkdir(solvedDir, { recursive: true });

  let copied = 0;
  for (const c of manifest.cases) {
    let outputPath = c.outputPath;
    if (!outputPath && c.match) {
      outputPath = await findOutputPathByMatch(debugCheckoutPath, c.match);
      if (!outputPath) {
        console.error('Could not find outputs folder by match:', c.match);
        process.exit(1);
      }
    }

    if (!outputPath) {
      console.error('Case requires either outputPath or match. Case:', c.slug || c.name || 'unnamed');
      process.exit(1);
    }

    const fromFolder = path.join(debugCheckoutPath, outputPath);
    const fromEpub = path.join(fromFolder, 'article.epub');
    const payloadJsonPath = path.join(fromFolder, 'payload.json');

    const slug = c.slug || path.basename(outputPath).replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const toEpub = path.join(solvedDir, `${slug}.expected.epub`);
    const toJson = path.join(solvedDir, `${slug}.json`);

    let url = c.url || '';
    if (!url && fs.existsSync(payloadJsonPath)) {
      try {
        const payload = JSON.parse(await fsp.readFile(payloadJsonPath, 'utf8'));
        url = payload.url || payload.article?.url || '';
      } catch {}
    }

    try {
      const result = await ensureEpub({
        fromEpub,
        toEpub,
        payloadPath: payloadJsonPath,
        fallbackUrl: url,
        fallbackTitle: c.name || slug
      });
      console.log(`EPUB ${result}: ${slug}`);
    } catch (e) {
      console.error('Failed to create EPUB for', slug, '-', e.message);
      process.exit(1);
    }

    try {
      extractPlainTextFromEpub(toEpub);
    } catch (e) {
      console.warn('Could not read EPUB for sanity check:', e.message);
    }

    const testJson = {
      name: c.name || slug,
      url: url,
      notes: c.notes || 'Golden from latest-outputs-debug'
    };

    if (c.htmlFile !== null) {
      testJson.htmlFile = c.htmlFile || `${slug}.html`;
    }

    if (Array.isArray(c.expectedPhrases) && c.expectedPhrases.length > 0) {
      testJson.expectedPhrases = c.expectedPhrases;
    }

    if (Number.isFinite(c.minLength)) {
      testJson.minLength = c.minLength;
    }

    await fsp.writeFile(toJson, JSON.stringify(testJson, null, 2));
    copied++;
    console.log(`Synced golden: ${slug} <- ${outputPath}`);
  }

  console.log(`Done. Synced ${copied} golden case(s).`);
}

main().catch(err => {
  console.error('sync-goldens failed:', err);
  process.exit(1);
});
