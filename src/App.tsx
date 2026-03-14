import React, { useState, useCallback, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoginPage from "./components/LoginPage";
import ConfigManager from "./components/ConfigManager";
import GenerateCard from "./components/dashboard/GenerateCard";
import SubscriptionCard from "./components/dashboard/SubscriptionCard";
import ProxyGroupManager from "./components/dashboard/ProxyGroupManager";
import ConfigPreview from "./components/dashboard/ConfigPreview";
import NodeList from "./components/dashboard/NodeList";
import RuleConfig from "./components/dashboard/RuleConfig";
import { ToastProvider, toast } from "./components/Toast";
import { PROXY_GROUP_TEMPLATES, ProxyGroupTemplate, getDefaultRuleLinks } from './config/proxyTemplates';

// --- Auth helpers ---
const getToken = () => localStorage.getItem('ruley_token');
const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };
};

// Shared types for the data flow
export interface RuleItem {
  id: string;
  type: string;
  value: string;
  policy: string;
}

function getDefaultActiveGroups(): ProxyGroupTemplate[] {
  return PROXY_GROUP_TEMPLATES
    .filter(t => ['1', '2', '3', '6', '25'].includes(t.id))
    .map(t => ({
      ...t,
      ruleLinks: getDefaultRuleLinks(t)
    }));
}

export default function App() {
  // --- Auth state (only token in localStorage) ---
  const [authToken, setAuthToken] = useState<string | null>(getToken);

  const handleLogin = useCallback((token: string) => {
    setAuthToken(token);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('ruley_token');
    setAuthToken(null);
  }, []);

  // Auto-verify token on mount
  useEffect(() => {
    if (!authToken) return;
    fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${authToken}` } })
      .then(res => { if (!res.ok) handleLogout(); })
      .catch(() => handleLogout());
  }, []);

  // --- Core working state (in-memory only, no localStorage) ---
  const [parsedNodes, setParsedNodes] = useState<any[]>([]);
  const [proxyGroups, setProxyGroups] = useState<ProxyGroupTemplate[]>(getDefaultActiveGroups);
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [targetPlatform, setTargetPlatform] = useState<'clash' | 'mihomo'>('clash');
  const [advancedDns, setAdvancedDns] = useState(true);
  const [subscriptionUrls, setSubscriptionUrls] = useState('');
  const [generatedConfig, setGeneratedConfig] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudUrl, setCloudUrl] = useState('');
  const [activeView, setActiveView] = useState<'dashboard' | 'manager'>('dashboard');
  const [currentConfigId, setCurrentConfigId] = useState<number | null>(null);
  const [currentConfigName, setCurrentConfigName] = useState('');

  // Branch creation modal state
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchNameInput, setBranchNameInput] = useState('');
  const effectiveSubscriptionName = currentConfigName.trim() || 'ruley';

  // --- Generate config handler ---
  const handleGenerate = useCallback(async () => {
    if (parsedNodes.length === 0) {
      toast('warning', '请先导入节点再生成配置');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          proxies: parsedNodes,
          proxyGroups: proxyGroups.map(g => ({
            id: g.id,
            icon: g.icon,
            name: g.name,
            ruleSets: g.ruleSets,
            ruleLinks: g.ruleLinks,
            filter: g.filter,
            type: g.type,
            dialerProxy: g.dialerProxy,
          })),
          rules: rules,
          platform: targetPlatform,
          settings: { advancedDns }
        }),
      });
      const data = await res.json();
      if (res.status === 401) { handleLogout(); return; }
      if (data.success) {
        setGeneratedConfig(data.config);
      } else {
        toast('error', `生成失败: ${data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      toast('error', '发生错误：' + err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [parsedNodes, proxyGroups, rules, targetPlatform, advancedDns]);

  // --- Cloud Save handler (upsert: update if currentConfigId exists, else create) ---
  const handleCloudSave = useCallback(async () => {
    if (!subscriptionUrls.trim()) {
      toast('warning', '请先在"订阅来源输入"中填写至少一条节点链接');
      return;
    }

    setIsSavingCloud(true);
    setCloudUrl('');
    try {
      const res = await fetch('/api/cloud-save', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          urls: subscriptionUrls,
          configId: currentConfigId,
          name: effectiveSubscriptionName,
          proxyGroups: proxyGroups.map(g => ({
            id: g.id, icon: g.icon, name: g.name, ruleSets: g.ruleSets,
            ruleLinks: g.ruleLinks, filter: g.filter, type: g.type,
            color: g.color, desc: g.desc, dialerProxy: g.dialerProxy,
          })),
          rules,
          platform: targetPlatform,
          advancedDns,
          parsedNodes,
          generatedConfig,
          nodeCount: parsedNodes.length
        }),
      });
      const data = await res.json();
      if (res.status === 401) { handleLogout(); return; }
      if (data.success) {
        setCloudUrl(window.location.origin + data.subUrl);
        // Track the saved config ID for future updates
        if (data.configId) setCurrentConfigId(Number(data.configId));
        toast('success', currentConfigId ? '配置已更新并托管' : '配置已保存并托管');
      } else {
        toast('error', '保存失败: ' + data.error);
      }
    } catch (err: any) {
      console.error(err);
      toast('error', '无法连接到后端，请确保本地服务正在运行');
    } finally {
      setIsSavingCloud(false);
    }
  }, [subscriptionUrls, proxyGroups, rules, targetPlatform, advancedDns, parsedNodes, generatedConfig, currentConfigId, effectiveSubscriptionName]);

  // --- Save as Branch (new config with same URLs, linked via parent_id) ---
  const handleSaveAsBranch = useCallback(async () => {
    if (!subscriptionUrls.trim() || !currentConfigId) {
      toast('warning', '请先加载一个配置后再创建分支');
      return;
    }

    const branchName = branchNameInput.trim() || `分支 - ${new Date().toLocaleString('zh-CN')}`;
    setBranchModalOpen(false);
    setBranchNameInput('');

    setIsSavingCloud(true);
    try {
      const res = await fetch('/api/cloud-save', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          urls: subscriptionUrls,
          name: branchName,
          parentId: currentConfigId,
          proxyGroups: proxyGroups.map(g => ({
            id: g.id, icon: g.icon, name: g.name, ruleSets: g.ruleSets,
            ruleLinks: g.ruleLinks, filter: g.filter, type: g.type,
            color: g.color, desc: g.desc, dialerProxy: g.dialerProxy,
          })),
          rules,
          platform: targetPlatform,
          advancedDns,
          parsedNodes,
          generatedConfig,
          nodeCount: parsedNodes.length
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentConfigId(Number(data.configId));
        setCurrentConfigName(branchName);
        toast('success', `分支「${branchName}」已创建`);
      }
    } catch {
      toast('error', '创建分支失败');
    } finally {
      setIsSavingCloud(false);
    }
  }, [subscriptionUrls, proxyGroups, rules, targetPlatform, advancedDns, parsedNodes, generatedConfig, currentConfigId]);

  // --- Download YAML ---
  const handleDownload = useCallback(() => {
    if (!generatedConfig) return;
    const blob = new Blob([generatedConfig], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clash-config.yaml';
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedConfig]);

  // Build policy options from active proxy groups
  const policyOptions = [
    ...proxyGroups.map(g => ({ label: `${g.icon} ${g.name}`, value: `${g.icon} ${g.name}` })),
    { label: 'DIRECT', value: 'DIRECT' },
    { label: 'REJECT', value: 'REJECT' },
  ];

  // --- Load config from manager ---
  const handleLoadFromConfig = useCallback((config: any) => {
    // Reset cloud URL first to prevent stale parent link from showing
    setCloudUrl('');
    setSubscriptionUrls(config.urls || '');
    setTargetPlatform(config.platform || 'clash');
    setAdvancedDns(config.advanced_dns === 1);
    setCurrentConfigId(config.id);
    setCurrentConfigName(config.name || '');
    try {
      const groups = JSON.parse(config.proxy_groups || '[]');
      if (groups.length > 0) {
        // Enrich loaded groups with template defaults (color, desc) for backwards compat
        const enriched = groups.map((g: any) => {
          const template = PROXY_GROUP_TEMPLATES.find(t => t.id === g.id);
          return { ...template, ...g, color: g.color || template?.color || 'blue', desc: g.desc || template?.desc || '' };
        });
        setProxyGroups(enriched);
      }
    } catch {}
    try {
      const r = JSON.parse(config.rules || '[]');
      setRules(r);
    } catch {}
    // Restore cached nodes and config preview
    try {
      const nodes = config.parsed_nodes ? JSON.parse(config.parsed_nodes) : [];
      setParsedNodes(nodes);
    } catch { setParsedNodes([]); }
    setGeneratedConfig(config.generated_config || '');
    // Cloud URL is intentionally NOT restored here — it should only
    // appear after the user explicitly clicks "托管云端" or "更新云端"
    setActiveView('dashboard');
  }, []);

  // --- Auth gate ---
  if (!authToken) {
    return (
      <ToastProvider>
        <LoginPage onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
    <div className="min-h-screen flex flex-col bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-slate-900 dark:text-slate-100 font-display">
      <Header onLogout={handleLogout} activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">

        {activeView === 'manager' ? (
          <ConfigManager onLoadConfig={handleLoadFromConfig} />
        ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)]">
          <GenerateCard
            onGenerate={handleGenerate}
            onDownload={handleDownload}
            isGenerating={isGenerating}
            hasConfig={!!generatedConfig}
            nodesCount={parsedNodes.length}
            platform={targetPlatform}
            onPlatformChange={setTargetPlatform}
            advancedDns={advancedDns}
            onAdvancedDnsChange={setAdvancedDns}
            onCloudSave={handleCloudSave}
            isSavingCloud={isSavingCloud}
            cloudUrl={cloudUrl}
            onSaveAsBranch={() => setBranchModalOpen(true)}
            currentConfigName={currentConfigName}
            currentConfigId={currentConfigId}
          />
          <SubscriptionCard 
            subscriptionName={currentConfigName}
            onSubscriptionNameChange={setCurrentConfigName}
            urls={subscriptionUrls}
            onUrlsChange={setSubscriptionUrls}
            onNodesParsed={(nodes) => setParsedNodes(nodes)} 
          />
          <NodeList nodes={parsedNodes} />
          <ProxyGroupManager
            parsedNodes={parsedNodes}
            activeGroups={proxyGroups}
            onGroupsChange={setProxyGroups}
          />
          <ConfigPreview config={generatedConfig} />
          <RuleConfig
            rules={rules}
            onRulesChange={setRules}
            policyOptions={policyOptions}
          />
        </div>
        </>
        )}
      </main>

      {/* Branch name modal */}
      {branchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">创建配置分支</h3>
            <p className="text-sm text-slate-500 mb-4">为当前配置创建一个独立分支，独立修改互不影响。</p>
            <input
              autoFocus
              className="w-full bg-slate-50 dark:bg-[#0f151b] border border-slate-200 dark:border-slate-700 rounded-lg h-11 px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder={`分支 - ${new Date().toLocaleString('zh-CN')}`}
              value={branchNameInput}
              onChange={(e) => setBranchNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAsBranch(); }}
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => { setBranchModalOpen(false); setBranchNameInput(''); }}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >取消</button>
              <button
                onClick={handleSaveAsBranch}
                className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-black text-sm font-bold shadow-md hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer"
              >创建分支</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
    </ToastProvider>
  );
}
