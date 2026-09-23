import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { cn } from '../../lib/utils';

export interface ThemeToggleProps {
  variant?: 'segmented' | 'compact';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'segmented',
  className,
}) => {
  const { theme, setTheme } = useThemeStore();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        data-testid="theme-toggle-compact"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className={cn(
          'p-2 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer',
          theme === 'dark'
            ? 'bg-slate-800/90 text-indigo-400 border-slate-700/80 hover:bg-slate-700/80 hover:text-indigo-300'
            : 'bg-white text-amber-500 border-slate-200 hover:bg-slate-100 hover:text-amber-600 shadow-xs',
          className
        )}
        title={theme === 'dark' ? 'Ativar Tema Claro' : 'Ativar Tema Escuro'}
        aria-label={theme === 'dark' ? 'Ativar Tema Claro' : 'Ativar Tema Escuro'}
      >
        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
        <span>Aparência</span>
        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
          {theme === 'dark' ? 'Escuro Ativo' : 'Claro Ativo'}
        </span>
      </div>

      <div
        data-testid="theme-toggle-btn"
        className="grid grid-cols-2 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-950/80 border border-slate-300/80 dark:border-slate-800 gap-1"
      >
        <button
          type="button"
          data-testid="theme-light-btn"
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer',
            theme === 'light'
              ? 'bg-white text-slate-850 shadow-sm border border-slate-200/90'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          )}
        >
          <Sun className={cn('w-3.5 h-3.5', theme === 'light' ? 'text-amber-500' : '')} />
          <span>Claro</span>
        </button>

        <button
          type="button"
          data-testid="theme-dark-btn"
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer',
            theme === 'dark'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/80'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          )}
        >
          <Moon className={cn('w-3.5 h-3.5', theme === 'dark' ? 'text-indigo-400' : '')} />
          <span>Escuro</span>
        </button>
      </div>
    </div>
  );
};
