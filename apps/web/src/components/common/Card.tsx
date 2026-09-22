import React, { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800/80 dark:bg-slate-900/75 backdrop-blur-sm p-4 sm:p-5 text-slate-800 dark:text-slate-100 shadow-sm shadow-slate-200/50 dark:shadow-none transition-colors duration-200',
        hover && 'transition-all duration-200 hover:border-emerald-500/40 dark:hover:border-slate-700 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-900/90',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80 mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={cn('text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2', className)} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('space-y-3', className)} {...props}>
    {children}
  </div>
);
