import React, { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}) => {
  return (
    <Card hover className={cn('flex items-center justify-between p-4 sm:p-5', className)}>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-50">{value}</p>
        <div className="flex items-center gap-2 pt-1">
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded',
                trend.positive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
              )}
            >
              {trend.positive ? '+' : ''}{trend.value}
            </span>
          )}
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {icon && (
        <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-3 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/50 shadow-sm">
          {icon}
        </div>
      )}
    </Card>
  );
};
