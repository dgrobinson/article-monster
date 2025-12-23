const http = require('http');
const https = require('https');

const allowLiveFetch = ['true', '1', 'yes'].includes(
  String(process.env.ALLOW_LIVE_FETCH || '').toLowerCase()
);

function formatTarget(args, fallbackProtocol) {
  if (!args || args.length === 0) return fallbackProtocol + '//unknown';
  const first = args[0];
  if (typeof first === 'string') return first;
  if (first && typeof first.href === 'string') return first.href;
  if (first && typeof first === 'object') {
    const protocol = first.protocol || fallbackProtocol;
    const host = first.hostname || first.host || 'unknown';
    const path = first.path || first.pathname || '/';
    return protocol + '//' + host + path;
  }
  return fallbackProtocol + '//unknown';
}

function blockNetwork(protocol, target) {
  const message = `Network access blocked in tests (${protocol} ${target}). Set ALLOW_LIVE_FETCH=true to allow live requests.`;
  const error = new Error(message);
  error.code = 'NETWORK_BLOCKED';
  throw error;
}

function wrapRequest(mod, method, protocol) {
  const original = mod[method];
  mod[method] = function wrappedRequest() {
    const target = formatTarget(arguments, protocol);
    blockNetwork(protocol.replace(':', ''), target);
  };
  mod[method]._original = original;
}

if (!allowLiveFetch) {
  wrapRequest(http, 'request', 'http:');
  wrapRequest(http, 'get', 'http:');
  wrapRequest(https, 'request', 'https:');
  wrapRequest(https, 'get', 'https:');

  if (typeof global.fetch === 'function') {
    global.fetch = function blockedFetch(input) {
      const target = typeof input === 'string' ? input : input && input.url;
      blockNetwork('fetch', target || 'unknown');
    };
  }
}

module.exports = {
  allowLiveFetch
};
