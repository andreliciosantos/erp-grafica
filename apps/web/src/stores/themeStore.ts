import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initialize: () => void;
}

const applyThemeClass = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark', // default fallback

  setTheme: (theme: Theme) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('erp_theme', theme);
    }
    applyThemeClass(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initialize: () => {
    let initialTheme: Theme = 'dark';

    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('erp_theme') as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        initialTheme = stored;
      } else if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
      ) {
        initialTheme = 'light';
      }
    }

    applyThemeClass(initialTheme);
    set({ theme: initialTheme });
  },
}));
