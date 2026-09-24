import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PwaInstallButton } from './PwaInstallButton';
import * as pwaHook from '../../hooks/usePWAInstall';

describe('PwaInstallButton component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Instalar App" button when app is not installed', () => {
    vi.spyOn(pwaHook, 'usePWAInstall').mockReturnValue({
      isInstallable: false,
      isInstalled: false,
      isIOS: false,
      promptInstall: vi.fn(),
    });

    render(<PwaInstallButton />);

    expect(screen.getByText('Instalar App')).toBeInTheDocument();
    expect(screen.getByText('PWA')).toBeInTheDocument();
  });

  it('triggers promptInstall when clicked and app is installable', async () => {
    const mockPromptInstall = vi.fn().mockResolvedValue(true);

    vi.spyOn(pwaHook, 'usePWAInstall').mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isIOS: false,
      promptInstall: mockPromptInstall,
    });

    render(<PwaInstallButton />);

    const button = screen.getByRole('button', { name: /Instalar App/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockPromptInstall).toHaveBeenCalled();
  });

  it('renders "App Instalado" badge when app is already installed in full variant', () => {
    vi.spyOn(pwaHook, 'usePWAInstall').mockReturnValue({
      isInstallable: false,
      isInstalled: true,
      isIOS: false,
      promptInstall: vi.fn(),
    });

    render(<PwaInstallButton variant="full" />);

    expect(screen.getByText('App Instalado')).toBeInTheDocument();
  });

  it('renders compact icon container when app is already installed in compact variant', () => {
    vi.spyOn(pwaHook, 'usePWAInstall').mockReturnValue({
      isInstallable: false,
      isInstalled: true,
      isIOS: false,
      promptInstall: vi.fn(),
    });

    const { container } = render(<PwaInstallButton variant="compact" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows iOS guide modal when clicked on iOS device', async () => {
    vi.spyOn(pwaHook, 'usePWAInstall').mockReturnValue({
      isInstallable: false,
      isInstalled: false,
      isIOS: true,
      promptInstall: vi.fn(),
    });

    render(<PwaInstallButton />);

    const button = screen.getByRole('button', { name: /Instalar App/i });
    fireEvent.click(button);

    expect(screen.getByText('Instalar no iPhone / iPad')).toBeInTheDocument();
    expect(screen.getByText(/Adicionar à Tela de Início/i)).toBeInTheDocument();

    const closeBtn = screen.getByText('Entendi');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Instalar no iPhone / iPad')).not.toBeInTheDocument();
  });
});
