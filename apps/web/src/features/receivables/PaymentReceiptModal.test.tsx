import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/test-utils';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { ReceivableItem, PaymentMethod, PaymentStatus, WorkOrderStatus } from '@erp/shared-types';

// Mock html-to-image to return a mock Blob
vi.mock('html-to-image', () => ({
  toBlob: vi.fn().mockResolvedValue(new Blob(['fake-image-bytes'], { type: 'image/png' })),
}));

describe('PaymentReceiptModal component', () => {
  const mockReceivable: ReceivableItem = {
    id: 'rec-12345678-abcd',
    partyId: 'p-1',
    description: 'Parcela 1/3 - OS-2026-00005',
    installmentNumber: 1,
    totalInstallments: 3,
    amount: 46.44,
    dueDate: '2026-10-10T00:00:00.000Z',
    paidAt: '2026-09-25T14:30:00.000Z',
    status: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.PIX,
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-09-25T14:30:00.000Z',
    party: {
      id: 'p-1',
      name: 'Gráfica e Editora Exemplo Ltda',
      document: '12345678000195',
      phone: '(11) 98765-4321',
    },
    workOrder: {
      id: 'wo-1',
      orderNumber: 'OS-2026-00005',
      totalAmount: 139.34,
      status: WorkOrderStatus.PRE_PRESS,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders payment receipt with full details, client name, and OS number', () => {
    render(
      <PaymentReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        receivable={mockReceivable}
      />
    );

    expect(screen.getByText(/Recibo de Pagamento/i)).toBeInTheDocument();
    expect(screen.getByText('ERP Gráfica & Comunicação Visual')).toBeInTheDocument();
    expect(screen.getByText(/REC-REC-1234/i)).toBeInTheDocument();
    expect(screen.getByText(/PAGAMENTO CONFIRMADO/i)).toBeInTheDocument();
    expect(screen.getByText('Gráfica e Editora Exemplo Ltda')).toBeInTheDocument();
    expect(screen.getByText('12345678000195')).toBeInTheDocument();
    expect(screen.getByText('Parcela 1/3 - OS-2026-00005')).toBeInTheDocument();
    expect(screen.getByText('OS-2026-00005')).toBeInTheDocument();
    expect(screen.getByText('1 de 3')).toBeInTheDocument();
    expect(screen.getByText('PIX')).toBeInTheDocument();
  });

  it('renders the "Enviar Imagem no WhatsApp" button and customer phone shortcut', () => {
    render(
      <PaymentReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        receivable={mockReceivable}
      />
    );

    expect(screen.getByRole('button', { name: /Enviar Imagem no WhatsApp/i })).toBeInTheDocument();
    expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();
    expect(screen.getByText(/Enviar direto para este nº/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Baixar Imagem/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copiar Texto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Imprimir/i })).toBeInTheDocument();
  });

  it('invokes native navigator.share when supported with file attachment', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);

    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: mockCanShare, writable: true, configurable: true });

    render(
      <PaymentReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        receivable={mockReceivable}
      />
    );

    const shareBtn = screen.getByRole('button', { name: /Enviar Imagem no WhatsApp/i });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledTimes(1);
    });

    const shareCall = mockShare.mock.calls[0][0];
    expect(shareCall.title).toBe('Comprovante de Pagamento');
    expect(shareCall.files).toBeDefined();
    expect(shareCall.files.length).toBe(1);
    expect(shareCall.files[0].name).toContain('comprovante-REC-');
  });

  it('falls back to opening WhatsApp URL and copying to clipboard when navigator.share is not supported', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: undefined, writable: true, configurable: true });

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <PaymentReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        receivable={mockReceivable}
      />
    );

    const shareBtn = screen.getByRole('button', { name: /Enviar Imagem no WhatsApp/i });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://api.whatsapp.com/send?text='),
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  it('redirects to specific client phone when clicking "Enviar direto para este nº"', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: undefined, writable: true, configurable: true });

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <PaymentReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        receivable={mockReceivable}
      />
    );

    const directBtn = screen.getByText(/Enviar direto para este nº/i);
    fireEvent.click(directBtn);

    await waitFor(() => {
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('phone=5511987654321'),
        '_blank',
        'noopener,noreferrer'
      );
    });
  });

  it('copies formatted text when clicking Copiar Texto button', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    render(
      <PaymentReceiptModal
        isOpen={true}
        onClose={vi.fn()}
        receivable={mockReceivable}
      />
    );

    const copyBtn = screen.getByRole('button', { name: /Copiar Texto/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('COMPROVANTE DE PAGAMENTO - ERP GRÁFICA')
      );
    });
  });
});
