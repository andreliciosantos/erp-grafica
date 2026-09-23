import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initialize: () => void;
}

export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  }
  return 'dark';
};

export const applyThemeClass = (theme: Theme, overrideResolved?: 'light' | 'dark'): 'light' | 'dark' => {
  const resolved = overrideResolved ?? (theme === 'system' ? getSystemTheme() : theme);

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const body = document.body;

    if (resolved === 'dark') {
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

    try {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#090e18' : '#f8fafc');
    } catch {
      // Ignore in non-browser environments
    }
  }

  return resolved;
};

let mediaQueryListenerAttached = false;

export const _resetListenerForTesting = () => {
  mediaQueryListenerAttached = false;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'dark',

  setTheme: (theme: Theme) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('erp_theme', theme);
        localStorage.setItem('erp_theme_set_by_user', 'true');
      }
    } catch {
      // Ignore storage restrictions
    }
    const resolved = applyThemeClass(theme);
    set({ theme, resolvedTheme: resolved });
  },

  toggleTheme: () => {
    const current = get().resolvedTheme;
    const next: Theme = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initialize: () => {
    let initialTheme: Theme = 'system';

    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('erp_theme') as Theme | null;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          initialTheme = stored;
        } else {
          initialTheme = 'system';
        }
      }
    } catch {
      initialTheme = 'system';
    }

    const resolved = applyThemeClass(initialTheme);
    set({ theme: initialTheme, resolvedTheme: resolved });

    if (!mediaQueryListenerAttached && typeof window !== 'undefined' && window.matchMedia) {
      try {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = (e: MediaQueryListEvent | MediaQueryList) => {
          const currentTheme = get().theme;
          const isDark = typeof e.matches === 'boolean' ? e.matches : getSystemTheme() === 'dark';
          const newResolved: 'light' | 'dark' = isDark ? 'dark' : 'light';

          if (currentTheme === 'system') {
            applyThemeClass('system', newResolved);
            set({ resolvedTheme: newResolved });
          } else {
            // Se o usuário alternou o modo do próprio dispositivo, acompanha nativamente
            get().setTheme(newResolved);
          }
        };

        if (mql.addEventListener) {
          mql.addEventListener('change', handleSystemChange);
        } else if ((mql as any).addListener) {
          (mql as any).addListener(handleSystemChange);
        }
        mediaQueryListenerAttached = true;
      } catch {
        // Ignore in environments without matchMedia
      }
    }
  },
}));
