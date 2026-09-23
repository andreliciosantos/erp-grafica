import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '../../test/test-utils';
import { JobTicketModal } from './JobTicketModal';
import { WorkOrderItem } from '../../types';

describe('JobTicketModal', () => {
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
    quote: {
      id: 'q-101',
      code: 1042,
      notes: 'Refile especial com cantos retos.',
      items: [
        {
          id: 'qi-1',
          productName: 'Folder Institucional A4 2 Dobras',
          quantity: 2000,
          widthMm: 297,
          heightMm: 210,
          colorsFront: 4,
          colorsBack: 4,
          sheetsRequired: 220,
          rawMaterial: {
            id: 'rm-1',
            name: 'Papel Couchê 150g Brilho',
          },
        },
      ],
    },
    stages: [
      { id: 'st-1', workOrderId: 'wo-101', stepOrder: 1, name: 'CTP & Pré-impressão', status: 'COMPLETED' },
      { id: 'st-2', workOrderId: 'wo-101', stepOrder: 2, name: 'Impressão Offset', status: 'IN_PROGRESS' },
    ],
  };

  it('renders modal with order number, client name, and technical specifications in A4 format', () => {
    renderWithProviders(
      <JobTicketModal
        isOpen={true}
        onClose={vi.fn()}
        order={mockOrder}
      />
    );

    expect(screen.getByText('Ficha Técnica de Produção (Job Ticket)')).toBeInTheDocument();
    expect(screen.getAllByText('OS-2026-00042').length).toBeGreaterThan(0);
    expect(screen.getByText('Studio Design Visual Ltda')).toBeInTheDocument();
    expect(screen.getByText('Folder Institucional A4 2 Dobras')).toBeInTheDocument();
    expect(screen.getByText('Papel Couchê 150g Brilho')).toBeInTheDocument();
    expect(screen.getByText(/2.000 un/i)).toBeInTheDocument();
  });

  it('switches to 80mm thermal slip format when clicking format button', () => {
    renderWithProviders(
      <JobTicketModal
        isOpen={true}
        onClose={vi.fn()}
        order={mockOrder}
      />
    );

    const thermalBtn = screen.getByRole('button', { name: /Térmica 80mm/i });
    fireEvent.click(thermalBtn);

    expect(screen.getByText('ORDEM DE PRODUÇÃO')).toBeInTheDocument();
    expect(screen.getByText(/CHECKLIST ETAPAS/i)).toBeInTheDocument();
  });

  it('calls window.print when clicking "Imprimir Agora"', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    renderWithProviders(
      <JobTicketModal
        isOpen={true}
        onClose={vi.fn()}
        order={mockOrder}
      />
    );

    const printBtn = screen.getByRole('button', { name: /Imprimir Agora/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
