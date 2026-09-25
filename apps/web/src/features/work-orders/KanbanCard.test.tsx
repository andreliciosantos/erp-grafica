import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/test-utils';
import { KanbanCard } from './KanbanCard';
import { WorkOrderItem } from '../../types';

describe('KanbanCard component', () => {
  const mockOrder: WorkOrderItem = {
    id: 'wo-101',
    orderNumber: 'OS-2026-0042',
    quoteId: 'qt-101',
    partyId: 'pty-101',
    userId: 'usr-1',
    origin: 'WEB',
    status: 'PRINTING',
    priority: 4, // Urgente
    deliveryDate: '2026-10-05T00:00:00.000Z',
    barcode: '7891234567890',
    totalAmount: 1850.00,
    paymentStatus: 'PAID',
    createdAt: '2026-09-22T08:00:00.000Z',
    party: {
      id: 'pty-101',
      type: 'COMPANY',
      name: 'Agência Alfa Comunicação',
      document: '12.345.678/0001-90',
      phone: '(11) 98765-4321',
      isCustomer: true,
      isSupplier: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  };

  it('should render OS number, customer name, price, and barcode', () => {
    render(<KanbanCard order={mockOrder} onClick={() => {}} />);

    expect(screen.getByText('OS-2026-0042')).toBeInTheDocument();
    expect(screen.getByText('Agência Alfa Comunicação')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*1\.850,00/)).toBeInTheDocument();
    expect(screen.getByText('7891234567890')).toBeInTheDocument();
  });

  it('should render both OS number and product name together on the card', () => {
    const orderWithProduct = {
      ...mockOrder,
      productName: 'Catálogo de Produtos 2026 - A4 Couché',
    };
    render(<KanbanCard order={orderWithProduct} onClick={() => {}} />);

    expect(screen.getByText('OS-2026-0042')).toBeInTheDocument();
    expect(screen.getByText('Catálogo de Produtos 2026 - A4 Couché')).toBeInTheDocument();
  });

  it('should render priority badge with Urgente for priority 4', () => {
    render(<KanbanCard order={mockOrder} onClick={() => {}} />);

    const badge = screen.getByText('Urgente');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-rose-300');
  });

  it('should call onClick when card is clicked', async () => {
    const handleClick = vi.fn();
    render(<KanbanCard order={mockOrder} onClick={handleClick} />);

    await userEvent.click(screen.getByText('OS-2026-0042'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should call onAdvance without triggering card onClick when advance button is clicked', async () => {
    const handleClick = vi.fn();
    const handleAdvance = vi.fn();

    render(
      <KanbanCard
        order={mockOrder}
        onClick={handleClick}
        onAdvance={handleAdvance}
      />
    );

    const advanceBtn = screen.getByRole('button', { name: /avançar/i });
    expect(advanceBtn).toBeInTheDocument();

    await userEvent.click(advanceBtn);
    expect(handleAdvance).toHaveBeenCalledWith(mockOrder);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not show advance button when status is DELIVERED', () => {
    const deliveredOrder = { ...mockOrder, status: 'DELIVERED' };
    render(
      <KanbanCard
        order={deliveredOrder}
        onClick={() => {}}
        onAdvance={() => {}}
      />
    );

    expect(screen.queryByRole('button', { name: /avançar/i })).not.toBeInTheDocument();
  });
});
