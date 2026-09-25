import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '../../test/test-utils';
import { OrderDetailsModal } from './OrderDetailsModal';
import { WorkOrderItem } from '../../types';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: { data: [] } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('OrderDetailsModal', () => {
  const mockOrder: WorkOrderItem = {
    id: 'wo-101',
    orderNumber: 'OS-2026-00042',
    quoteId: 'q-101',
    partyId: 'party-1',
    userId: 'usr-1',
    origin: 'WEB',
    status: 'PRINTING',
    priority: 3,
    deliveryDate: '2026-09-30T18:00:00.000Z',
    fileUrl: null,
    barcode: 'OS202600042',
    totalAmount: 1450.0,
    paymentStatus: 'PARTIALLY_PAID',
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
    party: {
      id: 'party-1',
      type: 'COMPANY',
      name: 'Studio Design Visual Ltda',
      phone: '11999998888',
      document: '99888777000166',
      isCustomer: true,
      isSupplier: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    stages: [
      { id: 'st-1', workOrderId: 'wo-101', stepOrder: 1, name: 'CTP & Pré-impressão', status: 'COMPLETED' },
      { id: 'st-2', workOrderId: 'wo-101', stepOrder: 2, name: 'Impressão Offset', status: 'IN_PROGRESS' },
    ],
  };

  it('renders order details modal with stages timeline and hides payment info by default', () => {
    renderWithProviders(
      <OrderDetailsModal
        order={mockOrder}
        isOpen={true}
        onClose={vi.fn()}
        onOpenStageAction={vi.fn()}
      />
    );

    // Modal title & customer
    expect(screen.getByText(/Detalhes da Ordem de Serviço: OS-2026-00042/i)).toBeInTheDocument();
    expect(screen.getByText('Studio Design Visual Ltda')).toBeInTheDocument();

    // Stages Timeline is present
    expect(screen.getByText(/Etapas Industriais do Chão de Fábrica/i)).toBeInTheDocument();
    expect(screen.getByText('CTP & Pré-impressão')).toBeInTheDocument();
    expect(screen.getByText('Impressão Offset')).toBeInTheDocument();

    // Payment Section header toggle is present at the end
    const toggleButton = screen.getByRole('button', { name: /Informações de Pagamento e Cobrança/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Detailed payment options / schedule are hidden by default
    expect(screen.queryByText(/Nenhum cronograma de parcelas gerado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sinal 50% \+ 50% Retirada/i)).not.toBeInTheDocument();
  });

  it('reveals payment information when toggle button is clicked and hides it when clicked again', () => {
    renderWithProviders(
      <OrderDetailsModal
        order={mockOrder}
        isOpen={true}
        onClose={vi.fn()}
        onOpenStageAction={vi.fn()}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /Informações de Pagamento e Cobrança/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Click to reveal
    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Ocultar/i)).toBeInTheDocument();
    expect(screen.getByText(/Nenhum cronograma de parcelas gerado/i)).toBeInTheDocument();
    expect(screen.getByText(/Sinal 50% \+ 50% Retirada/i)).toBeInTheDocument();

    // Click again to hide
    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Nenhum cronograma de parcelas gerado/i)).not.toBeInTheDocument();
  });
});
