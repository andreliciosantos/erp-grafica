import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '../../test/test-utils';
import { NewQuotePage } from './NewQuotePage';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('NewQuotePage - Payment Conditions & Installments', () => {
  const mockParties = [
    { id: 'party-1', name: 'Cliente Gráfica Teste', isCustomer: true, document: '123' },
  ];
  const mockMaterials = [
    {
      id: 'mat-1',
      name: 'Couché 150g',
      sheetWidthMm: 660,
      sheetHeightMm: 960,
      costPerUnit: 0.85,
    },
  ];
  const mockMachines = [
    {
      id: 'mach-1',
      name: 'Heidelberg Speedmaster',
      hourlyRate: 200,
      setupMinutes: 15,
      maxSheetsHour: 5000,
      isActive: true,
    },
  ];
  const mockConditions = [
    {
      id: 'cond-1',
      name: 'À Vista (100%)',
      installmentsCount: 1,
      downPaymentPercent: 100,
      intervalDays: 0,
      dayOffsets: [0],
      isDefault: true,
      isActive: true,
    },
    {
      id: 'cond-2',
      name: '3x Sem Juros (30/60/90d)',
      installmentsCount: 3,
      downPaymentPercent: 0,
      intervalDays: 30,
      dayOffsets: [30, 60, 90],
      isDefault: false,
      isActive: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/parties')) return Promise.resolve({ data: { data: mockParties } });
      if (url.includes('/raw-materials')) return Promise.resolve({ data: { data: mockMaterials } });
      if (url.includes('/machines')) return Promise.resolve({ data: mockMachines });
      if (url.includes('/product-templates')) return Promise.resolve({ data: [] });
      if (url.includes('/payment-conditions')) return Promise.resolve({ data: mockConditions });
      return Promise.resolve({ data: [] });
    });
    (api.post as any).mockResolvedValue({ data: { id: 'quote-123', code: 101 } });
  });

  it('renders technical calculator and payment conditions section', async () => {
    renderWithProviders(<NewQuotePage />);

    expect(screen.getByText(/Calculadora Gráfica de Orçamento Técnico/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Condições de Pagamento & Parcelamento')).toBeInTheDocument();
      expect(screen.getByText('À Vista (100%)')).toBeInTheDocument();
      expect(screen.getByText('3x Sem Juros (30/60/90d)')).toBeInTheDocument();
      expect(screen.getByText(/1º Vencimento/i)).toBeInTheDocument();
      expect(screen.getByText(/Nº de Parcelas/i)).toBeInTheDocument();
    });
  });

  it('switches condition when clicking quick access button and updates installments schedule', async () => {
    renderWithProviders(<NewQuotePage />);

    await waitFor(() => {
      expect(screen.getByText('3x Sem Juros (30/60/90d)')).toBeInTheDocument();
    });

    const button3x = screen.getByText('3x Sem Juros (30/60/90d)');
    fireEvent.click(button3x);

    await waitFor(() => {
      expect(screen.getByText(/3 parcelas/i)).toBeInTheDocument();
    });
  });

  it('submits quote with detailed installments array in payload', async () => {
    renderWithProviders(<NewQuotePage />);

    await waitFor(() => {
      expect(screen.getByText('Condições de Pagamento & Parcelamento')).toBeInTheDocument();
      expect(screen.getByText('Cliente Gráfica Teste (123)')).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /Salvar Orçamento Técnico/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/quotes',
        expect.objectContaining({
          partyId: 'party-1',
          installments: expect.arrayContaining([
            expect.objectContaining({
              installmentNumber: expect.any(Number),
              amount: expect.any(Number),
              dueDate: expect.any(String),
            }),
          ]),
        })
      );
    });
  });
});
