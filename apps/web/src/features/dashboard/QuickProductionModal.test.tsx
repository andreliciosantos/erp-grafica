import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '../../test/test-utils';
import { QuickProductionModal } from './QuickProductionModal';
import { api } from '../../lib/api';
import { PaymentMethod, WorkOrderStatus } from '@erp/shared-types';

vi.mock('../../lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('QuickProductionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal header, presets catalog and empty items message', () => {
    renderWithProviders(<QuickProductionModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Produção Rápida de Balcão')).toBeInTheDocument();
    expect(screen.getByText(/Modo Balcão Ativo:/i)).toBeInTheDocument();
    expect(screen.getByText('Consumidor Avulso')).toBeInTheDocument();

    // Check presets are visible
    expect(screen.getByText('Xerox P&B A4')).toBeInTheDocument();
    expect(screen.getByText('Plastificação Polaseal A4')).toBeInTheDocument();
    expect(screen.getByText('Impressão Colorida A4')).toBeInTheDocument();

    // Empty list message
    expect(screen.getByText('Nenhum serviço selecionado ainda.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /concluir produção rápida/i })).toBeDisabled();
  });

  it('adds preset item to list and updates total amount on click', async () => {
    renderWithProviders(<QuickProductionModal isOpen={true} onClose={vi.fn()} />);

    const xeroxBtn = screen.getByRole('button', { name: /xerox p&b a4/i });
    await userEvent.click(xeroxBtn);

    // Item should now be in the list
    expect(screen.getByText('Serviços no Atendimento (1)')).toBeInTheDocument();
    expect(screen.queryByText('Nenhum serviço selecionado ainda.')).not.toBeInTheDocument();

    // Total and item subtotal should include R$ 0,50
    expect(screen.getAllByText('R$ 0,50').length).toBeGreaterThanOrEqual(2);

    // Clicking again should increment quantity to 2
    await userEvent.click(xeroxBtn);
    expect(screen.getAllByText('R$ 1,00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('(2 unidades)')).toBeInTheDocument();
  });

  it('adds multiple different services and calculates combined total', async () => {
    renderWithProviders(<QuickProductionModal isOpen={true} onClose={vi.fn()} />);

    const xeroxBtn = screen.getByRole('button', { name: /xerox p&b a4/i });
    const plastBtn = screen.getByRole('button', { name: /plastificação polaseal a4/i });

    await userEvent.click(xeroxBtn); // + 0.50
    await userEvent.click(plastBtn); // + 5.00

    expect(screen.getByText('Serviços no Atendimento (2)')).toBeInTheDocument();
    // 0.50 + 5.00 = 5.50
    expect(screen.getAllByText('R$ 5,50').length).toBeGreaterThanOrEqual(1);
  });

  it('allows adding a custom service and removing items', async () => {
    renderWithProviders(<QuickProductionModal isOpen={true} onClose={vi.fn()} />);

    const customToggleBtn = screen.getByRole('button', { name: /\+ adicionar outro serviço/i });
    await userEvent.click(customToggleBtn);

    const descInput = screen.getByLabelText(/descrição do serviço/i);
    await userEvent.type(descInput, 'Plotagem A1 Vegetal');

    const addBtn = screen.getByRole('button', { name: /^adicionar$/i });
    await userEvent.click(addBtn);

    expect(screen.getByText('Plotagem A1 Vegetal')).toBeInTheDocument();

    // Remove the item
    const removeBtn = screen.getByRole('button', { name: /remover plotagem a1 vegetal/i });
    await userEvent.click(removeBtn);

    expect(screen.queryByText('Plotagem A1 Vegetal')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhum serviço selecionado ainda.')).toBeInTheDocument();
  });

  it('submits quick order successfully and shows generated order number', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        id: 'wo-quick-1',
        orderNumber: 'OS-2026-00088',
        totalAmount: 5.0,
      },
    });

    renderWithProviders(<QuickProductionModal isOpen={true} onClose={vi.fn()} />);

    // Add Plastificação (5.00)
    const plastBtn = screen.getByRole('button', { name: /plastificação polaseal a4/i });
    await userEvent.click(plastBtn);

    // Select payment method Dinheiro
    const dinheiroBtn = screen.getByRole('button', { name: /dinheiro/i });
    await userEvent.click(dinheiroBtn);

    const submitBtn = screen.getByRole('button', { name: /concluir produção rápida/i });
    expect(submitBtn).toBeEnabled();
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/work-orders',
        expect.objectContaining({
          totalAmount: 5,
          paymentMethod: PaymentMethod.CASH,
          paymentStatus: 'PAID',
          status: WorkOrderStatus.DELIVERED,
          items: expect.arrayContaining([
            expect.objectContaining({
              productName: 'Plastificação Polaseal A4',
              quantity: 1,
              unitPrice: 5,
            }),
          ]),
        })
      );
    });

    // Check success screen
    await waitFor(() => {
      expect(screen.getByText('Produção Rápida Concluída!')).toBeInTheDocument();
      expect(screen.getByText('OS-2026-00088')).toBeInTheDocument();
    });
  });

  it('allows selecting raw material in item box and includes rawMaterialId and materialQuantity in order payload', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/raw-materials')) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'rm-sulfite-a4',
                name: 'Papel Sulfite A4 75g',
                unitOfMeasure: 'FL',
                currentStock: 2500,
              },
            ],
            meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
          },
        });
      }
      return Promise.resolve({ data: [] });
    });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        id: 'wo-quick-2',
        orderNumber: 'OS-2026-00089',
        totalAmount: 1.0,
      },
    });

    renderWithProviders(<QuickProductionModal isOpen={true} onClose={vi.fn()} />);

    // Add Xerox P&B A4
    const xeroxBtn = screen.getByRole('button', { name: /xerox p&b a4/i });
    await userEvent.click(xeroxBtn);
    await userEvent.click(xeroxBtn); // quantity = 2, total = 1.00

    // Material selector should be rendered in the item box
    await waitFor(() => {
      expect(screen.getByText(/material gasto:/i)).toBeInTheDocument();
    });

    const materialSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(materialSelect, 'rm-sulfite-a4');

    // Total consumed calculation should appear
    await waitFor(() => {
      expect(screen.getByText(/total:/i)).toBeInTheDocument();
      expect(screen.getByText('2 FL')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /concluir produção rápida/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/work-orders',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              productName: 'Xerox P&B A4',
              quantity: 2,
              rawMaterialId: 'rm-sulfite-a4',
              materialQuantity: 1,
            }),
          ]),
        })
      );
    });
  });
});
