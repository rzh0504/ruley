import React from 'react';



export default function NodeList({ nodes = [] }: { nodes?: any[] }) {
  return (
    <div className="rounded-xl bg-white dark:bg-[var(--color-card-dark)] shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-4 lg:col-span-6 xl:col-span-4 row-span-2 flex flex-col overflow-hidden max-h-[480px]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">活跃节点列表</h3>
        <div className="flex gap-2">
          <input
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[var(--color-primary)] outline-none w-24"
            placeholder="筛选..."
            type="text"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-0 flex flex-col styled-scrollbar bg-slate-50 dark:bg-slate-900/50">
        {nodes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">public_off</span>
            <p className="text-sm">暂无活跃节点</p>
            <p className="text-xs mt-1 text-center">请在左侧添加订阅来源并解析</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {nodes.map((node, index) => (
              <li key={index} className="flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex items-center justify-center size-8 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px]">dns</span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{node.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{node.server}:{node.port}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--color-primary)]/10 text-emerald-600 dark:text-[var(--color-primary)] border border-[var(--color-primary)]/20 whitespace-nowrap ml-2">
                  {node.type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
        <button className={`text-xs font-semibold ${nodes.length > 0 ? 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer' : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}>
          查看所有节点 ({nodes.length})
        </button>
      </div>
    </div>
  );
}
