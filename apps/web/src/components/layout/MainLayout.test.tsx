import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { MainLayout } from './MainLayout';
import { useAuthStore } from '../../stores/authStore';
import { Role } from '../../types';

describe('MainLayout component', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().login('mock-token', 'mock-refresh', {
      id: 'usr-admin',
      name: 'Admin Teste',
      email: 'admin@erpgrafica.com',
      role: Role.ADMIN,
    });
  });

  it('should render header with user name, role and mobile hamburger button', () => {
    renderWithProviders(<MainLayout />);
    expect(screen.getByText('Admin Teste')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-menu-btn')).toBeInTheDocument();
  });

  it('should open mobile sidebar drawer when hamburger button is clicked', () => {
    renderWithProviders(<MainLayout />);

    // Initially backdrop should not be in document
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();

    // Click mobile hamburger button
    const menuBtn = screen.getByTestId('mobile-menu-btn');
    fireEvent.click(menuBtn);

    // Backdrop is now visible
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument();

    // Click backdrop to close
    fireEvent.click(screen.getByTestId('sidebar-backdrop'));
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
  });
});
