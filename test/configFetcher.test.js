const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ConfigFetcher = require('../src/configFetcher');

(async () => {
  const tmpDir = path.join(__dirname, 'tmp-configs');
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, '.wildcard.com.txt'), '# test\nbody: article');

  const fetcher = new ConfigFetcher();
  fetcher.configDir = tmpDir;

  const config1 = await fetcher.getConfigForSite('alpha.wildcard.com');
  assert(config1, 'Config should load for subdomain');
  assert(fetcher.configCache.has('.wildcard.com'), 'Cache should contain wildcard entry');
  assert(fetcher.configCache.has('alpha.wildcard.com'), 'Cache should contain requested hostname');

  const config2 = await fetcher.getConfigForSite('beta.wildcard.com');
  assert(config2, 'Config should load for second subdomain');
  assert.strictEqual(config1, config2, 'Subdomains should share config object');
  assert(fetcher.configCache.has('beta.wildcard.com'), 'Cache should contain second subdomain');

  console.log('configFetcher wildcard tests passed');

  fs.rmSync(tmpDir, { recursive: true, force: true });
})();
