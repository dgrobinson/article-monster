#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

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
    const outputPath = c.outputPath; // e.g., outputs/2025-08-18T12-34-56
    const fromEpub = path.join(debugCheckoutPath, outputPath, 'article.epub');
    const slug = c.slug || path.basename(outputPath);
    const toEpub = path.join(solvedDir, `${slug}.expected.epub`);
    const toJson = path.join(solvedDir, `${slug}.json`);

    if (!fs.existsSync(fromEpub)) {
      console.error('Missing article.epub at', fromEpub);
      process.exit(1);
    }

    await fsp.copyFile(fromEpub, toEpub);

    const testJson = {
      name: c.name || slug,
      url: c.url || '',
      htmlFile: `${slug}.html`,
      expectedPhrases: c.expectedPhrases || [],
      minLength: c.minLength || 0,
      notes: c.notes || 'Golden from latest-outputs-debug',
      addedDate: new Date().toISOString().slice(0,10),
      status: 'solved'
    };

    await fsp.writeFile(toJson, JSON.stringify(testJson, null, 2));
    copied++;
    console.log(`Synced golden: ${slug}`);
  }

  console.log(`Done. Synced ${copied} golden case(s).`);
}

main().catch(err => {
  console.error('sync-goldens failed:', err);
  process.exit(1);
});

