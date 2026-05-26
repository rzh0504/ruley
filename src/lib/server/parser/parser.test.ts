import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import {
  decodeBase64,
  parseInput,
  parseLineToProxy,
  parseRawContent,
  tryParseYaml,
} from './index';

let originalConsoleError: typeof console.error;
let originalConsoleWarn: typeof console.warn;

before(() => {
  originalConsoleError = console.error;
  originalConsoleWarn = console.warn;
  console.error = () => undefined;
  console.warn = () => undefined;
});

after(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

test('decodes padded and unpadded base64 input', () => {
  assert.equal(decodeBase64('dmxlc3M6Ly90ZXN0'), 'vless://test');
  assert.equal(decodeBase64('dmxlc3M6Ly90ZXN0='), 'vless://test');
});

test('extracts proxies from Mihomo YAML', () => {
  const proxies = tryParseYaml(`
proxies:
  - name: yaml-node
    type: ss
    server: example.com
    port: 8388
    cipher: aes-128-gcm
    password: secret
`);

  assert.equal(proxies?.length, 1);
  assert.equal(proxies?.[0].name, 'yaml-node');
});

test('parses VLESS URI into a proxy', () => {
  const proxy = parseLineToProxy('vless://uuid@example.com:443?security=tls&type=ws&path=%2Fws&host=edge.example.com#edge');

  assert.equal(proxy?.name, 'edge');
  assert.equal(proxy?.type, 'vless');
  assert.equal(proxy?.server, 'example.com');
  assert.equal(proxy?.network, 'ws');
  assert.equal(proxy?.['ws-opts'].path, '/ws');
  assert.equal(proxy?.['ws-opts'].headers.Host, 'edge.example.com');
});

test('parses base64 subscription content', () => {
  const raw = 'vless://uuid@example.com:443?security=tls#node-a';
  const encoded = Buffer.from(raw, 'utf-8').toString('base64');
  const proxies = parseRawContent(encoded);

  assert.equal(proxies.length, 1);
  assert.equal(proxies[0].name, 'node-a');
});

test('normalizes duplicate proxy names and identities', async () => {
  const first = 'vless://uuid-a@example.com:443?security=tls#same-name';
  const renamed = 'vless://uuid-b@example.org:443?security=tls#same-name';
  const duplicate = 'vless://uuid-a@example.com:443?security=tls#duplicate-name';

  const result = await parseInput([first, renamed, duplicate].join('\n'));

  assert.equal(result.proxies.length, 2);
  assert.equal(result.proxies[0].name, 'same-name');
  assert.equal(result.proxies[1].name, 'same-name #2');
  assert.equal(result.diagnostics.some(item => item.type === 'duplicate'), true);
  assert.equal(result.diagnostics.some(item => item.type === 'renamed'), true);
});

test('returns structured errors for invalid direct proxy URIs', async () => {
  const result = await parseInput('vmess://not-json');

  assert.equal(result.proxies.length, 0);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].code, 'proxy_uri_parse_failed');
  assert.equal(result.errors[0].kind, 'input');
  assert.equal(result.errors[0].severity, 'error');
  assert.equal(result.errors[0].source, 'direct');
  assert.equal(result.errors[0].error, result.errors[0].message);
});

test('returns structured subscription URL validation errors', async () => {
  const result = await parseInput('http://example.com/sub');

  assert.equal(result.proxies.length, 0);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].code, 'subscription_url_insecure');
  assert.equal(result.errors[0].kind, 'subscription');
  assert.equal(result.errors[0].source, 'subscription');
  assert.equal(result.errors[0].url, 'http://example.com/sub');
});

test('blocks localhost subscription URLs with a granular error code', async () => {
  const result = await parseInput('https://localhost/sub');

  assert.equal(result.proxies.length, 0);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].code, 'subscription_url_private_address');
  assert.equal(result.errors[0].kind, 'subscription');
});

test('reports subscription URL limit before truncating work', async () => {
  const input = Array.from({ length: 11 }, (_, index) => `http://example.com/sub-${index}`).join('\n');
  const result = await parseInput(input);

  assert.equal(result.errors.some(error => error.code === 'subscription_url_limit_exceeded'), true);
  assert.equal(result.errors.filter(error => error.code === 'subscription_url_insecure').length, 10);
});
