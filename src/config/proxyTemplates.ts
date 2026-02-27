// ============================================================================
// Rule Provider Definitions
// ============================================================================

export interface RuleProviderDef {
  type: 'http';
  behavior: 'domain' | 'ipcidr';
  url: string;
  path: string;
  yamlUrl: string;
  yamlPath: string;
  interval: number;
  format: 'mrs' | 'yaml';
}

const BASE = 'https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo';

const makeProvider = (name: string, behavior: 'domain' | 'ipcidr', subdir: 'geosite' | 'geoip' = 'geosite'): RuleProviderDef => ({
  type: 'http',
  behavior,
  url: `${BASE}/${subdir}/${name}.mrs`,
  path: `./ruleset/${name}.mrs`,
  yamlUrl: `${BASE}/${subdir}/${name}.yaml`,
  yamlPath: `./ruleset/${name}.yaml`,
  interval: 86400,
  format: 'mrs', // 默认值
});

/** All available rule providers from MetaCubeX */
export const RULE_PROVIDERS: Record<string, RuleProviderDef> = {
  'category-ads-all': makeProvider('category-ads-all', 'domain'),
  'category-ai-chat-!cn': makeProvider('category-ai-chat-!cn', 'domain'),
  'openai': makeProvider('openai', 'domain'),
  'anthropic': makeProvider('anthropic', 'domain'),
  'youtube': makeProvider('youtube', 'domain'),
  'google': makeProvider('google', 'domain'),
  'google-ip': makeProvider('google', 'ipcidr', 'geoip'),
  'microsoft': makeProvider('microsoft', 'domain'),
  'onedrive': makeProvider('onedrive', 'domain'),
  'apple': makeProvider('apple', 'domain'),
  'icloud': makeProvider('icloud', 'domain'),
  'telegram': makeProvider('telegram', 'domain'),
  'telegram-ip': makeProvider('telegram', 'ipcidr', 'geoip'),
  'twitter': makeProvider('twitter', 'domain'),
  'twitter-ip': makeProvider('twitter', 'ipcidr', 'geoip'),
  'facebook': makeProvider('facebook', 'domain'),
  'instagram': makeProvider('instagram', 'domain'),
  'whatsapp': makeProvider('whatsapp', 'domain'),
  'facebook-ip': makeProvider('facebook', 'ipcidr', 'geoip'),
  'steam': makeProvider('steam', 'domain'),
  'epicgames': makeProvider('epicgames', 'domain'),
  'ea': makeProvider('ea', 'domain'),
  'ubisoft': makeProvider('ubisoft', 'domain'),
  'blizzard': makeProvider('blizzard', 'domain'),
  'gog': makeProvider('gog', 'domain'),
  'riot': makeProvider('riot', 'domain'),
  'github': makeProvider('github', 'domain'),
  'gitlab': makeProvider('gitlab', 'domain'),
  'atlassian': makeProvider('atlassian', 'domain'),
  'aws': makeProvider('aws', 'domain'),
  'azure': makeProvider('azure', 'domain'),
  'cloudflare': makeProvider('cloudflare', 'domain'),
  'digitalocean': makeProvider('digitalocean', 'domain'),
  'vercel': makeProvider('vercel', 'domain'),
  'netlify': makeProvider('netlify', 'domain'),
  'cloudflare-ip': makeProvider('cloudflare', 'ipcidr', 'geoip'),
  'docker': makeProvider('docker', 'domain'),
  'npmjs': makeProvider('npmjs', 'domain'),
  'jetbrains': makeProvider('jetbrains', 'domain'),
  'stackexchange': makeProvider('stackexchange', 'domain'),
  'dropbox': makeProvider('dropbox', 'domain'),
  'notion': makeProvider('notion', 'domain'),
  'paypal': makeProvider('paypal', 'domain'),
  'stripe': makeProvider('stripe', 'domain'),
  'wise': makeProvider('wise', 'domain'),
  'binance': makeProvider('binance', 'domain'),
  'private': makeProvider('private', 'domain'),
  'private-ip': makeProvider('private', 'ipcidr', 'geoip'),
  'geolocation-cn': makeProvider('geolocation-cn', 'domain'),
  'cn': makeProvider('cn', 'domain'),
  'cn-ip': makeProvider('cn', 'ipcidr', 'geoip'),
  'geolocation-!cn': makeProvider('geolocation-!cn', 'domain'),
};

// ============================================================================
// Proxy Group Templates
// ============================================================================

export interface ProxyGroupTemplate {
  id: string;
  icon: string;
  name: string;
  type: 'select' | 'url-test' | 'fallback';
  desc: string;
  color: 'blue' | 'purple' | 'green' | 'yellow' | 'red';
  filter: string;
  /** Primary ruleset URL if the user provides one for this group */
  ruleLinks?: string;
  /** Rule-set entries: [providerName, noResolve] */
  ruleSets?: [string, boolean][];
}

export function getDefaultRuleLinks(template: ProxyGroupTemplate): string {
  if (!template.ruleSets || template.ruleSets.length === 0) return '';
  return template.ruleSets.map(([name, noResolve]) => {
    const provider = RULE_PROVIDERS[name];
    if (!provider) return '';
    return provider.url + (noResolve ? ',no-resolve' : '');
  }).filter(Boolean).join('\n');
}

export const PROXY_GROUP_TEMPLATES: ProxyGroupTemplate[] = [
  { id: '1', icon: '🚀', name: '节点选择', type: 'select', desc: '手动选择代理节点', color: 'blue', filter: '^(.*)$' },
  { id: '2', icon: '⚡', name: '自动选择', type: 'url-test', desc: '根据延迟自动选择最优节点', color: 'purple', filter: '^(.*)$' },
  { id: '3', icon: '🛑', name: '广告拦截', type: 'select', desc: '广告及追踪器拦截策略', color: 'red', filter: '(REJECT|DIRECT)',
    ruleSets: [['category-ads-all', false]] },
  { id: '4', icon: '🤖', name: 'AI 服务', type: 'select', desc: 'OpenAI, Anthropic 等 AI 服务分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['category-ai-chat-!cn', false], ['openai', false], ['anthropic', false]] },
  { id: '5', icon: '📹', name: '油管视频', type: 'select', desc: 'YouTube 视频及相关服务分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['youtube', false]] },
  { id: '6', icon: '🔍', name: '谷歌服务', type: 'select', desc: 'Google 全局搜索及服务分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['google', false], ['google-ip', true]] },
  { id: '7', icon: 'Ⓜ️', name: '微软服务', type: 'select', desc: 'Microsoft OneDrive, Office 等分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['microsoft', false], ['onedrive', false]] },
  { id: '8', icon: '🍏', name: '苹果服务', type: 'select', desc: 'Apple iCloud, App Store 等分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['apple', false], ['icloud', false]] },
  { id: '9', icon: '📲', name: '电报消息', type: 'select', desc: 'Telegram 消息及媒体分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['telegram', false], ['telegram-ip', true]] },
  { id: '10', icon: '🐦', name: '推特/X', type: 'select', desc: 'Twitter/X 平台分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['twitter', false], ['twitter-ip', true]] },
  { id: '11', icon: '📘', name: 'Meta 系', type: 'select', desc: 'Facebook, Instagram, WhatsApp 等分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['facebook', false], ['instagram', false], ['whatsapp', false], ['facebook-ip', true]] },
  { id: '12', icon: '🎮', name: 'Steam', type: 'select', desc: 'Steam 游戏平台的分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['steam', false]] },
  { id: '13', icon: '🖥️', name: 'PC 游戏', type: 'select', desc: 'EA, Epic, Ubisoft, Riot 等平台分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['epicgames', false], ['ea', false], ['ubisoft', false], ['blizzard', false], ['gog', false], ['riot', false]] },
  { id: '14', icon: '🐱', name: '代码托管', type: 'select', desc: 'GitHub, GitLab, Atlassian 平台的分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['github', false], ['gitlab', false], ['atlassian', false]] },
  { id: '15', icon: '☁️', name: '云服务', type: 'select', desc: 'AWS, Azure, Cloudflare 等公有云服务', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['aws', false], ['azure', false], ['cloudflare', false], ['digitalocean', false], ['vercel', false], ['netlify', false], ['cloudflare-ip', true]] },
  { id: '16', icon: '🛠️', name: '开发工具', type: 'select', desc: 'Docker, npmjs, JetBrains 分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['docker', false], ['npmjs', false], ['jetbrains', false], ['stackexchange', false]] },
  { id: '17', icon: '💾', name: '网盘存储', type: 'select', desc: 'Dropbox, Notion 存储分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['dropbox', false], ['notion', false]] },
  { id: '18', icon: '💳', name: '支付平台', type: 'select', desc: 'PayPal, Stripe, Wise 金融类服务', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['paypal', false], ['stripe', false], ['wise', false]] },
  { id: '19', icon: '₿', name: '加密货币', type: 'select', desc: 'Binance 等加密货币交易平台的分流', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['binance', false]] },
  { id: '20', icon: '🏠', name: '私有网络', type: 'select', desc: '私有 IP、局域网的直连策略', color: 'green', filter: 'DIRECT',
    ruleSets: [['private', false], ['private-ip', true]] },
  { id: '21', icon: '🔒', name: '国内服务', type: 'select', desc: '针对国内 IP 和域名的直连策略', color: 'green', filter: 'DIRECT',
    ruleSets: [['geolocation-cn', false], ['cn', false], ['cn-ip', true]] },
  { id: '22', icon: '🌍', name: '非中国', type: 'select', desc: '中国大陆以外服务的通用代理', color: 'blue', filter: '^(HK|SG|US|JP)',
    ruleSets: [['geolocation-!cn', false]] },
  { id: '23', icon: '🐟', name: '漏网之鱼', type: 'select', desc: '未被其他规则匹配的最终策略', color: 'blue', filter: '^(.*)$' },
];

export const getDefaultActiveGroups = () => {
    return PROXY_GROUP_TEMPLATES.filter(g => ['1', '2', '23'].includes(g.id));
}
