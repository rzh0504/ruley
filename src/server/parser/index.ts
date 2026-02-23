import axios from 'axios';
import yaml from 'yaml';

// ============================================================================
// Utilities
// ============================================================================

/**
 * Safely decode Base64 string, handling URL-safe variants and padding.
 */
export const decodeBase64 = (str: string): string => {
  try {
    let base64 = str.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (e) {
    console.error('Failed to decode base64:', str?.substring(0, 20) + '...', e);
    return '';
  }
};

/**
 * Heuristic: check if a string looks like Base64-encoded data.
 */
const isLikelyBase64 = (str: string): boolean => {
  const trimmed = str.trim();
  if (trimmed.length < 20) return false;
  // Must only contain Base64 chars (including URL-safe and whitespace)
  if (!/^[A-Za-z0-9+/=_\-\s]+$/.test(trimmed)) return false;
  // Should not look like a URL or YAML
  if (trimmed.includes('://') || trimmed.includes('proxies:')) return false;
  return true;
};

/**
 * URL-safe Base64 decode for SSR params.
 */
const decodeUrlSafeBase64 = (str: string): string => {
  return decodeBase64(str.replace(/-/g, '+').replace(/_/g, '/'));
};

// Known proxy URI prefixes
const PROXY_PREFIXES = [
  'vmess://', 'vless://', 'ss://', 'ssr://', 'trojan://',
  'hysteria2://', 'hy2://', 'tuic://', 'wg://', 'wireguard://',
  'snell://', 'hysteria://',
];

const isProxyUri = (line: string): boolean => {
  return PROXY_PREFIXES.some(p => line.startsWith(p));
};

const isHttpUrl = (line: string): boolean => {
  return line.startsWith('http://') || line.startsWith('https://');
};

// ============================================================================
// Individual Protocol Parsers
// ============================================================================

/**
 * Parse a vmess:// link into a Clash proxy object.
 */
export const parseVmess = (link: string): any => {
  try {
    const base64Str = link.replace('vmess://', '');
    const decoded = decodeBase64(base64Str);
    const config = JSON.parse(decoded);

    const proxy: any = {
      name: config.ps || 'Unnamed vmess',
      type: 'vmess',
      server: config.add,
      port: Number(config.port),
      uuid: config.id,
      alterId: Number(config.aid || 0),
      cipher: config.scy || 'auto',
    };

    if (config.tls === 'tls') {
      proxy.tls = true;
      if (config.sni) proxy['servername'] = config.sni;
      if (config.alpn) proxy.alpn = config.alpn.split(',');
    }

    const net = config.net;
    if (net === 'ws') {
      proxy.network = 'ws';
      proxy['ws-opts'] = {
        path: config.path || '/',
        headers: {
          Host: config.host || config.add,
        },
      };
    } else if (net === 'grpc') {
      proxy.network = 'grpc';
      proxy['grpc-opts'] = {
        'grpc-service-name': config.path || '',
      };
    } else if (net === 'h2') {
      proxy.network = 'h2';
      proxy['h2-opts'] = {
        host: config.host ? [config.host] : [config.add],
        path: config.path || '/',
      };
    } else if (net === 'tcp' && config.type === 'http') {
      proxy.network = 'http';
      proxy['http-opts'] = {
        path: config.path ? [config.path] : ['/'],
        headers: config.host ? { Host: [config.host] } : {},
      };
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse vmess:', e);
    return null;
  }
};

/**
 * Parse a vless:// link into a Clash proxy object.
 */
export const parseVless = (link: string): any => {
  try {
    const url = new URL(link);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed vless',
      type: 'vless',
      server: url.hostname,
      port: Number(url.port || 443),
      uuid: url.username,
      udp: true,
      'skip-cert-verify': true,
    };

    const security = url.searchParams.get('security') || '';

    if (security === 'tls' || security === 'reality') {
      proxy.tls = true;
      proxy.servername = url.searchParams.get('sni') || url.hostname;
    }

    if (security === 'reality') {
      proxy['client-fingerprint'] = url.searchParams.get('fp') || 'chrome';
      proxy['reality-opts'] = {
        'public-key': url.searchParams.get('pbk') || '',
        'short-id': url.searchParams.get('sid') || '',
      };
    }

    const alpn = url.searchParams.get('alpn');
    if (alpn) proxy.alpn = alpn.split(',');

    const type = url.searchParams.get('type') || 'tcp';
    if (type === 'tcp') {
      proxy.network = 'tcp';
      const flow = url.searchParams.get('flow');
      if (flow) proxy.flow = flow;
    } else if (type === 'ws') {
      proxy.network = 'ws';
      proxy['ws-opts'] = {
        path: url.searchParams.get('path') || '/',
        headers: {
          Host: url.searchParams.get('host') || proxy.servername || url.hostname,
        },
      };
    } else if (type === 'grpc') {
      proxy.network = 'grpc';
      proxy['grpc-opts'] = {
        'grpc-service-name': url.searchParams.get('serviceName') || '',
      };
    } else if (type === 'h2') {
      proxy.network = 'h2';
      proxy['h2-opts'] = {
        host: [url.searchParams.get('host') || url.hostname],
        path: url.searchParams.get('path') || '/',
      };
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse vless:', e);
    return null;
  }
};

/**
 * Parse a trojan:// link into a Clash proxy object.
 */
export const parseTrojan = (link: string): any => {
  try {
    const url = new URL(link);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed trojan',
      type: 'trojan',
      server: url.hostname,
      port: Number(url.port || 443),
      password: decodeURIComponent(url.username),
      udp: true,
      sni: url.searchParams.get('sni') || url.hostname,
      'skip-cert-verify': url.searchParams.get('allowInsecure') === '1',
    };

    const alpn = url.searchParams.get('alpn');
    if (alpn) proxy.alpn = alpn.split(',');

    const type = url.searchParams.get('type') || 'tcp';
    if (type === 'ws') {
      proxy.network = 'ws';
      proxy['ws-opts'] = {
        path: url.searchParams.get('path') || '/',
        headers: {
          Host: url.searchParams.get('host') || url.hostname,
        },
      };
    } else if (type === 'grpc') {
      proxy.network = 'grpc';
      proxy['grpc-opts'] = {
        'grpc-service-name': url.searchParams.get('serviceName') || '',
      };
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse trojan:', e);
    return null;
  }
};

/**
 * Parse a ss:// link (SIP002 and legacy) into a Clash proxy object.
 */
export const parseShadowsocks = (link: string): any => {
  try {
    const raw = link.replace('ss://', '');
    let namePart = '';
    let mainPart = raw;

    // Extract name from fragment
    if (raw.includes('#')) {
      const hashIndex = raw.lastIndexOf('#');
      namePart = decodeURIComponent(raw.substring(hashIndex + 1));
      mainPart = raw.substring(0, hashIndex);
    }

    // SIP002: may have query params (plugin info)
    let queryPart = '';
    if (mainPart.includes('?')) {
      const qIndex = mainPart.indexOf('?');
      queryPart = mainPart.substring(qIndex + 1);
      mainPart = mainPart.substring(0, qIndex);
    }

    let userInfoAndHost: string;
    if (!mainPart.includes('@')) {
      // Entirely base64 encoded: method:password@host:port
      userInfoAndHost = decodeBase64(mainPart);
    } else {
      // userinfo is base64, host:port is plain  OR  userinfo is plain
      const atIndex = mainPart.indexOf('@');
      const b64UserInfo = mainPart.substring(0, atIndex);
      const hostPort = mainPart.substring(atIndex + 1);
      // Try to decode the user info part
      const decodedUserInfo = decodeBase64(b64UserInfo);
      if (decodedUserInfo && decodedUserInfo.includes(':')) {
        userInfoAndHost = `${decodedUserInfo}@${hostPort}`;
      } else {
        // Might be plain text method:password
        userInfoAndHost = `${b64UserInfo}@${hostPort}`;
      }
    }

    // Parse with URL helper
    const url = new URL(`http://${userInfoAndHost}`);

    const proxy: any = {
      name: namePart || 'Unnamed ss',
      type: 'ss',
      server: url.hostname,
      port: Number(url.port),
      cipher: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      udp: true,
    };

    // Handle SIP002 plugin (e.g. obfs)
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      const plugin = params.get('plugin');
      if (plugin) {
        // Plugin format: "obfs-local;obfs=http;obfs-host=..."
        const pluginParts = plugin.split(';');
        const pluginName = pluginParts[0];
        if (pluginName === 'obfs-local' || pluginName === 'simple-obfs') {
          proxy.plugin = 'obfs';
          proxy['plugin-opts'] = {};
          for (const part of pluginParts.slice(1)) {
            const [k, v] = part.split('=');
            if (k === 'obfs') proxy['plugin-opts'].mode = v;
            if (k === 'obfs-host') proxy['plugin-opts'].host = v;
          }
        } else if (pluginName === 'v2ray-plugin') {
          proxy.plugin = 'v2ray-plugin';
          proxy['plugin-opts'] = {};
          for (const part of pluginParts.slice(1)) {
            const [k, v] = part.split('=');
            if (k === 'mode') proxy['plugin-opts'].mode = v;
            if (k === 'host') proxy['plugin-opts'].host = v;
            if (k === 'path') proxy['plugin-opts'].path = v;
            if (k === 'tls') proxy['plugin-opts'].tls = true;
          }
        }
      }
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse shadowsocks:', e);
    return null;
  }
};

/**
 * Parse a ssr:// link into a Clash proxy object.
 */
export const parseShadowsocksR = (link: string): any => {
  try {
    const encoded = link.replace('ssr://', '');
    const decoded = decodeUrlSafeBase64(encoded);

    // Format: host:port:protocol:method:obfs:password_base64/?params
    const mainAndParams = decoded.split('/?');
    const mainPart = mainAndParams[0];
    const paramStr = mainAndParams[1] || '';

    const parts = mainPart.split(':');
    if (parts.length < 6) {
      console.error('Invalid SSR format, not enough parts:', parts.length);
      return null;
    }

    // host:port:protocol:method:obfs:password_base64
    // Note: host could contain IPv6 with colons, so we parse from the end
    const password_b64 = parts.pop()!;
    const obfs = parts.pop()!;
    const method = parts.pop()!;
    const protocol = parts.pop()!;
    const port = parts.pop()!;
    const host = parts.join(':'); // remaining parts are host (handles IPv6)

    const password = decodeUrlSafeBase64(password_b64);

    // Parse optional params
    const params = new URLSearchParams(paramStr);
    const obfsParam = params.get('obfsparam') ? decodeUrlSafeBase64(params.get('obfsparam')!) : '';
    const protoParam = params.get('protoparam') ? decodeUrlSafeBase64(params.get('protoparam')!) : '';
    const remarks = params.get('remarks') ? decodeUrlSafeBase64(params.get('remarks')!) : '';
    const group = params.get('group') ? decodeUrlSafeBase64(params.get('group')!) : '';

    const proxy: any = {
      name: remarks || `${host}:${port}`,
      type: 'ssr',
      server: host,
      port: Number(port),
      cipher: method,
      password: password,
      protocol: protocol,
      'protocol-param': protoParam,
      obfs: obfs,
      'obfs-param': obfsParam,
      udp: true,
    };

    if (group) proxy.group = group;

    return proxy;
  } catch (e) {
    console.error('Failed to parse SSR:', e);
    return null;
  }
};

/**
 * Parse a hysteria2:// or hy2:// link into a Clash proxy object.
 */
export const parseHysteria2 = (link: string): any => {
  try {
    const parseableLink = link.replace(/^(hysteria2|hy2):\/\//, 'http://');
    const url = new URL(parseableLink);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed Hysteria2',
      type: 'hysteria2',
      server: url.hostname,
      port: Number(url.port || 443),
      password: decodeURIComponent(url.username),
    };

    const sni = url.searchParams.get('sni');
    if (sni) proxy.sni = sni;

    const insecure = url.searchParams.get('insecure');
    if (insecure === '1') proxy['skip-cert-verify'] = true;

    const obfs = url.searchParams.get('obfs');
    if (obfs) {
      proxy.obfs = obfs;
      const obfsPassword = url.searchParams.get('obfs-password');
      if (obfsPassword) proxy['obfs-password'] = obfsPassword;
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse hysteria2:', e);
    return null;
  }
};

/**
 * Parse a hysteria:// (v1) link into a Clash proxy object.
 */
export const parseHysteria = (link: string): any => {
  try {
    const parseableLink = link.replace('hysteria://', 'http://');
    const url = new URL(parseableLink);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed Hysteria',
      type: 'hysteria',
      server: url.hostname,
      port: Number(url.port || 443),
      'auth-str': url.searchParams.get('auth') || decodeURIComponent(url.username) || '',
      up: url.searchParams.get('upmbps') || url.searchParams.get('up') || '100',
      down: url.searchParams.get('downmbps') || url.searchParams.get('down') || '100',
      protocol: url.searchParams.get('protocol') || 'udp',
    };

    const sni = url.searchParams.get('peer') || url.searchParams.get('sni');
    if (sni) proxy.sni = sni;

    const insecure = url.searchParams.get('insecure');
    if (insecure === '1') proxy['skip-cert-verify'] = true;

    const alpn = url.searchParams.get('alpn');
    if (alpn) proxy.alpn = alpn.split(',');

    const obfs = url.searchParams.get('obfs');
    if (obfs) proxy.obfs = obfs;

    return proxy;
  } catch (e) {
    console.error('Failed to parse hysteria:', e);
    return null;
  }
};

/**
 * Parse a tuic:// link into a Clash proxy object.
 */
export const parseTuic = (link: string): any => {
  try {
    const parseableLink = link.replace('tuic://', 'http://');
    const url = new URL(parseableLink);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed TUIC',
      type: 'tuic',
      server: url.hostname,
      port: Number(url.port || 443),
      uuid: url.username,
      password: decodeURIComponent(url.password),
      udp: true,
    };

    const sni = url.searchParams.get('sni');
    if (sni) proxy.sni = sni;

    const alpn = url.searchParams.get('alpn');
    if (alpn) proxy.alpn = alpn.split(',');

    const congestion = url.searchParams.get('congestion_control');
    if (congestion) proxy['congestion-controller'] = congestion;

    const udpRelayMode = url.searchParams.get('udp_relay_mode');
    if (udpRelayMode) proxy['udp-relay-mode'] = udpRelayMode;

    const insecure = url.searchParams.get('allow_insecure');
    if (insecure === '1') proxy['skip-cert-verify'] = true;

    return proxy;
  } catch (e) {
    console.error('Failed to parse TUIC:', e);
    return null;
  }
};

/**
 * Parse a wireguard:// or wg:// link into a Clash proxy object.
 */
export const parseWireGuard = (link: string): any => {
  try {
    const parseableLink = link.replace(/^(wireguard|wg):\/\//, 'http://');
    const url = new URL(parseableLink);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed WireGuard',
      type: 'wireguard',
      server: url.hostname,
      port: Number(url.port || 51820),
      'private-key': decodeURIComponent(url.username) || url.searchParams.get('privatekey') || '',
      'public-key': url.searchParams.get('publickey') || '',
      udp: true,
    };

    const ip = url.searchParams.get('address') || url.searchParams.get('ip');
    if (ip) proxy.ip = ip;

    const ipv6 = url.searchParams.get('ipv6');
    if (ipv6) proxy.ipv6 = ipv6;

    const psk = url.searchParams.get('presharedkey');
    if (psk) proxy['preshared-key'] = psk;

    const reserved = url.searchParams.get('reserved');
    if (reserved) {
      proxy.reserved = reserved.split(',').map(Number);
    }

    const mtu = url.searchParams.get('mtu');
    if (mtu) proxy.mtu = Number(mtu);

    return proxy;
  } catch (e) {
    console.error('Failed to parse WireGuard:', e);
    return null;
  }
};

/**
 * Parse a snell:// link into a Clash proxy object.
 */
export const parseSnell = (link: string): any => {
  try {
    const parseableLink = link.replace('snell://', 'http://');
    const url = new URL(parseableLink);
    const proxy: any = {
      name: decodeURIComponent(url.hash.replace('#', '')) || 'Unnamed Snell',
      type: 'snell',
      server: url.hostname,
      port: Number(url.port || 443),
      psk: decodeURIComponent(url.username) || url.searchParams.get('psk') || '',
      version: Number(url.searchParams.get('version') || 3),
    };

    const obfs = url.searchParams.get('obfs');
    if (obfs) {
      proxy['obfs-opts'] = {
        mode: obfs,
      };
      const obfsHost = url.searchParams.get('obfs-host');
      if (obfsHost) proxy['obfs-opts'].host = obfsHost;
    }

    return proxy;
  } catch (e) {
    console.error('Failed to parse Snell:', e);
    return null;
  }
};

// ============================================================================
// Dispatcher
// ============================================================================

/**
 * Dispatcher to parse a single text line into a proxy object.
 */
export const parseLineToProxy = (line: string): any | null => {
  line = line.trim();
  if (!line) return null;

  if (line.startsWith('vmess://')) return parseVmess(line);
  if (line.startsWith('vless://')) return parseVless(line);
  if (line.startsWith('ss://') && !line.startsWith('ssr://')) return parseShadowsocks(line);
  if (line.startsWith('ssr://')) return parseShadowsocksR(line);
  if (line.startsWith('trojan://')) return parseTrojan(line);
  if (line.startsWith('hysteria2://') || line.startsWith('hy2://')) return parseHysteria2(line);
  if (line.startsWith('hysteria://')) return parseHysteria(line);
  if (line.startsWith('tuic://')) return parseTuic(line);
  if (line.startsWith('wireguard://') || line.startsWith('wg://')) return parseWireGuard(line);
  if (line.startsWith('snell://')) return parseSnell(line);

  return null;
};

// ============================================================================
// YAML Parsing
// ============================================================================

/**
 * Try to extract proxies from a YAML/Clash config string.
 * Returns null if the string is not valid YAML or doesn't contain proxies.
 */
const tryParseYaml = (content: string): any[] | null => {
  try {
    const parsed = yaml.parse(content);
    if (!parsed || typeof parsed !== 'object') return null;

    // Standard Clash format: { proxies: [...] }
    if (parsed.proxies && Array.isArray(parsed.proxies)) {
      return parsed.proxies;
    }

    // Legacy Clash format: { Proxy: [...] }
    if (parsed.Proxy && Array.isArray(parsed.Proxy)) {
      return parsed.Proxy;
    }

    // Bare array of proxy objects
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].server) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
};

// ============================================================================
// Subscription Fetching
// ============================================================================

/**
 * Fetch a subscription URL and parse its contents into a list of Clash proxies.
 */
export const fetchAndParseSubscription = async (url: string): Promise<any[]> => {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'ClashforWindows/0.20.39',
    },
    timeout: 15000,
    responseType: 'text',
    // Some servers return odd content types; always treat as text
    transformResponse: [(data: any) => data],
  });

  let rawData: string = typeof response.data === 'string'
    ? response.data
    : String(response.data);

  return parseRawContent(rawData);
};

// ============================================================================
// Raw Content Parsing (shared between fetch result & direct text input)
// ============================================================================

/**
 * Parse raw text content that could be:
 * - YAML/Clash config
 * - Base64-encoded subscription data
 * - Line-by-line proxy URIs
 */
const parseRawContent = (rawData: string): any[] => {
  const trimmed = rawData.trim();
  if (!trimmed) return [];

  // 1. Try YAML parsing first
  const yamlProxies = tryParseYaml(trimmed);
  if (yamlProxies && yamlProxies.length > 0) {
    return yamlProxies;
  }

  // 2. Try Base64 decoding if it looks like Base64
  if (isLikelyBase64(trimmed)) {
    const decoded = decodeBase64(trimmed);
    if (decoded) {
      // Decoded content might be YAML or line-by-line URIs
      const yamlFromB64 = tryParseYaml(decoded);
      if (yamlFromB64 && yamlFromB64.length > 0) {
        return yamlFromB64;
      }
      // Try line-by-line parsing of decoded content
      const proxiesFromB64 = parseLinesAsProxies(decoded);
      if (proxiesFromB64.length > 0) {
        return proxiesFromB64;
      }
    }
  }

  // 3. Line-by-line proxy URI parsing
  return parseLinesAsProxies(trimmed);
};

/**
 * Parse multi-line text as individual proxy URIs.
 */
const parseLinesAsProxies = (text: string): any[] => {
  const lines = text.split(/\r?\n/);
  const proxies: any[] = [];
  for (const line of lines) {
    const proxy = parseLineToProxy(line);
    if (proxy) proxies.push(proxy);
  }
  return proxies;
};

// ============================================================================
// Unified Input Entry Point
// ============================================================================

/**
 * Parse raw user input which can be a mix of:
 * - Direct proxy URIs (vmess://, ss://, ssr://, etc.)
 * - Subscription HTTP(S) URLs
 * - Raw Base64-encoded subscription data
 * - Raw YAML/Clash config text
 *
 * Returns { proxies, errors }.
 */
export const parseInput = async (rawInput: string): Promise<{ proxies: any[], errors: any[] }> => {
  const allProxies: any[] = [];
  const errors: any[] = [];

  const trimmed = rawInput.trim();
  if (!trimmed) return { proxies: allProxies, errors };

  // --- Strategy 1: Try the whole input as YAML ---
  const yamlProxies = tryParseYaml(trimmed);
  if (yamlProxies && yamlProxies.length > 0) {
    return { proxies: yamlProxies, errors };
  }

  // --- Strategy 2: Try the whole input as Base64 ---
  if (isLikelyBase64(trimmed)) {
    const decoded = decodeBase64(trimmed);
    if (decoded) {
      const yamlFromB64 = tryParseYaml(decoded);
      if (yamlFromB64 && yamlFromB64.length > 0) {
        return { proxies: yamlFromB64, errors };
      }
      const proxiesFromB64 = parseLinesAsProxies(decoded);
      if (proxiesFromB64.length > 0) {
        return { proxies: proxiesFromB64, errors };
      }
    }
  }

  // --- Strategy 3: Line-by-line classification ---
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Collect proxy URIs and HTTP URLs
  const proxyLines: string[] = [];
  const httpUrls: string[] = [];
  const unknownLines: string[] = [];

  for (const line of lines) {
    if (isProxyUri(line)) {
      proxyLines.push(line);
    } else if (isHttpUrl(line)) {
      httpUrls.push(line);
    } else {
      unknownLines.push(line);
    }
  }

  // Parse direct proxy URIs
  for (const line of proxyLines) {
    const proxy = parseLineToProxy(line);
    if (proxy) {
      allProxies.push(proxy);
    } else {
      errors.push({ input: line.substring(0, 50), error: 'Failed to parse proxy URI' });
    }
  }

  // Fetch and parse HTTP subscription URLs
  for (const url of httpUrls) {
    try {
      const proxies = await fetchAndParseSubscription(url);
      allProxies.push(...proxies);
    } catch (err: any) {
      errors.push({ url, error: err.message });
    }
  }

  // Log unknown lines
  for (const line of unknownLines) {
    if (line.length > 5) {
      console.warn(`[Parser] Skipped unknown input: ${line.substring(0, 40)}...`);
    }
  }

  return { proxies: allProxies, errors };
};
