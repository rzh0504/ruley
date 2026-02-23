import yaml from 'yaml';

// ============================================================================
// Types
// ============================================================================

export interface GroupConfig {
  id: string;
  icon: string;
  name: string;
  type: 'select' | 'url-test' | 'fallback';
  filter: string;
}

export interface RuleItem {
  id: string;
  type: string;
  value: string;
  policy: string;
}

export interface GenerateRequest {
  proxies: any[];
  proxyGroups: GroupConfig[];
  rules: RuleItem[];
  settings?: {
    port?: number;
    socksPort?: number;
    allowLan?: boolean;
    mode?: string;
    logLevel?: string;
    externalController?: string;
  };
}

// ============================================================================
// Generator
// ============================================================================

/**
 * Match proxy names against a filter regex/keyword.
 */
const matchProxies = (proxies: any[], filter: string): string[] => {
  if (!filter || !proxies.length) return [];

  try {
    const regex = new RegExp(filter, 'i');
    return proxies
      .filter(p => p.name && regex.test(p.name))
      .map(p => p.name);
  } catch {
    // If regex is invalid, fall back to simple includes match
    const lower = filter.toLowerCase();
    return proxies
      .filter(p => p.name && p.name.toLowerCase().includes(lower))
      .map(p => p.name);
  }
};

/**
 * Generate a complete Clash/Mihomo YAML configuration.
 */
export const generateConfig = (req: GenerateRequest): string => {
  const {
    proxies = [],
    proxyGroups = [],
    rules = [],
    settings = {},
  } = req;

  const {
    port = 7890,
    socksPort = 7891,
    allowLan = true,
    mode = 'rule',
    logLevel = 'info',
    externalController = '127.0.0.1:9090',
  } = settings;

  // --- Build proxy-groups ---
  const clashProxyGroups: any[] = [];
  const allProxyNames = proxies.map(p => p.name).filter(Boolean);

  // Find the "main selector" group (first select group) name for referencing
  const mainGroupName = proxyGroups.length > 0
    ? `${proxyGroups[0].icon} ${proxyGroups[0].name}`
    : '🚀 节点选择';

  for (const group of proxyGroups) {
    const fullName = `${group.icon} ${group.name}`;
    const matched = matchProxies(proxies, group.filter);

    const groupProxies: string[] = [];

    if (group.type === 'select') {
      // For select groups, include other group names as sub-strategies if not self
      // Include "DIRECT" and "REJECT" as built-in options
      if (fullName !== mainGroupName) {
        groupProxies.push(mainGroupName);
      }
      groupProxies.push('DIRECT', 'REJECT');
      // Then matched node names
      groupProxies.push(...matched);
    } else {
      // url-test / fallback only include matched nodes
      groupProxies.push(...matched);
    }

    // Ensure at least one proxy
    if (groupProxies.length === 0) {
      groupProxies.push('DIRECT');
    }

    const clashGroup: any = {
      name: fullName,
      type: group.type,
      proxies: [...new Set(groupProxies)], // deduplicate
    };

    if (group.type === 'url-test' || group.type === 'fallback') {
      clashGroup.url = 'http://www.gstatic.com/generate_204';
      clashGroup.interval = 300;
      clashGroup.tolerance = 50;
    }

    clashProxyGroups.push(clashGroup);
  }

  // --- Build rules ---
  const clashRules: string[] = [];
  for (const rule of rules) {
    if (rule.type === 'MATCH') {
      clashRules.push(`MATCH,${rule.policy}`);
    } else {
      clashRules.push(`${rule.type},${rule.value},${rule.policy}`);
    }
  }
  // Always end with a MATCH rule
  if (!clashRules.some(r => r.startsWith('MATCH,'))) {
    clashRules.push(`MATCH,${mainGroupName}`);
  }

  // --- Build full config object ---
  const config: any = {
    port,
    'socks-port': socksPort,
    'allow-lan': allowLan,
    mode,
    'log-level': logLevel,
    'external-controller': externalController,
    proxies: proxies,
    'proxy-groups': clashProxyGroups,
    rules: clashRules,
  };

  // --- Serialize to YAML ---
  return yaml.stringify(config, {
    lineWidth: 0,       // Don't wrap lines
    defaultKeyType: 'PLAIN',
    defaultStringType: 'QUOTE_DOUBLE',
  });
};
