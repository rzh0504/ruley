import React, { useState, useCallback, useEffect } from "react";
import Header from "./components/Header";
import GenerateCard from "./components/dashboard/GenerateCard";
import SubscriptionCard from "./components/dashboard/SubscriptionCard";
import ProxyGroupManager from "./components/dashboard/ProxyGroupManager";
import ConfigPreview from "./components/dashboard/ConfigPreview";
import NodeList from "./components/dashboard/NodeList";
import RuleConfig from "./components/dashboard/RuleConfig";
import { PROXY_GROUP_TEMPLATES, ProxyGroupTemplate, getDefaultRuleLinks } from './config/proxyTemplates';

// Shared types for the data flow
export interface RuleItem {
  id: string;
  type: string;
  value: string;
  policy: string;
}

// --- LocalStorage helpers ---
const STORAGE_KEYS = {
  proxyGroups: 'ruley_proxyGroups',
  rules: 'ruley_rules',
};

function getDefaultActiveGroups(): ProxyGroupTemplate[] {
  return PROXY_GROUP_TEMPLATES.map(t => ({
    ...t,
    ruleLinks: getDefaultRuleLinks(t)
  }));
}

function loadProxyGroups(): ProxyGroupTemplate[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.proxyGroups);
    if (!saved) return getDefaultActiveGroups();
    const parsed = JSON.parse(saved) as Array<{ id: string } & Partial<ProxyGroupTemplate>>;
    // Restore full template objects (including ruleSets) and merge user edits
    return parsed.map(saved => {
      const template = PROXY_GROUP_TEMPLATES.find(t => t.id === saved.id);
      if (!template) {
        // If it's a custom group (future support), load saved ruleLinks normally
        return {
           ...saved,
           ruleSets: saved.ruleSets || []
        } as ProxyGroupTemplate; 
      }
      return { 
        ...template, 
        ...saved, 
        ruleSets: template.ruleSets, 
        // Force reset preset groups to default ruleLinks on EVERY load (session only edits)
        ruleLinks: getDefaultRuleLinks(template)
      };
    }).filter(Boolean) as ProxyGroupTemplate[];
  } catch {
    return getDefaultActiveGroups();
  }
}

function loadRules(): RuleItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.rules);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export default function App() {
  // --- Core state lifted to App level, persisted via localStorage ---
  const [parsedNodes, setParsedNodes] = useState<any[]>([]);
  const [proxyGroups, setProxyGroups] = useState<ProxyGroupTemplate[]>(loadProxyGroups);
  const [rules, setRules] = useState<RuleItem[]>(loadRules);
  const [generatedConfig, setGeneratedConfig] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.proxyGroups, JSON.stringify(
      proxyGroups.map(g => ({
        id: g.id, icon: g.icon, name: g.name, type: g.type, color: g.color, filter: g.filter,
        ruleLinks: g.ruleLinks
      }))
    ));
  }, [proxyGroups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.rules, JSON.stringify(rules));
  }, [rules]);

  // --- Generate config handler ---
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('http://127.0.0.1:4000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proxies: parsedNodes,
          proxyGroups: proxyGroups.map(g => ({
            id: g.id,
            icon: g.icon,
            name: g.name,
            ruleSets: g.ruleSets,
            ruleLinks: g.ruleLinks,
          })),
          rules,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedConfig(data.config);
      } else {
        alert(`生成失败: ${data.error}`);
      }
    } catch (err: any) {
      alert(`无法连接到本地服务: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [parsedNodes, proxyGroups, rules]);

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

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-[var(--color-background-light)] dark:bg-[var(--color-background-dark)] text-slate-900 dark:text-slate-100 font-display">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              控制台
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              管理您的订阅节点及路由规则配置。
            </p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
              当前计划: 专业版
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)]">
          <GenerateCard
            onGenerate={handleGenerate}
            onDownload={handleDownload}
            isGenerating={isGenerating}
            hasConfig={!!generatedConfig}
            nodesCount={parsedNodes.length}
          />
          <SubscriptionCard onNodesParsed={(nodes) => setParsedNodes(nodes)} />
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
      </main>
    </div>
  );
}
