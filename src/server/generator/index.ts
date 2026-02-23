import yaml from 'yaml';
import { RULE_PROVIDERS, ProxyGroupTemplate } from '../../config/proxyTemplates.js';

// ============================================================================
// Types
// ============================================================================

export interface GroupConfig {
  id: string;
  icon: string;
  name: string;
  type: 'select' | 'url-test' | 'fallback';
  filter: string;
  ruleSets?: [string, boolean][];
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

const matchProxies = (proxies: any[], filter: string): string[] => {
  if (!filter || !proxies.length) return [];
  try {
    const regex = new RegExp(filter, 'i');
    return proxies.filter(p => p.name && regex.test(p.name)).map(p => p.name);
  } catch {
    const lower = filter.toLowerCase();
    return proxies.filter(p => p.name && p.name.toLowerCase().includes(lower)).map(p => p.name);
  }
};

export const generateConfig = (req: GenerateRequest): string => {
  const { proxies = [], proxyGroups = [], rules = [], settings = {} } = req;

  const {
    port = 7897, allowLan = true, mode = 'rule', logLevel = 'info',
    externalController = '127.0.0.1:9090',
  } = settings;

  // --- Build proxy-groups ---
  const clashProxyGroups: any[] = [];

  const mainGroupName = proxyGroups.length > 0
    ? `${proxyGroups[0].icon} ${proxyGroups[0].name}` : '🚀 节点选择';

  const autoGroup = proxyGroups.find(g => g.id === '2');
  const autoGroupName = autoGroup ? `${autoGroup.icon} ${autoGroup.name}` : null;

  for (const group of proxyGroups) {
    const fullName = `${group.icon} ${group.name}`;
    const matched = matchProxies(proxies, group.filter);
    const groupProxies: string[] = [];

    if (group.type === 'select') {
      if (group.id === '1') {
        if (autoGroupName) groupProxies.push(autoGroupName);
        groupProxies.push('DIRECT', 'REJECT', ...matched);
      } else if (group.id === '3') {
        groupProxies.push('REJECT', 'DIRECT', mainGroupName);
      } else if (group.id === '20' || group.id === '21') {
        groupProxies.push('DIRECT', 'REJECT', mainGroupName);
        if (autoGroupName) groupProxies.push(autoGroupName);
        groupProxies.push(...matched);
      } else {
        groupProxies.push(mainGroupName);
        if (autoGroupName) groupProxies.push(autoGroupName);
        groupProxies.push('DIRECT', 'REJECT', ...matched);
      }
    } else {
      groupProxies.push(...matched);
    }

    if (groupProxies.length === 0) groupProxies.push('DIRECT');

    const clashGroup: any = {
      name: fullName,
      type: group.type,
      proxies: [...new Set(groupProxies)],
    };

    if (group.type === 'url-test' || group.type === 'fallback') {
      clashGroup.url = 'https://www.gstatic.com/generate_204';
      clashGroup.interval = 300;
      clashGroup.lazy = false;
    }

    clashProxyGroups.push(clashGroup);
  }

  // --- Collect rule-providers and RULE-SET rules from group templates ---
  const usedProviders: Record<string, any> = {};
  const ruleSetRules: string[] = [];

  for (const group of proxyGroups) {
    const fullName = `${group.icon} ${group.name}`;
    if (!group.ruleSets) continue;

    for (const [providerName, noResolve] of group.ruleSets) {
      const provider = RULE_PROVIDERS[providerName];
      if (!provider) continue;
      usedProviders[providerName] = provider;
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

  // --- Full config ---
  const config: any = {
    'mixed-port': port,
    'allow-lan': allowLan,
    mode,
    'log-level': logLevel,
    'unified-delay': true,
    'tcp-concurrent': true,
    'find-process-mode': 'strict',
    'external-controller': externalController,
    dns: {
      enable: true, listen: '127.0.0.1:5335', 'enhanced-mode': 'fake-ip',
      'fake-ip-range': '198.18.0.1/16',
      'default-nameserver': ['180.76.76.76', '182.254.118.118', '8.8.8.8'],
      nameserver: ['180.76.76.76', '119.29.29.29', '223.5.5.5', '8.8.8.8', 'https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query'],
      fallback: ['https://dns.alidns.com/dns-query', 'https://doh.pub/dns-query', 'https://cloudflare-dns.com/dns-query', 'https://dns.google/dns-query'],
      'fallback-filter': { geoip: true, ipcidr: ['240.0.0.0/4', '0.0.0.0/32'], domain: ['+.google.com', '+.facebook.com', '+.twitter.com', '+.youtube.com'] },
    },
    profile: { 'store-selected': true, 'store-fake-ip': false },
    sniffer: {
      enable: true, 'parse-pure-ip': true,
      sniff: { HTTP: { ports: [80, '8080-8880'], 'override-destination': true }, QUIC: { ports: [443, 8443] }, TLS: { ports: [443, 8443] } },
    },
    'geodata-mode': true, 'geo-auto-update': true, 'geodata-loader': 'standard', 'geo-update-interval': 24,
    'geox-url': {
      geoip: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat',
      geosite: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat',
      mmdb: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/country.mmdb',
    },
    proxies,
    'proxy-groups': clashProxyGroups,
  };

  if (Object.keys(usedProviders).length > 0) {
    config['rule-providers'] = usedProviders;
  }
  config.rules = allRules;

  return yaml.stringify(config, { lineWidth: 0, defaultKeyType: 'PLAIN', defaultStringType: 'QUOTE_DOUBLE' });
};
