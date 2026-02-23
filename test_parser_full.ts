import { parseInput, parseLineToProxy, decodeBase64 } from './src/server/parser/index.js';
import express from 'express';

// ============================================================================
// Test Helpers
// ============================================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ============================================================================
// Test Data
// ============================================================================

// VMess: standard v2rayN format
const vmessConfig = {
  v: '2', ps: 'Test VMess', add: '1.2.3.4', port: '443',
  id: 'a3482e88-686a-4a58-8126-7c3b0e2e1b3a', aid: '0',
  scy: 'auto', net: 'ws', type: 'none', host: 'example.com',
  path: '/ws', tls: 'tls', sni: 'example.com',
};
const vmessLink = 'vmess://' + Buffer.from(JSON.stringify(vmessConfig)).toString('base64');

// VLess
const vlessLink = 'vless://a3482e88-686a-4a58-8126-7c3b0e2e1b3a@1.2.3.4:443?security=tls&sni=example.com&type=ws&host=example.com&path=%2Fws#Test%20VLess';

// Trojan
const trojanLink = 'trojan://password123@1.2.3.4:443?sni=example.com&type=ws&path=%2Fws&host=example.com#Test%20Trojan';

// Shadowsocks (SIP002 with base64 userinfo)
const ssUserInfo = Buffer.from('aes-256-gcm:testpassword').toString('base64').replace(/=+$/, '');
const ssLink = `ss://${ssUserInfo}@1.2.3.4:8388#Test%20SS`;

// Shadowsocks (legacy, entire body base64)
const ssLegacyBody = 'aes-256-gcm:testpassword@1.2.3.4:8388';
const ssLegacyLink = `ss://${Buffer.from(ssLegacyBody).toString('base64')}#Test%20SS%20Legacy`;

// SSR
const ssrBody = '1.2.3.4:8388:origin:aes-256-cfb:plain:' + Buffer.from('testpassword').toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const ssrParams = `remarks=${Buffer.from('Test SSR').toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
const ssrLink = 'ssr://' + Buffer.from(`${ssrBody}/?${ssrParams}`).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

// Hysteria2
const hy2Link = 'hy2://password123@1.2.3.4:443?sni=example.com&insecure=1#Test%20Hy2';

// Hysteria v1
const hyLink = 'hysteria://1.2.3.4:443?auth=password123&peer=example.com&insecure=1&upmbps=100&downmbps=200&alpn=h3#Test%20Hysteria';

// TUIC
const tuicLink = 'tuic://a3482e88-686a-4a58-8126-7c3b0e2e1b3a:password123@1.2.3.4:443?sni=example.com&congestion_control=bbr&alpn=h3#Test%20TUIC';

// WireGuard
const wgLink = 'wireguard://privatekey123@1.2.3.4:51820?publickey=pubkey123&address=10.0.0.1&reserved=1,2,3#Test%20WireGuard';

// Snell
const snellLink = 'snell://psk123@1.2.3.4:443?version=3&obfs=tls&obfs-host=example.com#Test%20Snell';

// YAML content
const yamlContent = `
proxies:
  - name: "yaml-ss1"
    type: ss
    server: 1.2.3.4
    port: 443
    cipher: aes-256-gcm
    password: testpassword
    udp: true
  - name: "yaml-vmess1"
    type: vmess
    server: 5.6.7.8
    port: 443
    uuid: a3482e88-686a-4a58-8126-7c3b0e2e1b3a
    alterId: 0
    cipher: auto
`;

// Legacy Clash YAML with "Proxy" key
const legacyYaml = `
Proxy:
  - name: "legacy-ss1"
    type: ss
    server: 1.2.3.4
    port: 8388
    cipher: aes-256-gcm
    password: testpassword
`;

// ============================================================================
// Run Tests
// ============================================================================

async function runTests() {
  // --- Individual Protocol Parsers ---
  console.log('\n📋 Individual Protocol Parsers:');

  const vmess = parseLineToProxy(vmessLink);
  assert(vmess !== null && vmess.type === 'vmess', 'VMess parse', vmess ? `name=${vmess.name}` : 'null');
  assert(vmess?.server === '1.2.3.4', 'VMess server');
  assert(vmess?.network === 'ws', 'VMess ws network');

  const vless = parseLineToProxy(vlessLink);
  assert(vless !== null && vless.type === 'vless', 'VLess parse', vless ? `name=${vless.name}` : 'null');
  assert(vless?.server === '1.2.3.4', 'VLess server');
  assert(vless?.tls === true, 'VLess TLS');

  const trojan = parseLineToProxy(trojanLink);
  assert(trojan !== null && trojan.type === 'trojan', 'Trojan parse', trojan ? `name=${trojan.name}` : 'null');
  assert(trojan?.password === 'password123', 'Trojan password');

  const ss = parseLineToProxy(ssLink);
  assert(ss !== null && ss.type === 'ss', 'SS (SIP002) parse', ss ? `name=${ss.name}, cipher=${ss.cipher}` : 'null');
  assert(ss?.cipher === 'aes-256-gcm', 'SS cipher');
  assert(ss?.password === 'testpassword', 'SS password');

  const ssLegacy = parseLineToProxy(ssLegacyLink);
  assert(ssLegacy !== null && ssLegacy.type === 'ss', 'SS (legacy) parse', ssLegacy ? `name=${ssLegacy.name}` : 'null');

  const ssr = parseLineToProxy(ssrLink);
  assert(ssr !== null && ssr.type === 'ssr', 'SSR parse', ssr ? `name=${ssr.name}, server=${ssr.server}` : 'null');
  assert(ssr?.server === '1.2.3.4', 'SSR server');

  const hy2 = parseLineToProxy(hy2Link);
  assert(hy2 !== null && hy2.type === 'hysteria2', 'Hysteria2 parse', hy2 ? `name=${hy2.name}` : 'null');
  assert(hy2?.password === 'password123', 'Hy2 password');

  const hy = parseLineToProxy(hyLink);
  assert(hy !== null && hy.type === 'hysteria', 'Hysteria v1 parse', hy ? `name=${hy.name}` : 'null');

  const tuic = parseLineToProxy(tuicLink);
  assert(tuic !== null && tuic.type === 'tuic', 'TUIC parse', tuic ? `name=${tuic.name}` : 'null');
  assert(tuic?.uuid === 'a3482e88-686a-4a58-8126-7c3b0e2e1b3a', 'TUIC uuid');

  const wg = parseLineToProxy(wgLink);
  assert(wg !== null && wg.type === 'wireguard', 'WireGuard parse', wg ? `name=${wg.name}` : 'null');
  assert(wg?.['public-key'] === 'pubkey123', 'WG public key');

  const snell = parseLineToProxy(snellLink);
  assert(snell !== null && snell.type === 'snell', 'Snell parse', snell ? `name=${snell.name}` : 'null');
  assert(snell?.version === 3, 'Snell version');

  // --- Unified Input: Multi-line proxy URIs ---
  console.log('\n📋 Unified Input — Multi-line Proxy URIs:');

  const multiInput = [vmessLink, ssLink, trojanLink, vlessLink, hy2Link].join('\n');
  const multiResult = await parseInput(multiInput);
  assert(multiResult.proxies.length === 5, `Multi-line URIs: got ${multiResult.proxies.length} proxies`);
  assert(multiResult.errors.length === 0, 'No errors');

  // --- Unified Input: Base64-encoded multi-line ---
  console.log('\n📋 Unified Input — Base64 Encoded:');

  const base64Input = Buffer.from([vmessLink, ssLink, trojanLink].join('\n')).toString('base64');
  const b64Result = await parseInput(base64Input);
  assert(b64Result.proxies.length === 3, `Base64 input: got ${b64Result.proxies.length} proxies`);

  // --- Unified Input: YAML text ---
  console.log('\n📋 Unified Input — YAML Text:');

  const yamlResult = await parseInput(yamlContent);
  assert(yamlResult.proxies.length === 2, `YAML input: got ${yamlResult.proxies.length} proxies`);
  assert(yamlResult.proxies[0]?.name === 'yaml-ss1', 'YAML proxy name');

  // --- Unified Input: Legacy Clash YAML ---
  const legacyResult = await parseInput(legacyYaml);
  assert(legacyResult.proxies.length === 1, `Legacy YAML (Proxy key): got ${legacyResult.proxies.length} proxies`);

  // --- Unified Input: Mixed (URIs + HTTP URL via mock server) ---
  console.log('\n📋 Unified Input — Mixed with HTTP subscription:');

  const app = express();
  app.get('/test-sub', (req, res) => {
    // Return base64-encoded subscription
    const subContent = [vmessLink, trojanLink].join('\n');
    res.type('text/plain').send(Buffer.from(subContent).toString('base64'));
  });
  app.get('/test-yaml', (req, res) => {
    res.type('text/yaml').send(yamlContent);
  });

  const server = app.listen(4321, async () => {
    try {
      // Mixed: one proxy URI + one HTTP subscription URL
      const mixedInput = `${ssLink}\nhttp://localhost:4321/test-sub`;
      const mixedResult = await parseInput(mixedInput);
      assert(mixedResult.proxies.length === 3, `Mixed input: got ${mixedResult.proxies.length} proxies (expected 3)`);
      assert(mixedResult.errors.length === 0, 'No errors in mixed input');

      // HTTP URL returning YAML
      const yamlUrlResult = await parseInput('http://localhost:4321/test-yaml');
      assert(yamlUrlResult.proxies.length === 2, `YAML URL: got ${yamlUrlResult.proxies.length} proxies`);

    } catch (e: any) {
      console.error('Mixed test failed:', e.message);
    }
    server.close();

    // --- Summary ---
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🏁 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    if (failed > 0) {
      process.exit(1);
    }
  });
}

runTests();
