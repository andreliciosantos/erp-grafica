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
    expect(screen.queryByRole('button', { name: /preencher administrador/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /preencher operador/i })).not.toBeInTheDocument();
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

    await userEvent.type(screen.getByLabelText(/e-mail de acesso/i), 'admin@erpgrafica.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'admin123');
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

  it('should open forgot password modal and submit email request', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        message: 'Link de recuperação enviado com sucesso!',
      },
    });

    renderWithProviders(<LoginPage />);

    const forgotBtn = screen.getByRole('button', { name: /esqueci minha senha/i });
    await userEvent.click(forgotBtn);

    expect(screen.getByText('Recuperação de Acesso')).toBeInTheDocument();
    const emailInput = screen.getByLabelText(/e-mail cadastrado/i);
    await userEvent.type(emailInput, 'admin@erpgrafica.com');

    const submitBtn = screen.getByRole('button', { name: /enviar link de recuperação/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'admin@erpgrafica.com',
      });
      expect(screen.getByText('Link de recuperação enviado com sucesso!')).toBeInTheDocument();
    });
  });

  it('should present first login password change view when mustChangePassword is true', async () => {
    const tempUser = {
      id: 'usr-temp-1',
      name: 'Novo Colaborador',
      email: 'novo@erpgrafica.com',
      role: Role.COMMERCIAL,
      mustChangePassword: true,
    };

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        accessToken: 'temp-jwt-token',
        refreshToken: 'temp-refresh-token',
        mustChangePassword: true,
        user: tempUser,
      },
    });

    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/e-mail de acesso/i), 'novo@erpgrafica.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'Temp@123');
    await userEvent.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    await waitFor(() => {
      expect(screen.getByText('Primeiro Acesso ao Sistema')).toBeInTheDocument();
      expect(screen.getByText(/cadastre agora sua/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nova senha definitiva/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar nova senha/i)).toBeInTheDocument();
    });

    // Definir senha definitiva
    await userEvent.type(screen.getByLabelText(/nova senha definitiva/i), 'Definitiva@2026');
    await userEvent.type(screen.getByLabelText(/confirmar nova senha/i), 'Definitiva@2026');

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        accessToken: 'permanent-jwt-token',
        refreshToken: 'permanent-refresh-token',
        mustChangePassword: false,
        user: { ...tempUser, mustChangePassword: false },
      },
    });

    const saveBtn = screen.getByRole('button', { name: /salvar senha e entrar no erp/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/auth/first-login-change-password',
        { newPassword: 'Definitiva@2026' },
        { headers: { Authorization: 'Bearer temp-jwt-token' } }
      );
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.mustChangePassword).toBe(false);
    });
  });
});
