import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '../../test/test-utils';
import { ActivateAccountPage } from './ActivateAccountPage';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { Role } from '../../types';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('ActivateAccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('should show error when token is missing in URL', async () => {
    renderWithProviders(<ActivateAccountPage />, { initialEntries: ['/activate'] });

    await waitFor(() => {
      expect(screen.getByText('Link Inválido ou Expirado')).toBeInTheDocument();
      expect(screen.getByText(/token de ativação não fornecido/i)).toBeInTheDocument();
    });
  });

  it('should show error when token is invalid or expired', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        valid: false,
        message: 'Link de ativação expirado. Solicite um novo convite ao administrador.',
      },
    });

    renderWithProviders(<ActivateAccountPage />, { initialEntries: ['/activate?token=invalid-token'] });

    await waitFor(() => {
      expect(screen.getByText('Link Inválido ou Expirado')).toBeInTheDocument();
      expect(screen.getByText('Link de ativação expirado. Solicite um novo convite ao administrador.')).toBeInTheDocument();
    });
  });

  it('should render form with user email and submit activation with password', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        valid: true,
        email: 'novo@empresa.com',
        name: 'Novo Usuário',
      },
    });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'u-1',
          name: 'Novo Usuário',
          email: 'novo@empresa.com',
          role: Role.OPERATOR,
        },
      },
    });

    renderWithProviders(<ActivateAccountPage />, { initialEntries: ['/activate?token=valid-token-123'] });

    await waitFor(() => {
      expect(screen.getByText('Ativação de Conta e Cadastro de Senha')).toBeInTheDocument();
      expect(screen.getByText('novo@empresa.com')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/defina sua senha/i);
    const confirmInput = screen.getByLabelText(/confirme a senha/i);

    await userEvent.type(passwordInput, 'senhaSegura123');
    await userEvent.type(confirmInput, 'senhaSegura123');

    const submitBtn = screen.getByRole('button', { name: /confirmar e-mail e ativar conta/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/activate', {
        token: 'valid-token-123',
        password: 'senhaSegura123',
      });
      expect(screen.getByText('Conta Ativada com Sucesso!')).toBeInTheDocument();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });
});
