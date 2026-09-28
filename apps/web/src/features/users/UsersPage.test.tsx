import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '../../test/test-utils';
import { UsersPage } from './UsersPage';
import { api } from '../../lib/api';
import { Role } from '../../types';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUsers = [
    {
      id: 'usr-1',
      name: 'Carlos Admin',
      email: 'admin@erpgrafica.com',
      role: Role.ADMIN,
      isActive: true,
      emailVerified: true,
      createdAt: '2026-09-01T10:00:00.000Z',
    },
    {
      id: 'usr-2',
      name: 'João Operador',
      email: 'joao@erpgrafica.com',
      role: Role.OPERATOR,
      isActive: true,
      emailVerified: false,
      createdAt: '2026-09-02T10:00:00.000Z',
    },
  ];

  it('should render users table with verification status column and badges', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        data: mockUsers,
        total: 2,
        page: 1,
        limit: 50,
      },
    });

    renderWithProviders(<UsersPage />);

    expect(screen.getByText('Carregando usuários...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
      expect(screen.getByText('João Operador')).toBeInTheDocument();
      expect(screen.getByText('Root Permanente')).toBeInTheDocument();
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });
  });

  it('should display lock icon for root admin and prevent deletion modal from opening', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        data: mockUsers,
        total: 2,
      },
    });

    renderWithProviders(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
    });

    // Root admin has lock icon and cannot be deleted
    expect(screen.getByTitle(/conta root protegida \(impossível excluir ou desativar\)/i)).toBeInTheDocument();

    // Normal user has trash button
    const trashButtons = screen.getAllByTitle(/excluir ou desativar usuário/i);
    expect(trashButtons).toHaveLength(1);
  });

  it('should open modal for new user without password field and show email invitation notice', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        data: mockUsers,
        total: 2,
      },
    });

    renderWithProviders(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /cadastrar usuário/i });
    await userEvent.click(createBtn);

    expect(screen.getByText('Cadastrar Novo Usuário')).toBeInTheDocument();
    expect(screen.getByText(/convite e ativação por e-mail/i)).toBeInTheDocument();
    expect(screen.getByText(/não define senha temporária/i)).toBeInTheDocument();
    // Password input should not be present
    expect(screen.queryByLabelText(/senha/i)).not.toBeInTheDocument();

    // Fill form
    await userEvent.type(screen.getByLabelText(/nome completo/i), 'Maria Designer');
    await userEvent.type(screen.getByLabelText(/e-mail de acesso/i), 'maria@erpgrafica.com');

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        id: 'usr-3',
        name: 'Maria Designer',
        email: 'maria@erpgrafica.com',
      },
    });

    const submitBtn = screen.getByRole('button', { name: /enviar convite e cadastrar/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users', {
        name: 'Maria Designer',
        email: 'maria@erpgrafica.com',
        role: 'OPERATOR',
      });
    });
  });

  it('should call resend invitation endpoint when clicking resend button for unverified user', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        data: mockUsers,
        total: 2,
      },
    });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        message: 'Novo e-mail de convite enviado!',
      },
    });

    // Mock window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithProviders(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('João Operador')).toBeInTheDocument();
    });

    const resendBtn = screen.getByTitle(/reenviar e-mail de ativação/i);
    await userEvent.click(resendBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/usr-2/resend-invitation');
    });

    alertMock.mockRestore();
  });
});
