import yaml from 'yaml';
import type { MihomoProxy } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const toMihomoProxy = (value: unknown): MihomoProxy | null => {
  if (!isRecord(value)) return null;
  if (!('server' in value) && !('name' in value) && !('type' in value)) return null;

  return {
    ...value,
    name: String(value.name || 'Unnamed'),
    type: String(value.type || ''),
  } as MihomoProxy;
};

const toProxyList = (value: unknown): MihomoProxy[] | null => {
  if (!Array.isArray(value)) return null;
  const proxies = value.map(toMihomoProxy).filter(proxy => proxy !== null);
  return proxies.length > 0 ? proxies : null;
};

/**
 * Try to extract proxies from a YAML/Mihomo config string.
 * Returns null if the string is not valid YAML or doesn't contain proxies.
 */
export const tryParseYaml = (content: string): MihomoProxy[] | null => {
  try {
    const parsed: unknown = yaml.parse(content);
    if (!parsed || typeof parsed !== 'object') return null;

    if (isRecord(parsed)) {
      const proxies = toProxyList(parsed.proxies);
      if (proxies) return proxies;

      const legacyProxies = toProxyList(parsed.Proxy);
      if (legacyProxies) return legacyProxies;
    }

    const proxyList = toProxyList(parsed);
    if (proxyList) return proxyList;

    return null;
  } catch {
    return null;
  }
};
