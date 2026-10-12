import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '../../test/test-utils';
import { QuickProductionPage } from './QuickProductionPage';
import { api } from '../../lib/api';
import { PaymentMethod, WorkOrderStatus } from '@erp/shared-types';

vi.mock('../../lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('QuickProductionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header, express badge, presets catalog and empty order state', () => {
    renderWithProviders(<QuickProductionPage />);

    expect(screen.getByText('Produção Rápida de Balcão')).toBeInTheDocument();
    expect(screen.getByText('Expresso')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gerenciar modelos/i })).toBeInTheDocument();

    // Check presets are visible
    expect(screen.getByText('Xerox P&B A4')).toBeInTheDocument();
    expect(screen.getByText('Plastificação Polaseal A4')).toBeInTheDocument();
    expect(screen.getByText('Impressão Colorida A4')).toBeInTheDocument();

    // Empty order message
    expect(screen.getByText('Nenhum serviço selecionado ainda')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /concluir produção rápida/i })).toBeDisabled();
  });

  it('adds preset item to list and updates total amount on click', async () => {
    renderWithProviders(<QuickProductionPage />);

    const xeroxBtn = screen.getByRole('button', { name: /xerox p&b a4/i });
    await userEvent.click(xeroxBtn);

    // Item should now be in the order list
    expect(screen.getByText('1 unidade')).toBeInTheDocument();
    expect(screen.queryByText('Nenhum serviço selecionado ainda')).not.toBeInTheDocument();

    // Total and item subtotal should include R$ 0,50
    expect(screen.getAllByText('R$ 0,50').length).toBeGreaterThanOrEqual(2);

    // Clicking again should increment quantity to 2
    await userEvent.click(xeroxBtn);
    expect(screen.getAllByText('R$ 1,00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2 unidades')).toBeInTheDocument();
  });

  it('adds multiple different services and calculates combined total', async () => {
    renderWithProviders(<QuickProductionPage />);

    const xeroxBtn = screen.getByRole('button', { name: /xerox p&b a4/i });
    const plastBtn = screen.getByRole('button', { name: /plastificação polaseal a4/i });

    await userEvent.click(xeroxBtn); // + 0.50
    await userEvent.click(plastBtn); // + 5.00

    expect(screen.getByText('2 itens')).toBeInTheDocument();
    // 0.50 + 5.00 = 5.50
    expect(screen.getAllByText('R$ 5,50').length).toBeGreaterThanOrEqual(1);
  });

  it('allows adding a custom service and removing items', async () => {
    renderWithProviders(<QuickProductionPage />);

    // Click to add custom service
    const customBtn = screen.getByText(/\+ Adicionar outro serviço personalizado/i);
    await userEvent.click(customBtn);

    // Fill form
    const nameInput = screen.getByPlaceholderText('Ex: Impressão Plotter A1 vegetal');
    await userEvent.type(nameInput, 'Banner Lona 1x1m');

    const addBtn = screen.getByRole('button', { name: /adicionar ao atendimento/i });
    await userEvent.click(addBtn);

    expect(screen.getByText('Banner Lona 1x1m')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /concluir produção rápida/i })).not.toBeDisabled();

    // Now remove item
    const deleteBtn = screen.getByRole('button', { name: /remover banner lona 1x1m/i });
    await userEvent.click(deleteBtn);

    expect(screen.queryByText('Banner Lona 1x1m')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhum serviço selecionado ainda')).toBeInTheDocument();
  });

  it('submits quick order via API with payment and delivery status, showing success screen', async () => {
    (api.post as any).mockResolvedValueOnce({
      data: {
        id: 'wo-direct-1',
        orderNumber: 'OS-2026-00042',
        totalAmount: 15.0,
        status: WorkOrderStatus.DELIVERED,
      },
    });

    renderWithProviders(<QuickProductionPage />);

    // Add Encadernação Espiral (R$ 8.00)
    const presetBtn = screen.getByRole('button', { name: /encadernação espiral/i });
    await userEvent.click(presetBtn);

    // Select payment method Dinheiro
    const dinheiroBtn = screen.getByRole('button', { name: /dinheiro/i });
    await userEvent.click(dinheiroBtn);

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /concluir produção rápida/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/work-orders',
        expect.objectContaining({
          status: WorkOrderStatus.DELIVERED,
          paymentStatus: 'PAID',
          paymentMethod: PaymentMethod.CASH,
          items: expect.arrayContaining([
            expect.objectContaining({
              productName: 'Encadernação Espiral',
              quantity: 1,
            }),
          ]),
        })
      );
    });

    // Check success view
    await waitFor(() => {
      expect(screen.getByText('Produção Rápida Concluída!')).toBeInTheDocument();
      expect(screen.getByText('OS-2026-00042')).toBeInTheDocument();
      expect(screen.getByText('Novo Atendimento Rápido')).toBeInTheDocument();
    });

    // Reset for new order
    const resetBtn = screen.getByRole('button', { name: /novo atendimento rápido/i });
    await userEvent.click(resetBtn);

    expect(screen.queryByText('Produção Rápida Concluída!')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhum serviço selecionado ainda')).toBeInTheDocument();
  });

  it('clears order when clicking limpar lista', async () => {
    renderWithProviders(<QuickProductionPage />);

    const xeroxBtn = screen.getByRole('button', { name: /xerox p&b a4/i });
    await userEvent.click(xeroxBtn);

    expect(screen.getByRole('button', { name: /limpar lista/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /limpar lista/i }));

    expect(screen.getByText('Nenhum serviço selecionado ainda')).toBeInTheDocument();
  });
});
