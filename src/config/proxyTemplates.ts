// ============================================================================
// Rule Provider Definitions
// ============================================================================

export interface RuleProviderDef {
  type: 'http';
  behavior: 'domain' | 'ipcidr';
  url: string;
  path: string;
  interval: number;
  format: string;
}

const BASE = 'https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo';

/** All available rule providers from MetaCubeX */
export const RULE_PROVIDERS: Record<string, RuleProviderDef> = {
  'category-ads-all': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/category-ads-all.mrs`, path: './ruleset/category-ads-all.mrs', interval: 86400, format: 'mrs' },
  'category-ai-chat-!cn': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/category-ai-chat-!cn.mrs`, path: './ruleset/category-ai-chat-!cn.mrs', interval: 86400, format: 'mrs' },
  'openai': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/openai.mrs`, path: './ruleset/openai.mrs', interval: 86400, format: 'mrs' },
  'anthropic': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/anthropic.mrs`, path: './ruleset/anthropic.mrs', interval: 86400, format: 'mrs' },
  'youtube': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/youtube.mrs`, path: './ruleset/youtube.mrs', interval: 86400, format: 'mrs' },
  'google': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/google.mrs`, path: './ruleset/google.mrs', interval: 86400, format: 'mrs' },
  'google-ip': { type: 'http', behavior: 'ipcidr', url: `${BASE}/geoip/google.mrs`, path: './ruleset/google-ip.mrs', interval: 86400, format: 'mrs' },
  'microsoft': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/microsoft.mrs`, path: './ruleset/microsoft.mrs', interval: 86400, format: 'mrs' },
  'onedrive': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/onedrive.mrs`, path: './ruleset/onedrive.mrs', interval: 86400, format: 'mrs' },
  'apple': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/apple.mrs`, path: './ruleset/apple.mrs', interval: 86400, format: 'mrs' },
  'icloud': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/icloud.mrs`, path: './ruleset/icloud.mrs', interval: 86400, format: 'mrs' },
  'telegram': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/telegram.mrs`, path: './ruleset/telegram.mrs', interval: 86400, format: 'mrs' },
  'telegram-ip': { type: 'http', behavior: 'ipcidr', url: `${BASE}/geoip/telegram.mrs`, path: './ruleset/telegram-ip.mrs', interval: 86400, format: 'mrs' },
  'twitter': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/twitter.mrs`, path: './ruleset/twitter.mrs', interval: 86400, format: 'mrs' },
  'twitter-ip': { type: 'http', behavior: 'ipcidr', url: `${BASE}/geoip/twitter.mrs`, path: './ruleset/twitter-ip.mrs', interval: 86400, format: 'mrs' },
  'facebook': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/facebook.mrs`, path: './ruleset/facebook.mrs', interval: 86400, format: 'mrs' },
  'instagram': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/instagram.mrs`, path: './ruleset/instagram.mrs', interval: 86400, format: 'mrs' },
  'whatsapp': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/whatsapp.mrs`, path: './ruleset/whatsapp.mrs', interval: 86400, format: 'mrs' },
  'facebook-ip': { type: 'http', behavior: 'ipcidr', url: `${BASE}/geoip/facebook.mrs`, path: './ruleset/facebook-ip.mrs', interval: 86400, format: 'mrs' },
  'steam': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/steam.mrs`, path: './ruleset/steam.mrs', interval: 86400, format: 'mrs' },
  'epicgames': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/epicgames.mrs`, path: './ruleset/epicgames.mrs', interval: 86400, format: 'mrs' },
  'ea': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/ea.mrs`, path: './ruleset/ea.mrs', interval: 86400, format: 'mrs' },
  'ubisoft': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/ubisoft.mrs`, path: './ruleset/ubisoft.mrs', interval: 86400, format: 'mrs' },
  'blizzard': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/blizzard.mrs`, path: './ruleset/blizzard.mrs', interval: 86400, format: 'mrs' },
  'gog': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/gog.mrs`, path: './ruleset/gog.mrs', interval: 86400, format: 'mrs' },
  'riot': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/riot.mrs`, path: './ruleset/riot.mrs', interval: 86400, format: 'mrs' },
  'github': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/github.mrs`, path: './ruleset/github.mrs', interval: 86400, format: 'mrs' },
  'gitlab': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/gitlab.mrs`, path: './ruleset/gitlab.mrs', interval: 86400, format: 'mrs' },
  'atlassian': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/atlassian.mrs`, path: './ruleset/atlassian.mrs', interval: 86400, format: 'mrs' },
  'aws': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/aws.mrs`, path: './ruleset/aws.mrs', interval: 86400, format: 'mrs' },
  'azure': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/azure.mrs`, path: './ruleset/azure.mrs', interval: 86400, format: 'mrs' },
  'cloudflare': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/cloudflare.mrs`, path: './ruleset/cloudflare.mrs', interval: 86400, format: 'mrs' },
  'digitalocean': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/digitalocean.mrs`, path: './ruleset/digitalocean.mrs', interval: 86400, format: 'mrs' },
  'vercel': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/vercel.mrs`, path: './ruleset/vercel.mrs', interval: 86400, format: 'mrs' },
  'netlify': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/netlify.mrs`, path: './ruleset/netlify.mrs', interval: 86400, format: 'mrs' },
  'cloudflare-ip': { type: 'http', behavior: 'ipcidr', url: `${BASE}/geoip/cloudflare.mrs`, path: './ruleset/cloudflare-ip.mrs', interval: 86400, format: 'mrs' },
  'docker': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/docker.mrs`, path: './ruleset/docker.mrs', interval: 86400, format: 'mrs' },
  'npmjs': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/npmjs.mrs`, path: './ruleset/npmjs.mrs', interval: 86400, format: 'mrs' },
  'jetbrains': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/jetbrains.mrs`, path: './ruleset/jetbrains.mrs', interval: 86400, format: 'mrs' },
  'stackexchange': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/stackexchange.mrs`, path: './ruleset/stackexchange.mrs', interval: 86400, format: 'mrs' },
  'dropbox': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/dropbox.mrs`, path: './ruleset/dropbox.mrs', interval: 86400, format: 'mrs' },
  'notion': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/notion.mrs`, path: './ruleset/notion.mrs', interval: 86400, format: 'mrs' },
  'paypal': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/paypal.mrs`, path: './ruleset/paypal.mrs', interval: 86400, format: 'mrs' },
  'stripe': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/stripe.mrs`, path: './ruleset/stripe.mrs', interval: 86400, format: 'mrs' },
  'wise': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/wise.mrs`, path: './ruleset/wise.mrs', interval: 86400, format: 'mrs' },
  'binance': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/binance.mrs`, path: './ruleset/binance.mrs', interval: 86400, format: 'mrs' },
  'private': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/private.mrs`, path: './ruleset/private.mrs', interval: 86400, format: 'mrs' },
  'private-ip': { type: 'http', behavior: 'ipcidr', url: `${BASE}/geoip/private.mrs`, path: './ruleset/private-ip.mrs', interval: 86400, format: 'mrs' },
  'geolocation-cn': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/geolocation-cn.mrs`, path: './ruleset/geolocation-cn.mrs', interval: 86400, format: 'mrs' },
  'cn': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/cn.mrs`, path: './ruleset/cn.mrs', interval: 86400, format: 'mrs' },
  'cn-ip': { type: 'http', behavior: 'ipcidr', url: `${BASE}/geoip/cn.mrs`, path: './ruleset/cn-ip.mrs', interval: 86400, format: 'mrs' },
  'geolocation-!cn': { type: 'http', behavior: 'domain', url: `${BASE}/geosite/geolocation-!cn.mrs`, path: './ruleset/geolocation-!cn.mrs', interval: 86400, format: 'mrs' },
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
  /** Rule-set entries: [providerName, noResolve] */
  ruleSets?: [string, boolean][];
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
