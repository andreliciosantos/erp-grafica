import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '../../test/test-utils';
import { ReceivablesPage } from './ReceivablesPage';
import { api } from '../../lib/api';
import { PaymentStatus, PaymentMethod } from '@erp/shared-types';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ReceivablesPage', () => {
  const mockSummary = {
    totalAmount: 12500,
    receivedAmount: 6250,
    pendingAmount: 4250,
    overdueAmount: 2000,
    totalCount: 4,
    receivedCount: 2,
    pendingCount: 1,
    overdueCount: 1,
    defaultRatePercent: 16.0,
  };

  const mockReceivables = [
    {
      id: 'rec-1',
      workOrderId: 'wo-1',
      partyId: 'party-1',
      description: 'Sinal 50% - OS-2026-00042',
      installmentNumber: 1,
      totalInstallments: 2,
      amount: 6250,
      dueDate: '2026-09-10T12:00:00.000Z',
      paidAt: '2026-09-10T14:30:00.000Z',
      status: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.PIX,
      party: {
        id: 'party-1',
        name: 'Agência Criativa Alpha',
        document: '12345678000199',
        phone: '11988887777',
      },
      workOrder: {
        id: 'wo-1',
        orderNumber: 'OS-2026-00042',
        totalAmount: 12500,
        status: 'PRINTING',
      },
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-10T14:30:00.000Z',
    },
    {
      id: 'rec-2',
      workOrderId: 'wo-1',
      partyId: 'party-1',
      description: 'Saldo na Retirada - OS-2026-00042',
      installmentNumber: 2,
      totalInstallments: 2,
      amount: 6250,
      dueDate: '2026-09-25T12:00:00.000Z',
      paidAt: null,
      status: PaymentStatus.PENDING,
      paymentMethod: null,
      party: {
        id: 'party-1',
        name: 'Agência Criativa Alpha',
        document: '12345678000199',
        phone: '11988887777',
      },
      workOrder: {
        id: 'wo-1',
        orderNumber: 'OS-2026-00042',
        totalAmount: 12500,
        status: 'PRINTING',
      },
      createdAt: '2026-09-01T10:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/receivables/summary')) {
        return Promise.resolve({ data: mockSummary });
      }
      if (url.includes('/payment-conditions')) {
        return Promise.resolve({
          data: [
            {
              id: 'cond-1',
              name: 'Sinal 50% + 50%',
              description: '50% entrada e saldo em 30d',
              installmentsCount: 2,
              downPaymentPercent: 50,
              intervalDays: 30,
              dayOffsets: [0, 30],
              isDefault: true,
              isActive: true,
            },
          ],
        });
      }
      if (url.includes('/receivables')) {
        return Promise.resolve({
          data: {
            data: mockReceivables,
            meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('renders page header and stat cards with formatted values', async () => {
    renderWithProviders(<ReceivablesPage />);

    expect(screen.getByText('Contas a Receber (Receivables)')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Previsão de Receita')).toBeInTheDocument();
      expect(screen.getAllByText('R$ 12.500,00').length).toBeGreaterThan(0);
      expect(screen.getByText('Total Recebido')).toBeInTheDocument();
      expect(screen.getAllByText('R$ 6.250,00').length).toBeGreaterThan(0);
      expect(screen.getByText('A Receber no Prazo')).toBeInTheDocument();
      expect(screen.getByText('Inadimplência (Vencidos)')).toBeInTheDocument();
      expect(screen.getAllByText('R$ 2.000,00').length).toBeGreaterThan(0);
    });
  });

  it('renders receivables table with client, OS number and installment tags', async () => {
    renderWithProviders(<ReceivablesPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Sinal 50% - OS-2026-00042').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Saldo na Retirada - OS-2026-00042').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Agência Criativa Alpha').length).toBeGreaterThan(0);
      expect(screen.getAllByText('OS-2026-00042').length).toBeGreaterThan(0);
      expect(screen.getByText('1/2')).toBeInTheDocument();
      expect(screen.getByText('2/2')).toBeInTheDocument();
    });
  });

  it('filters receivables by search term and status tabs', async () => {
    renderWithProviders(<ReceivablesPage />);

    const searchInput = screen.getByPlaceholderText(/Buscar por descrição/i);
    fireEvent.change(searchInput, { target: { value: 'Sinal' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('search=Sinal'));
    });

    const pendingBtn = screen.getByRole('button', { name: 'Pendentes' });
    fireEvent.click(pendingBtn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('status=PENDING'));
    });
  });

  it('opens payment modal when clicking on "Receber"', async () => {
    renderWithProviders(<ReceivablesPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Saldo na Retirada - OS-2026-00042').length).toBeGreaterThan(0);
    });

    const receiveButtons = screen.getAllByRole('button', { name: /Receber/i });
    expect(receiveButtons.length).toBeGreaterThan(0);

    fireEvent.click(receiveButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Registrar Recebimento').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Confirmar Recebimento').length).toBeGreaterThan(0);
    });
  });

  it('opens new receivable modal when clicking "+ Novo Recebível"', async () => {
    renderWithProviders(<ReceivablesPage />);

    const newBtn = screen.getByRole('button', { name: /Novo Recebível/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByText('Nova Conta a Receber (Avulsa)')).toBeInTheDocument();
      expect(screen.getByText('Cadastrar Recebível')).toBeInTheDocument();
    });
  });

  it('opens receipt modal when clicking on "Recibo"', async () => {
    renderWithProviders(<ReceivablesPage />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Recibo/i }).length).toBeGreaterThan(0);
    });

    const receiptBtn = screen.getAllByRole('button', { name: /Recibo/i })[0];
    fireEvent.click(receiptBtn);

    await waitFor(() => {
      expect(screen.getByText('Recibo de Pagamento')).toBeInTheDocument();
      expect(screen.getByText('PAGAMENTO CONFIRMADO')).toBeInTheDocument();
    });
  });

  it('opens payment conditions modal when clicking on "Condições de Pagamento"', async () => {
    renderWithProviders(<ReceivablesPage />);

    const conditionsBtn = screen.getByRole('button', { name: /Condições de Pagamento/i });
    expect(conditionsBtn).toBeInTheDocument();
    fireEvent.click(conditionsBtn);

    await waitFor(() => {
      expect(screen.getByText('Condições de Pagamento e Parcelamento')).toBeInTheDocument();
      expect(screen.getByText(/Gerencie os padrões de parcelamento/i)).toBeInTheDocument();
    });
  });
});

