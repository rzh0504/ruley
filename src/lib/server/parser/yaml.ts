import yaml from 'yaml';

/**
 * Try to extract proxies from a YAML/Mihomo config string.
 * Returns null if the string is not valid YAML or doesn't contain proxies.
 */
export const tryParseYaml = (content: string): any[] | null => {
  try {
    const parsed = yaml.parse(content);
    if (!parsed || typeof parsed !== 'object') return null;

    if (parsed.proxies && Array.isArray(parsed.proxies)) {
      return parsed.proxies;
    }

    if (parsed.Proxy && Array.isArray(parsed.Proxy)) {
      return parsed.Proxy;
    }

    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].server) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
};
