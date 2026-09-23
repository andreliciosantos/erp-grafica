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
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      if (body) {
        body.classList.add('dark');
        body.classList.remove('light');
      }
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      if (body) {
        body.classList.add('light');
        body.classList.remove('dark');
      }
    }
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark', // Padrão industrial prioritário

  setTheme: (theme: Theme) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('erp_theme', theme);
      }
    } catch {
      // Ignore storage restrictions
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

    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('erp_theme') as Theme | null;
        if (stored === 'light' || stored === 'dark') {
          initialTheme = stored;
        }
      }
    } catch {
      // Default to dark on storage error
      initialTheme = 'dark';
    }

    applyThemeClass(initialTheme);
    set({ theme: initialTheme });
  },
}));
