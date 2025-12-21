const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..', '..');
const manifestPath = path.join(repoRoot, 'test', 'fixtures', 'manifest.json');

let manifestCache = null;

function loadManifest() {
  if (manifestCache) return manifestCache;
  const raw = fs.readFileSync(manifestPath, 'utf8');
  manifestCache = JSON.parse(raw);
  return manifestCache;
}

function resolveFixture(url) {
  const manifest = loadManifest();
  const entry = manifest.fixtures[url];
  if (!entry) return null;
  return {
    url,
    path: path.join(repoRoot, entry.path),
    contentType: entry.contentType || 'text/plain',
    status: entry.status || 200
  };
}

function readFixtureText(url) {
  const entry = resolveFixture(url);
  if (!entry) {
    throw new Error(`No fixture registered for ${url}`);
  }
  return fs.readFileSync(entry.path, 'utf8');
}

function readFixtureJson(url) {
  return JSON.parse(readFixtureText(url));
}

function createFixtureFetch(options = {}) {
  const onRequest = options.onRequest;
  return async function fixtureFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input && input.url;
    if (onRequest) onRequest(url, init);
    const entry = resolveFixture(url);
    if (!entry) {
      throw new Error(`No fixture registered for ${url}`);
    }
    const body = fs.readFileSync(entry.path, 'utf8');
    return {
      ok: entry.status >= 200 && entry.status < 300,
      status: entry.status,
      text: async () => body,
      json: async () => JSON.parse(body),
      headers: new Map([['content-type', entry.contentType]])
    };
  };
}

function createFixtureXmlHttpRequest() {
  return class FixtureXMLHttpRequest {
    constructor() {
      this.readyState = 0;
      this.status = 0;
      this.responseText = '';
    }

    open(method, url, async = true) {
      this.method = method;
      this.url = url;
      this.async = async !== false;
      this.readyState = 1;
    }

    send() {
      const entry = resolveFixture(this.url);
      if (!entry) {
        this.status = 404;
        this.responseText = '';
      } else {
        this.status = entry.status;
        this.responseText = fs.readFileSync(entry.path, 'utf8');
      }
      this.readyState = 4;
      if (typeof this.onreadystatechange === 'function') {
        this.onreadystatechange();
      }
      if (typeof this.onload === 'function') {
        this.onload();
      }
    }
  };
}

function installFixtureNetwork(window, options = {}) {
  window.fetch = createFixtureFetch(options);
  window.XMLHttpRequest = createFixtureXmlHttpRequest();
}

module.exports = {
  resolveFixture,
  readFixtureText,
  readFixtureJson,
  createFixtureFetch,
  createFixtureXmlHttpRequest,
  installFixtureNetwork
};
