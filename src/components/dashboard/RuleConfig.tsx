import React, { useState } from 'react';
import CustomSelect from '../CustomSelect';

interface RuleItem {
  id: string;
  type: string;
  value: string;
  policy: string;
}

interface RuleConfigProps {
  rules: RuleItem[];
  onRulesChange: (rules: RuleItem[]) => void;
  policyOptions: { label: string; value: string }[];
}

export default function RuleConfig({ rules, onRulesChange, policyOptions }: RuleConfigProps) {
  const [ruleType, setRuleType] = useState('DOMAIN-SUFFIX');
  const [ruleValue, setRuleValue] = useState('');
  const [policy, setPolicy] = useState(policyOptions[0]?.value || 'DIRECT');

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleValue.trim()) return;

    const newRule: RuleItem = {
      id: Date.now().toString(),
      type: ruleType,
      value: ruleValue.trim(),
      policy: policy
    };

    onRulesChange([...rules, newRule]);
    setRuleValue('');
  };

  const handleRemoveRule = (id: string) => {
    onRulesChange(rules.filter(r => r.id !== id));
  };

  const handleMoveRule = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newRules = [...rules];
      [newRules[index - 1], newRules[index]] = [newRules[index], newRules[index - 1]];
      onRulesChange(newRules);
    } else if (direction === 'down' && index < rules.length - 1) {
      const newRules = [...rules];
      [newRules[index + 1], newRules[index]] = [newRules[index], newRules[index + 1]];
      onRulesChange(newRules);
    }
  };

  const ruleTypeOptions = [
    { label: 'DOMAIN-SUFFIX', value: 'DOMAIN-SUFFIX' },
    { label: 'DOMAIN-KEYWORD', value: 'DOMAIN-KEYWORD' },
    { label: 'DOMAIN', value: 'DOMAIN' },
    { label: 'IP-CIDR', value: 'IP-CIDR' },
    { label: 'IP-CIDR6', value: 'IP-CIDR6' },
    { label: 'GEOIP', value: 'GEOIP' },
    { label: 'PROCESS-NAME', value: 'PROCESS-NAME' },
    { label: 'MATCH', value: 'MATCH' },
  ];

  return (
    <div className="rounded-xl bg-white dark:bg-[var(--color-card-dark)] shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-4 lg:col-span-12 xl:col-span-12 p-5 flex flex-col md:flex-row gap-6 relative">
      <div className="flex-1">
        <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400">rule</span> 规则配置
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            {rules.length} 条
          </span>
        </h3>
        <p className="text-sm text-slate-500 mb-4">根据域名、IP或进程名定义流量行为。规则按自上而下的顺序处理。</p>
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto styled-scrollbar">
          {rules.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded border border-dashed border-slate-200 dark:border-slate-800">
              暂无自定义规则
            </div>
          ) : (
            rules.map((rule, index) => (
              <div key={rule.id} className="flex items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 group">
                <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMoveRule(index, 'up')}
                    disabled={index === 0}
                    className="text-slate-400 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer p-0 leading-none"
                  >
                    <span className="material-symbols-outlined text-[14px]">expand_less</span>
                  </button>
                  <button
                    onClick={() => handleMoveRule(index, 'down')}
                    disabled={index === rules.length - 1}
                    className="text-slate-400 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer p-0 leading-none"
                  >
                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                  </button>
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  rule.type.includes('DOMAIN') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                  rule.type.includes('IP') ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
                  rule.type === 'GEOIP' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
                  rule.type === 'PROCESS-NAME' ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300' :
                  'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {rule.type}
                </div>
                <div className="flex-1 font-mono text-sm text-slate-700 dark:text-slate-300 truncate">{rule.value}</div>
                <span className="material-symbols-outlined text-slate-400 text-[16px]">arrow_forward</span>
                <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold whitespace-nowrap ${
                  rule.policy === 'DIRECT' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                  rule.policy === 'REJECT' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                  'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                }`}>
                  {rule.policy}
                </div>
                <button
                  onClick={() => handleRemoveRule(rule.id)}
                  className="ml-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="删除规则"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-dashed border-slate-300 dark:border-slate-700">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">快速添加</h4>
        <form className="flex flex-col gap-3" onSubmit={handleAddRule}>
          <CustomSelect
            options={ruleTypeOptions}
            value={ruleType}
            onChange={setRuleType}
          />
          <input
            className="w-full rounded border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none px-3 py-2"
            placeholder="值 (例如 apple.com)"
            type="text"
            value={ruleValue}
            onChange={(e) => setRuleValue(e.target.value)}
          />
          <CustomSelect
            options={policyOptions}
            value={policy}
            onChange={setPolicy}
          />
          <button
            className="w-full bg-slate-900 dark:bg-white border border-transparent dark:border-slate-200 text-white dark:text-slate-900 text-sm font-bold py-2 rounded shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
            type="submit"
          >
            添加新规则
          </button>
        </form>
      </div>
    </div>
  );
}
