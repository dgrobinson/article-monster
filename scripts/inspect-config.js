#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const ConfigFetcher = require('../src/configFetcher');

function printUsage() {
  console.log(`Usage:
  node scripts/inspect-config.js --hostname <example.com> [--json] [--compact]
  node scripts/inspect-config.js --file <path-to-config> [--json] [--compact]

Flags:
  --hostname  Site hostname (uses site-configs/<hostname>.txt)
  --file      Path to a config file to inspect
  --json      Output JSON only (default is human-readable)
  --compact   Output compact JSON (implies --json)
  --help      Show this help
`);
}

function parseArgs(argv) {
  const args = {
    hostname: null,
    file: null,
    json: false,
    compact: false,
    help: false,
    unknown: []
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--json') {
      args.json = true;
      continue;
    }

    if (arg === '--compact') {
      args.compact = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }

    if (arg === '--hostname') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        args.unknown.push(arg);
      } else {
        args.hostname = value;
        i++;
      }
      continue;
    }

    if (arg.startsWith('--hostname=')) {
      args.hostname = arg.split('=').slice(1).join('=');
      continue;
    }

    if (arg === '--file') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        args.unknown.push(arg);
      } else {
        args.file = value;
        i++;
      }
      continue;
    }

    if (arg.startsWith('--file=')) {
      args.file = arg.split('=').slice(1).join('=');
      continue;
    }

    args.unknown.push(arg);
  }

  if (args.compact) {
    args.json = true;
  }

  return args;
}

function collectUnrecognizedDirectives(configText, schema) {
  const known = new Set([
    ...(schema.multi || []),
    ...(schema.boolean || []),
    ...(schema.string || []),
    ...(schema.legacy || [])
  ]);
  const parameterized = new Set(schema.parameterized || []);
  const warnings = [];

  const lines = configText.split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      warnings.push({
        line: idx + 1,
        directive: trimmed,
        reason: 'missing colon',
        raw: trimmed
      });
      return;
    }

    const command = trimmed.substring(0, colonIndex).trim();
    if (!command) {
      warnings.push({
        line: idx + 1,
        directive: '',
        reason: 'missing directive',
        raw: trimmed
      });
      return;
    }

    let recognized = false;
    if (known.has(command)) {
      recognized = true;
    } else if (command.endsWith(')')) {
      const match = command.match(/^([a-z0-9_]+)\((.*?)\)$/i);
      if (match && parameterized.has(match[1])) {
        recognized = true;
      }
    }

    if (!recognized) {
      warnings.push({
        line: idx + 1,
        directive: command,
        reason: 'unrecognized directive',
        raw: trimmed
      });
    }
  });

  return warnings;
}

function collectEmptyArrays(parsedConfig) {
  if (!parsedConfig) return [];
  const empty = [];
  for (const key of Object.keys(parsedConfig)) {
    const value = parsedConfig[key];
    if (Array.isArray(value) && value.length === 0) {
      empty.push(key);
    }
  }
  return empty;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    return;
  }

  if (args.unknown.length > 0) {
    console.error('Unknown or incomplete arguments:', args.unknown.join(' '));
    printUsage();
    process.exit(1);
  }

  if ((args.hostname && args.file) || (!args.hostname && !args.file)) {
    console.error('Provide exactly one of --hostname or --file.');
    printUsage();
    process.exit(1);
  }

  const repoRoot = path.join(__dirname, '..');
  let hostname = args.hostname ? args.hostname.trim() : null;
  let filePath = null;

  if (hostname) {
    hostname = hostname.replace(/^www\./, '');
    filePath = path.join(repoRoot, 'site-configs', `${hostname}.txt`);
  } else {
    filePath = path.resolve(process.cwd(), args.file);
  }

  if (!fs.existsSync(filePath)) {
    console.error('Config file not found:', filePath);
    process.exit(1);
  }

  const configText = await fsp.readFile(filePath, 'utf8');
  const configFetcher = new ConfigFetcher();
  const parsedConfig = configFetcher.parseFtrConfig(configText, { requireBody: false });
  const bodyRulesPresent = parsedConfig.body.length > 0;

  const schema = ConfigFetcher.SUPPORTED_DIRECTIVES || {};
  const unrecognizedDirectives = collectUnrecognizedDirectives(configText, schema);
  const emptyArrays = collectEmptyArrays(parsedConfig);

  const report = {
    source: {
      hostname: hostname,
      file: filePath
    },
    warnings: {
      unrecognizedDirectives: unrecognizedDirectives,
      emptyArrays: emptyArrays
    },
    bodyRulesPresent: bodyRulesPresent,
    config: parsedConfig
  };

  if (args.json) {
    const indent = args.compact ? 0 : 2;
    process.stdout.write(`${JSON.stringify(report, null, indent)}\n`);
    return;
  }

  console.log(`Config file: ${filePath}`);
  if (hostname) {
    console.log(`Hostname: ${hostname}`);
  }
  console.log(`Body rules present: ${bodyRulesPresent ? 'yes' : 'no'}`);

  if (unrecognizedDirectives.length > 0) {
    console.log('\nWarnings: unrecognized directives');
    unrecognizedDirectives.forEach(warning => {
      console.log(`- line ${warning.line}: ${warning.raw}`);
    });
  }

  if (emptyArrays.length > 0) {
    console.log('\nWarnings: empty arrays');
    console.log(`- ${emptyArrays.join(', ')}`);
  }

  console.log('\nParsed config:');
  console.log(JSON.stringify(parsedConfig, null, 2));
}

main().catch(error => {
  console.error('inspect-config failed:', error.message);
  process.exit(1);
});
