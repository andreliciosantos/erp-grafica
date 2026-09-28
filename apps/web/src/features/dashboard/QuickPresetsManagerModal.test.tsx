import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor, createTestQueryClient } from '../../test/test-utils';
import { QuickPresetsManagerModal } from './QuickPresetsManagerModal';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('QuickPresetsManagerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with list of existing presets and creation form', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/quick-service-presets')) {
        return Promise.resolve({
          data: [
            {
              id: 'qsp-1',
              name: 'Xerox P&B A4',
              category: 'Xerox',
              defaultPrice: 0.5,
              materialConsumeQty: 1,
              isActive: true,
              rawMaterial: {
                id: 'rm-1',
                name: 'Papel Sulfite A4 75g',
                unitOfMeasure: 'FL',
                currentStock: 5000,
              },
            },
          ],
        });
      }
      if (url.includes('/raw-materials')) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'rm-1',
                name: 'Papel Sulfite A4 75g',
                unitOfMeasure: 'FL',
                currentStock: 5000,
              },
            ],
            meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    renderWithProviders(<QuickPresetsManagerModal isOpen={true} onClose={vi.fn()} />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText('Xerox P&B A4')).toBeInTheDocument();
    });
  });

  it('creates a new preset when submitting the form', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/quick-service-presets')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/raw-materials')) {
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: [] });
    });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        id: 'qsp-new',
        name: 'Plastificação A3 Polaseal',
        category: 'Acabamento',
        defaultPrice: 8.0,
        isActive: true,
      },
    });

    renderWithProviders(<QuickPresetsManagerModal isOpen={true} onClose={vi.fn()} />, {
      queryClient: createTestQueryClient(),
    });

    const nameInput = screen.getByLabelText(/nome do serviço/i);
    await userEvent.type(nameInput, 'Plastificação A3 Polaseal');

    const addBtn = screen.getByRole('button', { name: /adicionar modelo/i });
    await userEvent.click(addBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/quick-service-presets',
        expect.objectContaining({
          name: 'Plastificação A3 Polaseal',
          defaultPrice: 1,
        })
      );
    });
  });

  it('deletes an existing preset when clicking the delete button', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/quick-service-presets')) {
        return Promise.resolve({
          data: [
            {
              id: 'qsp-delete-1',
              name: 'Modelo Antigo Deletar',
              category: 'Outros',
              defaultPrice: 10,
              isActive: true,
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    vi.mocked(api.delete).mockResolvedValueOnce({ data: { id: 'qsp-delete-1' } });

    renderWithProviders(<QuickPresetsManagerModal isOpen={true} onClose={vi.fn()} />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText('Modelo Antigo Deletar')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', { name: /excluir modelo modelo antigo deletar/i });
    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/quick-service-presets/qsp-delete-1');
    });
  });

  it('loads preset into form when clicking edit button and submits update via put', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/quick-service-presets')) {
        return Promise.resolve({
          data: [
            {
              id: 'qsp-edit-1',
              name: 'Xerox P&B A4',
              category: 'Xerox',
              defaultPrice: 0.5,
              materialConsumeQty: 1,
              isActive: true,
              rawMaterial: null,
            },
          ],
        });
      }
      if (url.includes('/raw-materials')) {
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: [] });
    });

    vi.mocked(api.put).mockResolvedValueOnce({
      data: {
        id: 'qsp-edit-1',
        name: 'Xerox P&B A4 Atualizado',
        category: 'Xerox',
        defaultPrice: 0.6,
        isActive: true,
      },
    });

    renderWithProviders(<QuickPresetsManagerModal isOpen={true} onClose={vi.fn()} />, {
      queryClient: createTestQueryClient(),
    });

    await waitFor(() => {
      expect(screen.getByText('Xerox P&B A4')).toBeInTheDocument();
    });

    // Clica no botão de editar
    const editBtn = screen.getByRole('button', { name: /editar modelo xerox p&b a4/i });
    await userEvent.click(editBtn);

    // O cabeçalho deve mudar para o modo de edição
    expect(screen.getByText('Editar Modelo Pronto')).toBeInTheDocument();
    expect(screen.getByText('Em Edição')).toBeInTheDocument();

    // Modifica o nome
    const nameInput = screen.getByLabelText(/nome do serviço/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Xerox P&B A4 Atualizado');

    // Clica em Salvar Alterações
    const saveBtn = screen.getByRole('button', { name: /salvar alterações/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/quick-service-presets/qsp-edit-1',
        expect.objectContaining({
          name: 'Xerox P&B A4 Atualizado',
        })
      );
    });
  });
});
