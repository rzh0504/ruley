import React, { useState, useMemo } from 'react';
import { PROXY_GROUP_TEMPLATES, ProxyGroupTemplate, getDefaultRuleLinks } from '../../config/proxyTemplates';

interface ProxyGroupManagerProps {
  parsedNodes: any[];
  activeGroups: ProxyGroupTemplate[];
  onGroupsChange: (groups: ProxyGroupTemplate[]) => void;
}

export default function ProxyGroupManager({ parsedNodes, activeGroups, onGroupsChange }: ProxyGroupManagerProps) {
  const [selectedGroup, setSelectedGroup] = useState<ProxyGroupTemplate | null>(activeGroups.length > 0 ? activeGroups[0] : null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [unlockedGroups, setUnlockedGroups] = useState<Record<string, boolean>>({});

  const isPreset = selectedGroup ? PROXY_GROUP_TEMPLATES.some(t => t.id === selectedGroup.id) : false;
  const isUnlocked = selectedGroup ? (!isPreset || unlockedGroups[selectedGroup.id]) : false;

  const COMMON_FILTERS = [
    { label: '全部', value: '^(.*)$' },
    { label: '香港', value: '(香港|HK|Hong)' },
    { label: '台湾', value: '(台湾|TW|Taiwan|新北)' },
    { label: '新加坡', value: '(新加坡|狮城|SG|Singapore)' },
    { label: '日本', value: '(日本|川日|东京|大阪|泉日|埼玉|沪日|深日|JP|Japan)' },
    { label: '美国', value: '(美国|波特兰|达拉斯|俄勒冈|凤凰城|费城|洛杉矶|圣克拉拉|西雅图|芝加哥|US|United States)' },
    { label: '韩国', value: '(韩国|首尔|KR|Korea)' },
    { label: '家宽直连', value: '(家电|家宽|ISP|住宅)' },
    { label: '高优 / 专线', value: '(专线|IPLC|BGP|IEPL|高级|Premium)' },
    { label: '低倍率', value: '(0\\.\\d|\\b1\\.0\\b|低倍)' },
  ];

  // Helper function to handle filter button clicks
  const handleFilterClick = (filterValue: string) => {
    if (!selectedGroup) return;
    
    // If it's a completely exact match with a common filter, and user clicks it, they might want to toggle it off or swap.
    // For simplicity, clicking a filter directly sets the filter string.
    let newFilter = selectedGroup.filter;
    
    if (filterValue === '^(.*)$') {
        newFilter = filterValue; // reset to all
    } else {
        // If current filter is 'all' or empty, replace it
        if (!newFilter || newFilter === '^(.*)$' || newFilter === '(REJECT|DIRECT)') {
            newFilter = filterValue;
        } else {
            // Check if current filter is a simple OR group like (HK|SG)
            // If so, we might want to toggle this region in/out of the group dynamically.
            // But simple raw regex replacement is safer to just SET the value for this iteration to keep it simple.
            newFilter = filterValue; 
        }
    }
    
    updateSelectedGroup({ filter: newFilter });
  };

  // Count matched nodes per group
  const matchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of activeGroups) {
      try {
        const regex = new RegExp(group.filter, 'i');
        counts[group.id] = parsedNodes.filter(n => n.name && regex.test(n.name)).length;
      } catch {
        counts[group.id] = parsedNodes.filter(n => n.name && n.name.toLowerCase().includes(group.filter.toLowerCase())).length;
      }
    }
    return counts;
  }, [activeGroups, parsedNodes]);

  const toggleGroupActive = (template: ProxyGroupTemplate) => {
    const isAlreadyActive = activeGroups.some(g => g.id === template.id);
    if (isAlreadyActive) {
      if (activeGroups.length <= 1) return;
      const newGroups = activeGroups.filter(g => g.id !== template.id);
      if (selectedGroup?.id === template.id) {
        setSelectedGroup(newGroups[0]);
      }
      onGroupsChange(newGroups);
    } else {
      const newGroups = [...activeGroups, template].sort((a, b) => parseInt(a.id) - parseInt(b.id));
      onGroupsChange(newGroups);
    }
  };

  const updateSelectedGroup = (updates: Partial<ProxyGroupTemplate>) => {
    if (!selectedGroup) return;
    const updated = { ...selectedGroup, ...updates };
    setSelectedGroup(updated);
    onGroupsChange(activeGroups.map(g => g.id === updated.id ? updated : g));
  };

  return (
    <div className="rounded-xl bg-white dark:bg-[var(--color-card-dark)] shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-4 lg:col-span-6 xl:col-span-8 row-span-2 flex flex-col relative overflow-hidden max-h-[600px]">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-[20px]">hub</span>
            代理组管理
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">配置策略组与节点筛选规则。</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAddingGroup(!isAddingGroup)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-black text-xs font-bold transition-colors shadow-lg shadow-[var(--color-primary)]/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
                {isAddingGroup ? 'done' : 'add'}
            </span> 
            {isAddingGroup ? '完成选择' : '预设中添加'}
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* Sidebar List */}
        <div className="w-full md:w-1/3 border-r border-slate-100 dark:border-slate-700 flex flex-col bg-slate-50/30 dark:bg-slate-900/20 max-h-[300px] md:max-h-none md:absolute md:inset-y-0 md:left-0">
          <div className="p-2 space-y-1 overflow-y-auto flex-1 h-0 md:h-full styled-scrollbar">
            {activeGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`p-3 rounded-lg border cursor-pointer group relative transition-colors ${
                  selectedGroup?.id === group.id
                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-[16px]">{group.icon}</span> {group.name}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      group.color === 'blue'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : group.color === 'purple'
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                        : group.color === 'green'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {group.type}
                  </span>
                </div>
                <div className={`text-xs truncate ${selectedGroup?.id === group.id ? 'text-slate-500' : 'text-slate-400'}`} title={group.ruleLinks || '无配置'}>
                  {group.ruleLinks ? group.ruleLinks.split('\n')[0] + (group.ruleLinks.includes('\n') ? ' ...' : '') : '无外接规则'}
                </div>
                {selectedGroup?.id === group.id && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--color-primary)] rounded-r"></div>
                )}
              </div>
            ))}
            
            <button 
                onClick={() => setIsAddingGroup(true)}
                className="w-full mt-2 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
                <span className="material-symbols-outlined text-[18px]">library_add</span>
                浏览策略组预设
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="w-full md:w-2/3 p-5 flex flex-col h-full overflow-y-auto md:ml-[33.333333%]">
          {isAddingGroup ? (
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-4">
                  <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">配置向导：选择策略组</h4>
                      <p className="text-sm text-slate-500 mt-1">勾选您需要启用的路由分流规则，未勾选的规则将不会生成到最终配置文件中。</p>
                  </div>
                  <button onClick={() => setIsAddingGroup(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                      <span className="material-symbols-outlined text-slate-500">close</span>
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto styled-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
                   {PROXY_GROUP_TEMPLATES.map(template => {
                       const isActive = activeGroups.some(g => g.id === template.id);
                       return (
                           <div 
                                key={template.id}
                                onClick={() => toggleGroupActive(template)}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
                                    isActive 
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 dark:bg-[var(--color-primary)]/10' 
                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/50'
                                }`}
                            >
                               <div className="flex justify-between items-center">
                                    <span className="font-bold flex items-center gap-2">
                                        <span>{template.icon}</span> {template.name}
                                    </span>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        isActive ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-slate-300 dark:border-slate-600'
                                    }`}>
                                        {isActive && <span className="material-symbols-outlined text-[14px] text-black font-bold">check</span>}
                                    </div>
                               </div>
                               <p className="text-xs text-slate-500 dark:text-slate-400 m-0">{template.desc}</p>
                           </div>
                       )
                   })}
               </div>
               <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                   <button 
                        onClick={() => setIsAddingGroup(false)}
                        className="px-6 py-2 rounded-lg bg-[var(--color-primary)] text-black font-bold shadow-md hover:bg-[var(--color-primary-dark)] transition-colors cursor-pointer"
                    >
                       完成 ({activeGroups.length} 个已选)
                   </button>
               </div>
            </div>
          ) : selectedGroup ? (
            <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex gap-4">
                <div className="w-16">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">图标</label>
                    <div className="relative">
                    <button className="w-full h-10 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                        {selectedGroup.icon}
                    </button>
                    </div>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">组名称</label>
                    <input
                    key={`name-${selectedGroup.id}`}
                    className="w-full bg-slate-50 dark:bg-[#0f151b] border border-slate-200 dark:border-slate-700 rounded h-10 px-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none"
                    type="text"
                    defaultValue={selectedGroup.name}
                    onChange={(e) => updateSelectedGroup({name: e.target.value})}
                    />
                </div>
                </div>
                <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">策略类型</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {['select', 'url-test', 'fallback'].map((type) => (
                    <label key={type} className="cursor-pointer">
                        <input
                        key={`type-${selectedGroup.id}-${type}`}
                        type="radio"
                        name="groupType"
                        className="peer sr-only"
                        defaultChecked={selectedGroup.type === type}
                        onChange={() => updateSelectedGroup({type: type as any})}
                        />
                        <div className="flex flex-col items-center justify-center py-2 border rounded transition-all peer-checked:bg-[var(--color-primary)]/20 peer-checked:border-[var(--color-primary)] peer-checked:text-slate-900 dark:peer-checked:text-white border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <span className="text-xs font-bold uppercase">{type}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                            {type === 'select' ? '手动选择' : type === 'url-test' ? '自动测速' : '故障转移'}
                        </span>
                        </div>
                    </label>
                    ))}
                </div>
                </div>

                {(() => {
                  const hasRules = isPreset ? !!getDefaultRuleLinks(selectedGroup) : true;
                  
                  if (!hasRules && !selectedGroup.ruleLinks) {
                     return (
                        <div className="flex-1 flex flex-col min-h-0 mb-4 h-32">
                           <div className="flex justify-between items-center mb-1.5">
                               <label className="block text-xs font-bold text-slate-500">组说明</label>
                           </div>
                           <div className="w-full bg-slate-50 dark:bg-[#0f151b] border border-slate-200 dark:border-slate-700 rounded p-3 text-xs text-slate-500 dark:text-slate-400 flex-1 flex items-center justify-center italic">
                              {selectedGroup.desc || '该基础策略组不绑定外部规则'}
                           </div>
                        </div>
                     );
                  }

                  return (
                    <div className="flex-1 flex flex-col min-h-0 mb-4 h-32">
                      <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                              <label className="block text-xs font-bold text-slate-500">外部规则链接 (YAML/MRS)</label>
                              {isPreset && !isUnlocked && (
                                <button 
                                  onClick={() => setUnlockedGroups(prev => ({...prev, [selectedGroup.id]: true}))}
                                  className="flex items-center gap-1 text-[10px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 transition-colors"
                                  title="解锁后本次会话可编辑"
                                >
                                  <span className="material-symbols-outlined text-[12px]">lock</span>
                                  <span>解锁编辑</span>
                                </button>
                              )}
                              {isPreset && isUnlocked && (
                                <span className="text-[10px] text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px] animate-pulse">new_releases</span>
                                  当前修改仅本次有效
                                </span>
                              )}
                          </div>
                          <div className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded cursor-help" title="如需不解析ip，可在链接后加上 ,no-resolve">每行输入一条合法的规则链接</div>
                      </div>
                      <textarea
                          key={`rule-links-${selectedGroup.id}`}
                          className={`w-full bg-slate-50 dark:bg-[#0f151b] border border-slate-200 dark:border-slate-700 rounded p-3 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none resize-none font-mono flex-1 leading-relaxed whitespace-pre-wrap word-break-all ${!isUnlocked ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-[#0a0e12]' : ''}`}
                          value={selectedGroup.ruleLinks !== undefined ? selectedGroup.ruleLinks : getDefaultRuleLinks(selectedGroup)}
                          readOnly={!isUnlocked}
                          onChange={(e) => updateSelectedGroup({ruleLinks: e.target.value})}
                          placeholder="https://.../rules.yaml&#10;https://.../rules.mrs,no-resolve"
                      />
                    </div>
                  );
                })()}
                
                <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">快速节点匹配</label>
                      <div className="text-[10px] text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-700">点击以下标签快速筛选地域</div>
                  </div>
                  
                  {/* Quick Filter Buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                      {COMMON_FILTERS.map(filter => {
                          // Simple check if this filter is active
                          const isActive = selectedGroup.filter === filter.value;
                          return (
                              <button
                                  key={filter.label}
                                  onClick={() => handleFilterClick(filter.value)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                      isActive 
                                      ? 'bg-[var(--color-primary)] text-black border-[var(--color-primary)] shadow-md shadow-[var(--color-primary)]/20 scale-105' 
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                  }`}
                              >
                                  {filter.label}
                              </button>
                          );
                      })}
                  </div>

                  {/* Advanced Regex Input */}
                  <div className="mt-auto">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">进阶正则匹配 (Advanced)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm opacity-50">/</span>
                        <input
                            key={`filter-${selectedGroup.id}`}
                            className="w-full bg-white dark:bg-[#0f151b] border border-slate-200 dark:border-slate-700 rounded h-10 pl-7 pr-7 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] font-mono outline-none shadow-sm"
                            placeholder="^(HK|SG|US|JP)$"
                            type="text"
                            value={selectedGroup.filter}
                            onChange={(e) => updateSelectedGroup({filter: e.target.value})}
                        />
                        <span className="absolute right-3 top-2.5 text-slate-400 font-mono text-sm opacity-50">/</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-2">
                      当前策略组将自动包含所有匹配上述条件的真实节点。
                  </p>
                </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-20">hub</span>
                <p>请在左侧选择策略组进行配置</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
