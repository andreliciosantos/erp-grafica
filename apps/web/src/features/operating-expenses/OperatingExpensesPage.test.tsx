import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '../../test/test-utils';
import { OperatingExpensesPage } from './OperatingExpensesPage';
import { api } from '../../lib/api';
import {
  ExpenseCategory,
  ExpenseType,
  PaymentStatus,
  PaymentMethod,
} from '../../types';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('OperatingExpensesPage', () => {
  const mockSummary = {
    totalAmount: 5800,
    paidAmount: 2000,
    pendingAmount: 3800,
    overdueAmount: 0,
    totalCount: 3,
    paidCount: 1,
    pendingCount: 2,
    overdueCount: 0,
    fixedTotal: 5000,
    variableTotal: 800,
    categoryBreakdown: [
      {
        category: ExpenseCategory.RENT_FACILITIES,
        label: 'Aluguel & Estrutura',
        total: 3500,
        count: 1,
        percentage: 60.3,
      },
      {
        category: ExpenseCategory.UTILITIES,
        label: 'Utilidades & Energia',
        total: 1500,
        count: 1,
        percentage: 25.9,
      },
      {
        category: ExpenseCategory.SOFTWARE_LICENSES,
        label: 'Softwares & Licenças',
        total: 800,
        count: 1,
        percentage: 13.8,
      },
    ],
  };

  const mockExpenses = [
    {
      id: 'exp-1',
      description: 'Aluguel Galpão Industrial',
      category: ExpenseCategory.RENT_FACILITIES,
      expenseType: ExpenseType.FIXED,
      amount: 3500,
      dueDate: '2026-09-10T12:00:00.000Z',
      paidAt: '2026-09-08T12:00:00.000Z',
      status: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.BOLETO,
      competenceDate: '2026-09-01T12:00:00.000Z',
      supplierId: null,
      beneficiaryName: 'Imobiliária Souza',
      barcode: '341917900101043510047',
      documentNumber: 'REC-2026-09',
      isRecurring: true,
      recurrenceInterval: 'MONTHLY',
      recurrenceEndDate: '2027-09-01T12:00:00.000Z',
      notes: 'Contrato válido até set/2027',
      createdAt: '2026-09-01T12:00:00.000Z',
      updatedAt: '2026-09-08T12:00:00.000Z',
      supplier: null,
    },
    {
      id: 'exp-2',
      description: 'Energia Elétrica CEMIG',
      category: ExpenseCategory.UTILITIES,
      expenseType: ExpenseType.VARIABLE,
      amount: 1500,
      dueDate: '2026-09-25T12:00:00.000Z',
      paidAt: null,
      status: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.PIX,
      competenceDate: '2026-09-01T12:00:00.000Z',
      supplierId: null,
      beneficiaryName: 'CEMIG Distribuição',
      barcode: '836100000150',
      documentNumber: 'FAT-98214',
      isRecurring: true,
      recurrenceInterval: 'MONTHLY',
      recurrenceEndDate: null,
      notes: null,
      createdAt: '2026-09-01T12:00:00.000Z',
      updatedAt: '2026-09-01T12:00:00.000Z',
      supplier: null,
    },
    {
      id: 'exp-3',
      description: 'Assinatura Adobe Creative Cloud CTP',
      category: ExpenseCategory.SOFTWARE_LICENSES,
      expenseType: ExpenseType.FIXED,
      amount: 800,
      dueDate: '2026-09-28T12:00:00.000Z',
      paidAt: null,
      status: PaymentStatus.PENDING,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      competenceDate: '2026-09-01T12:00:00.000Z',
      supplierId: null,
      beneficiaryName: 'Adobe Systems Brasil',
      barcode: null,
      documentNumber: 'INV-ADOBE-4421',
      isRecurring: true,
      recurrenceInterval: 'MONTHLY',
      recurrenceEndDate: '2026-12-31T12:00:00.000Z',
      notes: null,
      createdAt: '2026-09-01T12:00:00.000Z',
      updatedAt: '2026-09-01T12:00:00.000Z',
      supplier: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/operating-expenses/summary')) {
        return Promise.resolve({ data: mockSummary });
      }
      if (url.includes('/operating-expenses')) {
        return Promise.resolve({
          data: {
            data: mockExpenses,
            meta: { total: 3, page: 1, limit: 25, totalPages: 1 },
          },
        });
      }
      if (url.includes('/parties')) {
        return Promise.resolve({ data: { data: [], meta: { total: 0 } } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('should render page title, header controls and summary KPI cards', async () => {
    renderWithProviders(<OperatingExpensesPage />);

    expect(screen.getByText('Despesas Operacionais (OPEX)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nova despesa/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/mês de competência/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Total Previsto no Mês')).toBeInTheDocument();
      expect(screen.getByText('Despesas Pagas')).toBeInTheDocument();
      expect(screen.getByText('Contas a Vencer')).toBeInTheDocument();
      expect(screen.getByText('Contas Vencidas')).toBeInTheDocument();
    });
  });

  it('should render list of operating expenses with descriptions and amounts', async () => {
    renderWithProviders(<OperatingExpensesPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Aluguel Galpão Industrial')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Energia Elétrica CEMIG')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Assinatura Adobe Creative Cloud CTP')[0]).toBeInTheDocument();
    });
  });

  it('should open create expense modal when clicking Nova Despesa button', async () => {
    renderWithProviders(<OperatingExpensesPage />);

    const newBtn = screen.getByRole('button', { name: /nova despesa/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByText('Cadastrar Nova Despesa Operacional')).toBeInTheDocument();
      expect(screen.getByLabelText(/descrição da despesa/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/valor total \(r\$\)/i)).toBeInTheDocument();
    });
  });

  it('should open pay expense modal when clicking Pagar button', async () => {
    renderWithProviders(<OperatingExpensesPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Energia Elétrica CEMIG')[0]).toBeInTheDocument();
    });

    const payButtons = screen.getAllByTitle(/registrar pagamento \/ liquidar despesa/i);
    expect(payButtons.length).toBeGreaterThan(0);
    fireEvent.click(payButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Liquidar Despesa Operacional')).toBeInTheDocument();
      expect(screen.getByText(/confirmar pagamento/i)).toBeInTheDocument();
    });
  });
});
