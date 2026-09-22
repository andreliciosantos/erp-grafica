import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '../../test/test-utils';
import { LoginPage } from './LoginPage';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { Role } from '../../types';

vi.mock('../../lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('should render login header, form inputs and action buttons', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText('ERP Gráfica Modular')).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail de acesso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar no sistema/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preencher administrador/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preencher operador/i })).toBeInTheDocument();
  });

  it('should autofill credentials when clicking Preencher Administrador', async () => {
    renderWithProviders(<LoginPage />);

    const adminBtn = screen.getByRole('button', { name: /preencher administrador/i });
    await userEvent.click(adminBtn);

    expect(screen.getByLabelText(/e-mail de acesso/i)).toHaveValue('admin@erpgrafica.com');
    expect(screen.getByLabelText(/senha/i)).toHaveValue('admin123');
  });

  it('should autofill credentials when clicking Preencher Operador', async () => {
    renderWithProviders(<LoginPage />);

    const operadorBtn = screen.getByRole('button', { name: /preencher operador/i });
    await userEvent.click(operadorBtn);

    expect(screen.getByLabelText(/e-mail de acesso/i)).toHaveValue('operador@erpgrafica.com');
    expect(screen.getByLabelText(/senha/i)).toHaveValue('operador123');
  });

  it('should display error message on login failure', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Credenciais inválidas. Verifique seu e-mail e senha.',
        },
      },
    });

    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/e-mail de acesso/i), 'teste@invalido.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'errada123');
    await userEvent.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas. Verifique seu e-mail e senha.')).toBeInTheDocument();
    });
  });

  it('should call api.post and login user on successful form submission', async () => {
    const mockUser = {
      id: 'usr-admin-1',
      name: 'Diretor Geral',
      email: 'admin@erpgrafica.com',
      role: Role.ADMIN,
    };

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        accessToken: 'valid-jwt-token',
        refreshToken: 'valid-refresh-token',
        user: mockUser,
      },
    });

    renderWithProviders(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /preencher administrador/i }));
    await userEvent.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'admin@erpgrafica.com',
        password: 'admin123',
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });
});
