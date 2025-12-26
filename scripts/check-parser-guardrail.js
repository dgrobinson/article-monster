#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const targets = [
  path.join(repoRoot, 'src', 'configFetcher.js'),
  path.join(repoRoot, 'public', 'bookmarklet.js')
];

const allowedHosts = [
  'docs.google.com',
  'drive.google.com',
  'notion.so',
  '*.notion.so',
  'slack.com',
  '*.slack.com',
  'workday.com',
  '*.workday.com',
  'myworkday.com',
  '*.myworkday.com',
  'seal-app-t4vff.ondigitalocean.app'
];

const allowedWildcardSuffixes = allowedHosts
  .filter(host => host.startsWith('*.'))
  .map(host => host.slice(1));

const allowedExactHosts = new Set(
  allowedHosts.filter(host => !host.startsWith('*.')).map(host => host.toLowerCase())
);

const knownTlds = new Set([
  'com', 'net', 'org', 'edu', 'gov', 'mil',
  'io', 'co', 'app', 'dev', 'ai', 'info', 'biz',
  'me', 'us', 'uk', 'de', 'fr', 'es', 'it', 'nl',
  'se', 'no', 'fi', 'dk', 'jp', 'kr', 'cn', 'ru',
  'br', 'in', 'au', 'ca'
]);

const stringRegex = /(['"])(?:(?!\1|\\).|\\.)*\1/g;

function isAllowedHost(hostname) {
  const host = hostname.toLowerCase();
  if (allowedExactHosts.has(host)) {
    return true;
  }
  for (const suffix of allowedWildcardSuffixes) {
    if (host.endsWith(suffix) && host !== suffix.slice(1)) {
      return true;
    }
  }
  return false;
}

function extractHostsFromString(value) {
  const hosts = new Set();
  const trimmed = value.trim();
  if (!trimmed) return hosts;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.hostname) {
        hosts.add(url.hostname.toLowerCase());
      }
    } catch {}
  }

  const hostMatch = trimmed.match(/^(?:\*\.)?([a-z0-9-]+\.)+([a-z]{2,})(?::\d+)?$/i);
  if (hostMatch) {
    const tld = hostMatch[2].toLowerCase();
    if (knownTlds.has(tld)) {
      hosts.add(trimmed.replace(/:\d+$/, '').toLowerCase());
    }
  }

  return hosts;
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split('\n').length;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];

  for (const match of content.matchAll(stringRegex)) {
    const literal = match[0];
    const value = literal.slice(1, -1);
    const hosts = extractHostsFromString(value);
    if (hosts.size === 0) {
      continue;
    }
    const line = lineNumberForIndex(content, match.index);
    for (const host of hosts) {
      if (!isAllowedHost(host)) {
        violations.push({
          file: filePath,
          line,
          host,
          literal
        });
      }
    }
  }

  return violations;
}

const allViolations = [];
for (const target of targets) {
  if (!fs.existsSync(target)) {
    console.warn('Parser guardrail skipped missing file:', target);
    continue;
  }
  allViolations.push(...scanFile(target));
}

if (allViolations.length > 0) {
  console.error('Parser guardrail violation: site-specific hostnames detected.');
  for (const violation of allViolations) {
    console.error(`- ${violation.file}:${violation.line} -> ${violation.host} (${violation.literal})`);
  }
  console.error('Remove site-specific branches or move logic into FiveFilters configs.');
  console.error('If this hostname is required for non-parser reasons, add it to the allowlist in scripts/check-parser-guardrail.js.');
  process.exit(1);
}

console.log('Parser guardrail passed: no new site-specific hostnames found.');
