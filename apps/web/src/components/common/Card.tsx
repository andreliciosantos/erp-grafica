import React, { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-sm p-5 text-slate-100 shadow-sm',
        hover && 'transition-all duration-200 hover:border-slate-700 hover:shadow-md hover:bg-slate-900/90',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={cn('text-base font-semibold text-slate-100 flex items-center gap-2', className)} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('space-y-3', className)} {...props}>
    {children}
  </div>
);
