import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
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
  const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeStore();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        data-testid="theme-toggle-compact"
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer',
          resolvedTheme === 'dark'
            ? 'bg-slate-800/90 text-indigo-400 border-slate-700/80 hover:bg-slate-700/80 hover:text-indigo-300'
            : 'bg-white text-amber-500 border-slate-200 hover:bg-slate-100 hover:text-amber-600 shadow-xs',
          className
        )}
        title={resolvedTheme === 'dark' ? 'Ativar Tema Claro' : 'Ativar Tema Escuro'}
        aria-label={resolvedTheme === 'dark' ? 'Ativar Tema Claro' : 'Ativar Tema Escuro'}
      >
        {resolvedTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </button>
    );
  }

  const getStatusLabel = () => {
    if (theme === 'dark') return 'Escuro Ativo';
    if (theme === 'light') return 'Claro Ativo';
    return resolvedTheme === 'dark' ? 'Auto (Escuro)' : 'Auto (Claro)';
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
        <span>Aparência</span>
        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
          {getStatusLabel()}
        </span>
      </div>

      <div
        data-testid="theme-toggle-btn"
        className="grid grid-cols-3 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-950/80 border border-slate-300/80 dark:border-slate-800 gap-1"
      >
        <button
          type="button"
          data-testid="theme-light-btn"
          onClick={() => setTheme('light')}
          className={cn(
            'flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer',
            theme === 'light'
              ? 'bg-white text-slate-850 shadow-sm border border-slate-200/90'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          )}
          title="Modo Claro"
        >
          <Sun className={cn('w-3.5 h-3.5 shrink-0', theme === 'light' ? 'text-amber-500' : '')} />
          <span className="truncate">Claro</span>
        </button>

        <button
          type="button"
          data-testid="theme-dark-btn"
          onClick={() => setTheme('dark')}
          className={cn(
            'flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer',
            theme === 'dark'
              ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700/80'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          )}
          title="Modo Escuro"
        >
          <Moon className={cn('w-3.5 h-3.5 shrink-0', theme === 'dark' ? 'text-indigo-400' : '')} />
          <span className="truncate">Escuro</span>
        </button>

        <button
          type="button"
          data-testid="theme-system-btn"
          onClick={() => setTheme('system')}
          className={cn(
            'flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer',
            theme === 'system'
              ? 'bg-emerald-600/90 text-white shadow-sm border border-emerald-500/80'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          )}
          title="Acompanhar tema do dispositivo (Sistema)"
        >
          <Laptop className={cn('w-3.5 h-3.5 shrink-0', theme === 'system' ? 'text-emerald-100' : '')} />
          <span className="truncate">Auto</span>
        </button>
      </div>
    </div>
  );
};
