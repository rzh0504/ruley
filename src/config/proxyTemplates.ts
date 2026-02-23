export interface ProxyGroupTemplate {
  id: string;
  icon: string;
  name: string;
  type: 'select' | 'url-test' | 'fallback';
  desc: string;
  color: 'blue' | 'purple' | 'green' | 'yellow' | 'red';
  filter: string; // The regex or string used to match nodes
}

export const PROXY_GROUP_TEMPLATES: ProxyGroupTemplate[] = [
  { id: '1', icon: '🚀', name: '节点选择', type: 'select', desc: '手动选择代理节点', color: 'blue', filter: '^(.*)$' },
  { id: '2', icon: '⚡', name: '自动选择', type: 'url-test', desc: '根据延迟自动选择最优节点', color: 'purple', filter: '^(.*)$' },
  { id: '3', icon: '🛑', name: '广告拦截', type: 'select', desc: '广告及追踪器拦截策略', color: 'red', filter: '(REJECT|DIRECT)' },
  { id: '4', icon: '🤖', name: 'AI 服务', type: 'select', desc: 'OpenAI, Anthropic 等 AI 服务分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '5', icon: '📹', name: '油管视频', type: 'select', desc: 'YouTube 视频及相关服务分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '6', icon: '🔍', name: '谷歌服务', type: 'select', desc: 'Google 全局搜索及服务分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '7', icon: 'Ⓜ️', name: '微软服务', type: 'select', desc: 'Microsoft OneDrive, Office 等分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '8', icon: '🍏', name: '苹果服务', type: 'select', desc: 'Apple iCloud, App Store 等分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '9', icon: '📲', name: '电报消息', type: 'select', desc: 'Telegram 消息及媒体分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '10', icon: '🐦', name: '推特/X', type: 'select', desc: 'Twitter/X 平台分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '11', icon: '📘', name: 'Meta 系', type: 'select', desc: 'Facebook, Instagram, WhatsApp 等分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '12', icon: '🎮', name: 'Steam', type: 'select', desc: 'Steam 游戏平台的分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '13', icon: '🖥️', name: 'PC 游戏', type: 'select', desc: 'EA, Epic, Ubisoft, Riot 等平台分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '14', icon: '🐱', name: '代码托管', type: 'select', desc: 'GitHub, GitLab, Atlassian 平台的分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '15', icon: '☁️', name: '云服务', type: 'select', desc: 'AWS, Azure, Cloudflare 等公有云服务', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '16', icon: '🛠️', name: '开发工具', type: 'select', desc: 'Docker, npmjs, JetBrains 分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '17', icon: '💾', name: '网盘存储', type: 'select', desc: 'Dropbox, Notion 存储分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '18', icon: '💳', name: '支付平台', type: 'select', desc: 'PayPal, Stripe, Wise 金融类服务', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '19', icon: '₿', name: '加密货币', type: 'select', desc: 'Binance 等加密货币交易平台的分流', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '20', icon: '🏠', name: '私有网络', type: 'select', desc: '私有 IP、局域网的直连策略', color: 'green', filter: 'DIRECT' },
  { id: '21', icon: '🔒', name: '国内服务', type: 'select', desc: '针对国内 IP 和域名的直连策略', color: 'green', filter: 'DIRECT' },
  { id: '22', icon: '🌍', name: '非中国', type: 'select', desc: '中国大陆以外服务的通用代理', color: 'blue', filter: '^(HK|SG|US|JP)' },
  { id: '23', icon: '🐟', name: '漏网之鱼', type: 'select', desc: '未被其他规则匹配的最终策略', color: 'blue', filter: '^(.*)$' },
];

export const getDefaultActiveGroups = () => {
    // 默认给用户激活最基础的核心策略组
    return PROXY_GROUP_TEMPLATES.filter(g => ['1', '2', '23'].includes(g.id));
}
