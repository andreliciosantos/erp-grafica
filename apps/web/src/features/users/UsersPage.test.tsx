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
      isRoot: true,
      emailVerified: true,
      mustChangePassword: false,
      createdAt: '2026-09-01T10:00:00.000Z',
    },
    {
      id: 'usr-2',
      name: 'João Operador',
      email: 'joao@erpgrafica.com',
      role: Role.OPERATOR,
      isActive: true,
      isRoot: false,
      emailVerified: true,
      mustChangePassword: true,
      createdAt: '2026-09-02T10:00:00.000Z',
    },
  ];

  it('should render users table with access status column and badges', async () => {
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
      expect(screen.getByText(/Senha Temporária \(1º Login\)/i)).toBeInTheDocument();
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

  it('should open modal for new user with temporary password field and submit correctly', async () => {
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
    expect(screen.getByLabelText(/senha temporária/i)).toBeInTheDocument();

    // Fill form
    await userEvent.type(screen.getByLabelText(/nome completo/i), 'Maria Designer');
    await userEvent.type(screen.getByLabelText(/e-mail de acesso/i), 'maria@erpgrafica.com');
    await userEvent.type(screen.getByLabelText(/senha temporária/i), 'Temp@123');

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        id: 'usr-3',
        name: 'Maria Designer',
        email: 'maria@erpgrafica.com',
        mustChangePassword: true,
      },
    });

    const buttons = screen.getAllByRole('button', { name: /cadastrar usuário/i });
    const submitBtn = buttons[buttons.length - 1];
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users', {
        name: 'Maria Designer',
        email: 'maria@erpgrafica.com',
        password: 'Temp@123',
        role: 'OPERATOR',
      });
    });
  });

  it('should edit an existing user and allow resetting temporary password', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        data: mockUsers,
        total: 2,
      },
    });

    vi.mocked(api.put).mockResolvedValueOnce({
      data: {
        id: 'usr-2',
        name: 'João Operador Atualizado',
        email: 'joao@erpgrafica.com',
        role: 'OPERATOR',
        isActive: true,
        mustChangePassword: true,
      },
    });

    renderWithProviders(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('João Operador')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle(/editar usuário/i);
    await userEvent.click(editButtons[1]); // João

    expect(screen.getByText('Editar Usuário')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/redefinir senha temporária/i), 'NovaTemp456');

    const saveBtn = screen.getByRole('button', { name: /atualizar usuário/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/users/usr-2',
        expect.objectContaining({
          password: 'NovaTemp456',
        })
      );
    });
  });
});
