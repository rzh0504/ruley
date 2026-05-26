import yaml from 'yaml';
import { getDefaultPolicyOptions, RULE_PROVIDERS, type ProxyGroupPolicyOption, type ProxyGroupType } from '@/lib/config/proxy-templates';

// ============================================================================
// Types
// ============================================================================

export interface GroupConfig {
  id: string;
  icon: string;
  name: string;
  type: ProxyGroupType;
  filter: string;
  policyOptions: ProxyGroupPolicyOption[];
  ruleLinks?: string;
  ruleSets?: [string, boolean][];
  dialerProxy?: string;
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
    secret?: string;
    advancedDns?: boolean;
  };
}

// ============================================================================
// Generator
// ============================================================================

const matchProxies = (proxies: any[], filter: string): string[] => {
  if (!filter || !proxies.length) return [];
  if (filter.length > 120 || /\([^)]*[+*][^)]*\)[+*?{]/.test(filter)) {
    const lower = filter.toLowerCase();
    return proxies.filter(p => p.name && p.name.toLowerCase().includes(lower)).map(p => p.name);
  }
  try {
    const regex = new RegExp(filter, 'i');
    return proxies.filter(p => p.name && regex.test(p.name)).map(p => p.name);
  } catch {
    const lower = filter.toLowerCase();
    return proxies.filter(p => p.name && p.name.toLowerCase().includes(lower)).map(p => p.name);
  }
};

export const generateConfig = (req: GenerateRequest): string => {
  const { proxies: rawProxies = [], proxyGroups = [], rules = [], settings = {} } = req;

  const {
    port = 7897, socksPort, allowLan = true, mode = 'rule', logLevel = 'info',
    externalController = '', secret = 'set-your-secret', advancedDns = true
  } = settings;

  const proxies = rawProxies;

  // --- Build proxy-groups ---
  const mihomoProxyGroups: any[] = [];

  const mainGroupName = proxyGroups.length > 0
    ? `${proxyGroups[0].icon} ${proxyGroups[0].name}` : '🚀 节点选择';

  const autoGroup = proxyGroups.find(g => g.id === '2');
  const autoGroupName = autoGroup ? `${autoGroup.icon} ${autoGroup.name}` : null;

  const addPolicyChoices = (target: string[], group: GroupConfig, matched: string[]) => {
    const options = group.policyOptions.length > 0
      ? group.policyOptions
      : getDefaultPolicyOptions(group);

    for (const option of options || []) {
      if (option === 'main' && group.id !== '1') target.push(mainGroupName);
      if (option === 'auto' && group.id !== '2' && autoGroupName) target.push(autoGroupName);
      if (option === 'direct') target.push('DIRECT');
      if (option === 'reject') target.push('REJECT');
      if (option === 'matched') target.push(...matched);
    }
  };

  for (const group of proxyGroups) {
    const fullName = `${group.icon} ${group.name}`;
    const matched = matchProxies(proxies, group.filter);
    const groupProxies: string[] = [];

    const actualType = group.type;
    addPolicyChoices(groupProxies, group, matched);

    if (groupProxies.length === 0) groupProxies.push('DIRECT');

    const mihomoGroup: any = {
      name: fullName,
      type: actualType,
      proxies: [...new Set(groupProxies)],
    };

    if (actualType === 'url-test' || actualType === 'fallback') {
      mihomoGroup.url = 'https://www.gstatic.com/generate_204';
      mihomoGroup.interval = 300;
      mihomoGroup.lazy = false;
    }

    // Inject dialer-proxy for proxy chaining
    if (group.dialerProxy) {
      const dp = proxyGroups.find(g => g.id === group.dialerProxy);
      if (dp) {
        mihomoGroup['dialer-proxy'] = `${dp.icon} ${dp.name}`;
      }
    }

    mihomoProxyGroups.push(mihomoGroup);
  }

  // --- Collect rule-providers and RULE-SET rules from group templates ---
  const usedProviders: Record<string, any> = {};
  const ruleSetRules: string[] = [];

  for (const group of proxyGroups) {
    const fullName = `${group.icon} ${group.name}`;

    if (group.ruleLinks !== undefined) {
      const urlLines = group.ruleLinks.split('\n').map(l => l.trim()).filter(Boolean);

      for (const urlStr of urlLines) {
        let actualUrl = urlStr;
        let noResolve = false;
        if (actualUrl.endsWith(',no-resolve')) {
          actualUrl = actualUrl.replace(',no-resolve', '');
          noResolve = true;
        }

        let behavior = 'domain';
        if (actualUrl.includes('geoip') || actualUrl.includes('ipcidr')) behavior = 'ipcidr';
        else if (actualUrl.includes('classical')) behavior = 'classical';
        else if (actualUrl.includes('geosite')) behavior = 'domain';

        const basename = actualUrl.split('/').pop()?.replace(/\.(yaml|yml|mrs)$/, '') || 'custom';
        // Custom groups use readable name-based provider key
        const providerName = group.id.startsWith('custom-') ? `custom-${group.name.toLowerCase()}` : basename;

        usedProviders[providerName] = {
          type: 'http',
          behavior,
          url: actualUrl,
          path: `./ruleset/${basename}.${actualUrl.endsWith('.mrs') ? 'mrs' : 'yaml'}`,
          interval: 86400,
          format: actualUrl.endsWith('.mrs') ? 'mrs' : 'yaml'
        };

        ruleSetRules.push(`RULE-SET,${providerName},${fullName}${noResolve ? ',no-resolve' : ''}`);
      }
      continue;
    }

    for (const [providerName, noResolve] of group.ruleSets || []) {
      const provider = RULE_PROVIDERS[providerName];
      if (!provider) continue;

      usedProviders[providerName] = { ...provider };
      ruleSetRules.push(`RULE-SET,${providerName},${fullName}${noResolve ? ',no-resolve' : ''}`);
    }
  }

  // --- User custom rules ---
  const customRules: string[] = [];
  for (const rule of rules) {
    if (rule.type === 'MATCH') {
      customRules.push(`MATCH,${rule.policy}`);
    } else {
      customRules.push(`${rule.type},${rule.value},${rule.policy}`);
    }
  }

  const allRules = [...ruleSetRules, ...customRules];
  if (!allRules.some(r => r.startsWith('MATCH,'))) {
    const catchAll = proxyGroups.find(g => g.id === '23');
    allRules.push(`MATCH,${catchAll ? `${catchAll.icon} ${catchAll.name}` : mainGroupName}`);
  }

  const dnsConfig = advancedDns ? {
    enable: true,
    listen: '0.0.0.0:53',
    ipv6: true,
    'enhanced-mode': 'redir-host',
    'fake-ip-range': '10.100.0.0/8',
    nameserver: ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'],
    fallback: ['https://1.0.0.1/dns-query', '8.8.8.8'],
    'fallback-filter': {
      geoip: true,
      'geoip-code': 'CN',
      ipcidr: ['240.0.0.0/4'],
      domain: ['+.google.com', '+.facebook.com', '+.youtube.com'],
    },
    'use-system-hosts': false,
  } : {
    enable: true,
    listen: '0.0.0.0:53',
    ipv6: true,
    'enhanced-mode': 'redir-host',
    'fake-ip-range': '10.100.0.0/8',
    nameserver: ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'],
    'use-system-hosts': false,
  };

  // --- Full config ---
  const config: any = {
    mode,
    'mixed-port': port,
    ...(socksPort ? { 'socks-port': socksPort } : {}),
    'allow-lan': allowLan,
    'log-level': logLevel,
    ipv6: true,
    'external-controller': externalController,
    secret,
    'unified-delay': true,
    dns: dnsConfig,
    'external-controller-pipe': '\\\\.\\pipe\\verge-mihomo',
    'external-controller-cors': {
      'allow-private-network': true,
      'allow-origins': [
        'tauri://localhost',
        'http://tauri.localhost',
        'https://yacd.metacubex.one',
        'https://metacubex.github.io',
        'https://board.zash.run.place',
      ],
    },
    tun: {
      'auto-detect-interface': true,
      'auto-route': true,
      device: 'Mihomo',
      'dns-hijack': ['any:53'],
      mtu: 1500,
      'route-exclude-address': [],
      stack: 'gvisor',
      'strict-route': false,
      enable: false,
    },
    profile: { 'store-selected': true, 'store-fake-ip': false },
    proxies,
    'proxy-groups': mihomoProxyGroups,
  };

  if (Object.keys(usedProviders).length > 0) {
    config['rule-providers'] = usedProviders;
  }
  config.rules = allRules;

  return yaml.stringify(config, { lineWidth: 0, defaultKeyType: 'PLAIN', defaultStringType: 'QUOTE_DOUBLE' });
};
