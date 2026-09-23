import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useThemeStore, _resetListenerForTesting } from './themeStore';

describe('themeStore', () => {
  const resetMatchMedia = (matches = false) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'light');
    resetMatchMedia(false);
    _resetListenerForTesting();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with system theme by default if no preference is saved', () => {
    useThemeStore.getState().initialize();
    expect(useThemeStore.getState().theme).toBe('system');
    // In test environment default setup, matchMedia has matches: false (light)
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('should initialize with dark system theme if prefers-color-scheme is dark', () => {
    resetMatchMedia(true);

    useThemeStore.getState().initialize();
    expect(useThemeStore.getState().theme).toBe('system');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should initialize with stored light theme from localStorage', () => {
    localStorage.setItem('erp_theme', 'light');
    useThemeStore.getState().initialize();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should initialize with stored dark theme from localStorage', () => {
    localStorage.setItem('erp_theme', 'dark');
    useThemeStore.getState().initialize();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should initialize with stored system theme from localStorage', () => {
    localStorage.setItem('erp_theme', 'system');
    useThemeStore.getState().initialize();
    expect(useThemeStore.getState().theme).toBe('system');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('should toggle theme from dark to light and vice-versa', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('erp_theme')).toBe('light');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(localStorage.getItem('erp_theme')).toBe('dark');
  });

  it('should set theme explicitly and persist in localStorage', () => {
    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(localStorage.getItem('erp_theme')).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);

    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(localStorage.getItem('erp_theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    useThemeStore.getState().setTheme('system');
    expect(useThemeStore.getState().theme).toBe('system');
    expect(localStorage.getItem('erp_theme')).toBe('system');
  });

  it('should respond to mediaQuery system change when in system mode', () => {
    let listenerCallback: ((e: any) => void) | null = null;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event, cb) => {
          if (event === 'change') listenerCallback = cb;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    useThemeStore.getState().initialize();
    expect(useThemeStore.getState().theme).toBe('system');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Simulate system switching to dark mode
    if (listenerCallback) {
      (listenerCallback as any)({ matches: true });
    }
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
