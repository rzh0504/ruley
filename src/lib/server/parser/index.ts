import { decodeBase64, isLikelyBase64 } from './base64';
import { fetchAndParseSubscription, SubscriptionParseError } from './fetch';
import { parseHysteria, parseHysteria2, parseSnell, parseTuic, parseWireGuard } from './protocols/misc';
import { parseShadowsocks, parseShadowsocksR } from './protocols/ss';
import { parseTrojan } from './protocols/trojan';
import { parseVless } from './protocols/vless';
import { parseVmess } from './protocols/vmess';
import { createParseError, type MihomoProxy, type ParseDiagnostic, type ParseError, type ParseInputResult, type ParseOptions } from './types';
import { tryParseYaml } from './yaml';

export { decodeBase64, decodeUrlSafeBase64, isLikelyBase64 } from './base64';
export { fetchAndParseSubscription } from './fetch';
export { parseHysteria, parseHysteria2, parseSnell, parseTuic, parseWireGuard } from './protocols/misc';
export { parseShadowsocks, parseShadowsocksR } from './protocols/ss';
export { parseTrojan } from './protocols/trojan';
export { parseVless } from './protocols/vless';
export { parseVmess } from './protocols/vmess';
export type { MihomoProxy, ParseDiagnostic, ParseError, ParseErrorCode, ParseErrorKind, ParseErrorSeverity, ParseInputResult, ParseOptions } from './types';
export { tryParseYaml } from './yaml';

const PROXY_PREFIXES = [
  'vmess://', 'vless://', 'ss://', 'ssr://', 'trojan://',
  'hysteria2://', 'hy2://', 'tuic://', 'wg://', 'wireguard://',
  'snell://', 'hysteria://',
];

const MAX_SUBSCRIPTION_URLS = Number(process.env.MAX_SUBSCRIPTION_URLS || 10);
const SUBSCRIPTION_CONCURRENCY = Number(process.env.SUBSCRIPTION_CONCURRENCY || 4);

const isProxyUri = (line: string): boolean => {
  return PROXY_PREFIXES.some(p => line.startsWith(p));
};

const isHttpUrl = (line: string): boolean => {
  return line.startsWith('http://') || line.startsWith('https://');
};

const runWithConcurrency = async <T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> => {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      try {
        results[current] = { status: 'fulfilled', value: await worker(items[current]) };
      } catch (reason) {
        results[current] = { status: 'rejected', reason };
      }
    }
  });

  await Promise.all(workers);
  return results;
};

/**
 * Dispatcher to parse a single text line into a proxy object.
 */
export const parseLineToProxy = (line: string): MihomoProxy | null => {
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

/**
 * Parse raw text content that could be YAML, Base64 subscription data, or proxy URIs.
 */
export const parseRawContent = (rawData: string): MihomoProxy[] => {
  const trimmed = rawData.trim();
  if (!trimmed) return [];

  const yamlProxies = tryParseYaml(trimmed);
  if (yamlProxies && yamlProxies.length > 0) {
    return yamlProxies;
  }

  if (isLikelyBase64(trimmed)) {
    const decoded = decodeBase64(trimmed);
    if (decoded) {
      const yamlFromB64 = tryParseYaml(decoded);
      if (yamlFromB64 && yamlFromB64.length > 0) {
        return yamlFromB64;
      }

      const proxiesFromB64 = parseLinesAsProxies(decoded);
      if (proxiesFromB64.length > 0) {
        return proxiesFromB64;
      }
    }
  }

  return parseLinesAsProxies(trimmed);
};

/**
 * Parse multi-line text as individual proxy URIs.
 */
const parseLinesAsProxies = (text: string): MihomoProxy[] => {
  const lines = text.split(/\r?\n/);
  const proxies: MihomoProxy[] = [];
  for (const line of lines) {
    const proxy = parseLineToProxy(line);
    if (proxy) proxies.push(proxy);
  }
  return proxies;
};

const getProxyIdentity = (proxy: MihomoProxy) => {
  const credential = proxy.uuid || proxy.password || proxy['private-key'] || proxy.name || '';
  return [proxy.type, proxy.server, proxy.port, credential].map(value => String(value || '')).join('|');
};

const normalizeProxyNames = (proxies: MihomoProxy[], diagnostics: ParseDiagnostic[], options: ParseOptions = {}) => {
  const {
    skipDuplicateNodes = true,
    duplicateNameStrategy = 'append',
  } = options;
  const seenIdentity = new Set<string>();
  const nameCounts = new Map<string, number>();
  const normalized: MihomoProxy[] = [];

  for (const proxy of proxies) {
    const identity = getProxyIdentity(proxy);
    if (seenIdentity.has(identity)) {
      diagnostics.push({
        type: 'duplicate',
        name: String(proxy.name || 'Unnamed'),
        message: skipDuplicateNodes
          ? `已移除重复节点：${String(proxy.name || 'Unnamed')}`
          : `保留重复节点：${String(proxy.name || 'Unnamed')}`,
      });
      if (skipDuplicateNodes) continue;
    }
    seenIdentity.add(identity);

    const baseName = String(proxy.name || 'Unnamed').trim() || 'Unnamed';
    const count = nameCounts.get(baseName) || 0;
    nameCounts.set(baseName, count + 1);
    if (count === 0) {
      normalized.push({ ...proxy, name: baseName });
      continue;
    }

    if (duplicateNameStrategy === 'keep') {
      normalized.push({ ...proxy, name: baseName });
      continue;
    }

    if (duplicateNameStrategy === 'skip') {
      diagnostics.push({
        type: 'skipped',
        name: baseName,
        message: `已跳过同名节点：${baseName}`,
      });
      continue;
    }

    const nextName = `${baseName} #${count + 1}`;
    diagnostics.push({
      type: 'renamed',
      from: baseName,
      to: nextName,
      message: `同名节点已重命名：${baseName} -> ${nextName}`,
    });
    normalized.push({ ...proxy, name: nextName });
  }

  return normalized;
};

export const parseInput = async (rawInput: string, options: ParseOptions = {}): Promise<ParseInputResult> => {
  const allProxies: MihomoProxy[] = [];
  const errors: ParseError[] = [];
  const diagnostics: ParseDiagnostic[] = [];

  const trimmed = rawInput.trim();
  if (!trimmed) return { proxies: allProxies, errors, diagnostics };

  const yamlProxies = tryParseYaml(trimmed);
  if (yamlProxies && yamlProxies.length > 0) {
    return { proxies: normalizeProxyNames(yamlProxies, diagnostics, options), errors, diagnostics };
  }

  if (isLikelyBase64(trimmed)) {
    const decoded = decodeBase64(trimmed.replace(/[\s\r\n\uFEFF]/g, ''));
    if (decoded) {
      const yamlFromB64 = tryParseYaml(decoded);
      if (yamlFromB64 && yamlFromB64.length > 0) {
        return { proxies: normalizeProxyNames(yamlFromB64, diagnostics, options), errors, diagnostics };
      }
      const proxiesFromB64 = parseLinesAsProxies(decoded);
      if (proxiesFromB64.length > 0) {
        return { proxies: normalizeProxyNames(proxiesFromB64, diagnostics, options), errors, diagnostics };
      }
    }
  }

  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

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

  if (httpUrls.length > MAX_SUBSCRIPTION_URLS) {
    errors.push(createParseError({
      code: 'subscription_url_limit_exceeded',
      kind: 'limit',
      severity: 'error',
      message: `订阅链接数量超过上限：${MAX_SUBSCRIPTION_URLS}`,
      limit: MAX_SUBSCRIPTION_URLS,
    }));
    httpUrls.length = MAX_SUBSCRIPTION_URLS;
  }

  for (const line of proxyLines) {
    const proxy = parseLineToProxy(line);
    if (proxy) {
      allProxies.push(proxy);
    } else {
      errors.push(createParseError({
        code: 'proxy_uri_parse_failed',
        kind: 'input',
        severity: 'error',
        message: 'Failed to parse proxy URI',
        source: 'direct',
        input: line.substring(0, 50),
      }));
    }
  }

  const httpResults = await runWithConcurrency(
    httpUrls,
    SUBSCRIPTION_CONCURRENCY,
    url => fetchAndParseSubscription(url, parseRawContent).then(proxies => ({ url, proxies }))
  );

  for (const result of httpResults) {
    if (result.status === 'fulfilled') {
      if (result.value.proxies.length === 0) {
        errors.push(createParseError({
          code: 'subscription_empty',
          kind: 'subscription',
          severity: 'warning',
          message: '成功连接到链接，但在内容中未能解析出任何有效节点，可能是源站返回了防盗链或非节点页面',
          source: 'subscription',
          url: result.value.url,
        }));
      } else {
        allProxies.push(...result.value.proxies);
      }
    } else {
      const url = httpUrls[httpResults.indexOf(result)];
      const cause = result.reason?.message || 'Unknown error';
      const isParserError = result.reason instanceof SubscriptionParseError;
      errors.push(createParseError({
        code: isParserError ? result.reason.code : 'subscription_fetch_failed',
        kind: isParserError ? result.reason.kind : 'network',
        severity: 'error',
        message: cause,
        source: 'subscription',
        url,
        cause,
      }));
      if (options.continueOnParseError === false) break;
    }
  }

  for (const line of unknownLines) {
    if (line.length > 5) {
      diagnostics.push({
        type: 'skipped',
        message: `已跳过无法识别的输入：${line.substring(0, 80)}`,
      });
      console.warn(`[Parser] Skipped unknown input: ${line.substring(0, 40)}...`);
    }
  }

  return { proxies: normalizeProxyNames(allProxies, diagnostics, options), errors, diagnostics };
};
