import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstall, BeforeInstallPromptEvent } from './usePWAInstall';

describe('usePWAInstall hook', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('should initialize with isInstallable false and isInstalled false by default in browser', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstalled).toBe(false);
    expect(result.current.isInstallable).toBe(false);
  });

  it('should detect when application is running in standalone mode', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstalled).toBe(true);
  });

  it('should capture beforeinstallprompt event and allow calling promptInstall', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const { result } = renderHook(() => usePWAInstall());

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });

    const mockEvent = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
    Object.defineProperty(mockEvent, 'prompt', { value: mockPrompt });
    Object.defineProperty(mockEvent, 'userChoice', { value: mockChoice });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    expect(result.current.isInstallable).toBe(true);

    let installedResult = false;
    await act(async () => {
      installedResult = await result.current.promptInstall();
    });

    expect(mockPrompt).toHaveBeenCalled();
    expect(installedResult).toBe(true);
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it('should handle appinstalled event', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    const { result } = renderHook(() => usePWAInstall());

    expect(result.current.isInstalled).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });
});
