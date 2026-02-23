import React from 'react';

interface StatCardProps {
  icon: string;
  title: string;
  value: string;
  unit?: string;
  progressColor?: string;
  progressValue?: number;
  segments?: boolean;
}

export default function StatCard({
  icon,
  title,
  value,
  unit,
  progressColor = 'bg-[var(--color-primary)]',
  progressValue = 70,
  segments = false,
}: StatCardProps) {
  return (
    <div className="rounded-xl bg-white dark:bg-[var(--color-card-dark)] shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-2 lg:col-span-2 xl:col-span-2 p-5 flex flex-col justify-center">
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">
        {value}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </p>
      {segments ? (
        <div className="flex gap-1 mt-3">
          <div className="h-1 flex-1 bg-green-500 rounded-full"></div>
          <div className="h-1 flex-1 bg-green-500 rounded-full"></div>
          <div className="h-1 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
      ) : (
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 mt-3 rounded-full overflow-hidden">
          <div className={`${progressColor} h-full`} style={{ width: `${progressValue}%` }}></div>
        </div>
      )}
    </div>
  );
}
