#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { getArchiveDir, listKindlePayloads } = require('../src/kindleArchive');

function printUsage() {
  console.log('Usage: node scripts/preview-kindle-archive.js [--latest] [--id <id>] [--file <path>]');
  console.log('Defaults to --latest when no arguments are provided.');
}

function resolvePreviewerCommand(filePath) {
  if (process.env.KINDLE_PREVIEWER_BIN) {
    return { command: process.env.KINDLE_PREVIEWER_BIN, args: [filePath] };
  }

  if (process.platform === 'darwin') {
    const appCandidates = ['Kindle Previewer 3', 'Kindle Previewer'];
    for (const appName of appCandidates) {
      const appPath = `/Applications/${appName}.app`;
      if (fs.existsSync(appPath)) {
        return { command: 'open', args: ['-a', appName, filePath] };
      }
    }
  }

  if (process.platform === 'win32') {
    const candidates = [
      'C:\\\\Program Files\\\\Amazon\\\\Kindle Previewer 3\\\\Kindle Previewer 3.exe',
      'C:\\\\Program Files (x86)\\\\Amazon\\\\Kindle Previewer 3\\\\Kindle Previewer 3.exe'
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return { command: candidate, args: [filePath] };
      }
    }
  }

  if (process.platform === 'linux') {
    const candidates = ['/usr/bin/kindlepreviewer', '/usr/local/bin/kindlepreviewer'];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return { command: candidate, args: [filePath] };
      }
    }
  }

  return null;
}

function resolveFallbackCommand(filePath) {
  if (process.platform === 'darwin') {
    return { command: 'open', args: [filePath] };
  }
  if (process.platform === 'win32') {
    return { command: 'cmd', args: ['/c', 'start', '', filePath] };
  }
  return { command: 'xdg-open', args: [filePath] };
}

async function resolveTargetPath(args) {
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const fileFlagIndex = args.indexOf('--file');
  if (fileFlagIndex !== -1) {
    const filePath = args[fileFlagIndex + 1];
    if (!filePath) {
      throw new Error('--file requires a path');
    }
    return path.resolve(filePath);
  }

  const idFlagIndex = args.indexOf('--id');
  if (idFlagIndex !== -1) {
    const id = args[idFlagIndex + 1];
    if (!id) {
      throw new Error('--id requires a payload id');
    }
    return path.join(getArchiveDir(), `${id}.html`);
  }

  const positional = args.find((arg) => !arg.startsWith('--'));
  if (positional && positional.endsWith('.html')) {
    return path.resolve(positional);
  }
  if (positional) {
    return path.join(getArchiveDir(), `${positional}.html`);
  }

  const latest = await listKindlePayloads({ limit: 1 });
  if (!latest.length) {
    throw new Error('No archived Kindle payloads found');
  }
  return path.join(getArchiveDir(), `${latest[0].id}.html`);
}

async function main() {
  const args = process.argv.slice(2);
  const targetPath = await resolveTargetPath(args);

  if (!fs.existsSync(targetPath)) {
    throw new Error(`File not found: ${targetPath}`);
  }

  const previewer = resolvePreviewerCommand(targetPath);
  const command = previewer || resolveFallbackCommand(targetPath);

  const child = spawn(command.command, command.args, { stdio: 'inherit' });
  child.on('error', (error) => {
    console.error('Failed to open preview:', error.message);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error(error.message);
  printUsage();
  process.exit(1);
});
