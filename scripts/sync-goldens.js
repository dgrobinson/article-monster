#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

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

async function main() {
  const repoRoot = path.join(__dirname, '..');
  const manifestPath = path.join(repoRoot, 'test', 'goldens.manifest.json');
  const debugCheckoutPath = path.join(repoRoot, 'debug-goldens');
  const solvedDir = path.join(repoRoot, 'test-cases', 'solved');

  if (!fs.existsSync(manifestPath)) {
    console.error('goldens.manifest.json not found:', manifestPath);
    process.exit(1);
  }

  const manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.cases)) {
    console.error('Manifest missing cases array');
    process.exit(1);
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

    if (!fs.existsSync(fromEpub)) {
      console.error('Missing article.epub at', fromEpub);
      process.exit(1);
    }

    await fsp.copyFile(fromEpub, toEpub);

    let url = c.url || '';
    if (!url && fs.existsSync(payloadJsonPath)) {
      try {
        const payload = JSON.parse(await fsp.readFile(payloadJsonPath, 'utf8'));
        url = payload.url || payload.article?.url || '';
      } catch {}
    }

    const testJson = {
      name: c.name || slug,
      url: url,
      htmlFile: `${slug}.html`,
      expectedPhrases: c.expectedPhrases || [],
      minLength: c.minLength || 0,
      notes: c.notes || 'Golden from latest-outputs-debug',
      addedDate: new Date().toISOString().slice(0,10),
      status: 'solved'
    };

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

