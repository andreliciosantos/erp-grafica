import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '../../test/test-utils';
import { ResetPasswordPage } from './ResetPasswordPage';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show error when token is missing in URL', async () => {
    renderWithProviders(<ResetPasswordPage />, { initialEntries: ['/reset-password'] });

    await waitFor(() => {
      expect(screen.getByText('Link Inválido ou Expirado')).toBeInTheDocument();
      expect(screen.getByText(/token de recuperação não fornecido/i)).toBeInTheDocument();
    });
  });

  it('should show error when token is invalid or expired', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        valid: false,
        message: 'Link de recuperação expirado. Solicite uma nova redefinição.',
      },
    });

    renderWithProviders(<ResetPasswordPage />, { initialEntries: ['/reset-password?token=invalid-token'] });

    await waitFor(() => {
      expect(screen.getByText('Link Inválido ou Expirado')).toBeInTheDocument();
      expect(screen.getByText('Link de recuperação expirado. Solicite uma nova redefinição.')).toBeInTheDocument();
    });
  });

  it('should reset password successfully when form is submitted with valid matching passwords', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        valid: true,
        email: 'colaborador@empresa.com',
        name: 'Colaborador',
      },
    });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        message: 'Senha redefinida com sucesso!',
      },
    });

    renderWithProviders(<ResetPasswordPage />, { initialEntries: ['/reset-password?token=valid-reset-token'] });

    await waitFor(() => {
      expect(screen.getByText(/redefinir senha para/i)).toBeInTheDocument();
      expect(screen.getByText(/colaborador@empresa.com/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/^Nova Senha/i);
    const confirmInput = screen.getByLabelText(/^Confirme a Nova Senha/i);

    await userEvent.type(passwordInput, 'novaSenha123');
    await userEvent.type(confirmInput, 'novaSenha123');

    const submitBtn = screen.getByRole('button', { name: /salvar nova senha/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'valid-reset-token',
        password: 'novaSenha123',
      });
      expect(screen.getByText('Senha Alterada com Sucesso!')).toBeInTheDocument();
    });
  });
});
