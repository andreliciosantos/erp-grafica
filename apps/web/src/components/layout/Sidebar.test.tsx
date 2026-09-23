import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { Role } from '../../types';

describe('Sidebar component', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().login('mock-token', 'mock-refresh', {
      id: 'usr-admin',
      name: 'Admin Grafica',
      email: 'admin@erpgrafica.com',
      role: Role.ADMIN,
    });
    useThemeStore.getState().setTheme('dark');
  });

  it('should render brand logo, menu title and navigation links', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByText('ERP Gráfica')).toBeInTheDocument();
    expect(screen.getByText('Menu Principal')).toBeInTheDocument();
    expect(screen.getByText('Visão Geral')).toBeInTheDocument();
    expect(screen.getByText('Chão de Fábrica (PCP)')).toBeInTheDocument();
    expect(screen.getByText('Equipe & RH')).toBeInTheDocument();
  });

  it('should render theme toggle selector at the bottom of sidebar', () => {
    renderWithProviders(<Sidebar />);
    const themeToggle = screen.getByTestId('theme-toggle-btn');
    expect(themeToggle).toBeInTheDocument();
    expect(screen.getByTestId('theme-light-btn')).toBeInTheDocument();
    expect(screen.getByTestId('theme-dark-btn')).toBeInTheDocument();
    expect(screen.getByTestId('theme-system-btn')).toBeInTheDocument();
    expect(screen.getByText('Escuro Ativo')).toBeInTheDocument();
  });

  it('should switch theme when light, dark, and system buttons are clicked', () => {
    renderWithProviders(<Sidebar />);
    const lightBtn = screen.getByTestId('theme-light-btn');
    const darkBtn = screen.getByTestId('theme-dark-btn');
    const systemBtn = screen.getByTestId('theme-system-btn');

    fireEvent.click(lightBtn);
    expect(useThemeStore.getState().theme).toBe('light');
    expect(screen.getByText('Claro Ativo')).toBeInTheDocument();

    fireEvent.click(darkBtn);
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(screen.getByText('Escuro Ativo')).toBeInTheDocument();

    fireEvent.click(systemBtn);
    expect(useThemeStore.getState().theme).toBe('system');
  });

  it('should render mobile backdrop and drawer when isMobileOpen is true', () => {
    const handleClose = vi.fn();
    renderWithProviders(<Sidebar isMobileOpen={true} onCloseMobile={handleClose} />);

    const backdrop = screen.getByTestId('sidebar-backdrop');
    expect(backdrop).toBeInTheDocument();

    // Click backdrop to close
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onCloseMobile when mobile close button is clicked', () => {
    const handleClose = vi.fn();
    renderWithProviders(<Sidebar isMobileOpen={true} onCloseMobile={handleClose} />);

    const closeBtn = screen.getByLabelText('Fechar menu de navegação');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onCloseMobile when a navigation link is clicked', () => {
    const handleClose = vi.fn();
    renderWithProviders(<Sidebar isMobileOpen={true} onCloseMobile={handleClose} />);

    const pcpLink = screen.getByText('Chão de Fábrica (PCP)');
    fireEvent.click(pcpLink);
    expect(handleClose).toHaveBeenCalled();
  });
});
