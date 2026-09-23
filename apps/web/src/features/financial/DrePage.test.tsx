import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '../../test/test-utils';
import { DrePage } from './DrePage';
import { api } from '../../lib/api';
import { ExpenseCategory } from '@erp/shared-types';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('DrePage', () => {
  const mockDre = {
    competenceMonth: '2026-09',
    grossRevenue: 25000,
    taxRatePercent: 6.0,
    taxDeductions: 1500,
    netRevenue: 23500,
    cpvTotal: 9500,
    cpvBreakdown: {
      paperCost: 5000,
      printingMachineCost: 3500,
      finishingCost: 1000,
    },
    grossProfit: 14000,
    grossMarginPercent: 59.6,
    opexTotal: 5800,
    opexBreakdown: [
      {
        category: ExpenseCategory.RENT_FACILITIES,
        label: 'Aluguel & Estrutura',
        amount: 3500,
      },
      {
        category: ExpenseCategory.UTILITIES,
        label: 'Utilidades & Energia',
        amount: 1500,
      },
      {
        category: ExpenseCategory.SOFTWARE_LICENSES,
        label: 'Softwares & Licenças',
        amount: 800,
      },
    ],
    ebitda: 8200,
    ebitdaMarginPercent: 34.9,
    breakEvenPoint: 9731.54,
    sections: [
      {
        code: '1.0',
        name: 'RECEITA OPERACIONAL BRUTA',
        amount: 25000,
        percentageOfRevenue: 106.4,
        isTotal: false,
        type: 'REVENUE',
        children: [
          {
            name: 'Faturamento de Ordens de Serviço (12 OS)',
            amount: 25000,
            percentage: 100,
          },
        ],
      },
      {
        code: '1.1',
        name: '(-) Deduções e Impostos sobre Vendas (6.0%)',
        amount: 1500,
        percentageOfRevenue: 6.4,
        isTotal: false,
        type: 'DEDUCTION',
      },
      {
        code: '2.0',
        name: '(=) RECEITA OPERACIONAL LÍQUIDA',
        amount: 23500,
        percentageOfRevenue: 100,
        isTotal: true,
        type: 'REVENUE',
      },
      {
        code: '3.0',
        name: '(-) CUSTO DOS PRODUTOS VENDIDOS (CPV)',
        amount: 9500,
        percentageOfRevenue: 40.4,
        isTotal: false,
        type: 'CPV',
        children: [
          { name: 'Papéis e Substratos Planos', amount: 5000, percentage: 52.6 },
          { name: 'Hora-Máquina de Impressão e Setup', amount: 3500, percentage: 36.8 },
          { name: 'Acabamentos e Serviços de Terceiros', amount: 1000, percentage: 10.5 },
        ],
      },
      {
        code: '4.0',
        name: '(=) LUCRO BRUTO (MARGEM DE CONTRIBUIÇÃO)',
        amount: 14000,
        percentageOfRevenue: 59.6,
        isTotal: true,
        type: 'RESULT',
      },
      {
        code: '5.0',
        name: '(-) DESPESAS OPERACIONAIS (OPEX)',
        amount: 5800,
        percentageOfRevenue: 24.7,
        isTotal: false,
        type: 'OPEX',
        children: [
          { name: 'Aluguel & Estrutura', amount: 3500, percentage: 60.3 },
          { name: 'Utilidades & Energia', amount: 1500, percentage: 25.9 },
          { name: 'Softwares & Licenças', amount: 800, percentage: 13.8 },
        ],
      },
      {
        code: '6.0',
        name: '(=) RESULTADO OPERACIONAL (EBITDA)',
        amount: 8200,
        percentageOfRevenue: 34.9,
        isTotal: true,
        type: 'RESULT',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: mockDre });
  });

  it('renders DRE header, KPI cards and formatted currency amounts', async () => {
    renderWithProviders(<DrePage />);

    expect(screen.getByText('DRE Gerencial em Tempo Real')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Faturamento Bruto')).toBeInTheDocument();
      expect(screen.getAllByText('R$ 25.000,00').length).toBeGreaterThan(0);
      expect(screen.getByText('Margem de Contribuição')).toBeInTheDocument();
      expect(screen.getAllByText('R$ 14.000,00').length).toBeGreaterThan(0);
      expect(screen.getByText('EBITDA (Resultado Operacional)')).toBeInTheDocument();
      expect(screen.getAllByText('R$ 8.200,00').length).toBeGreaterThan(0);
    });
  });

  it('renders hierarchical accounting sections with codes and amounts', async () => {
    renderWithProviders(<DrePage />);

    await waitFor(() => {
      expect(screen.getByText('RECEITA OPERACIONAL BRUTA')).toBeInTheDocument();
      expect(screen.getByText('(=) RECEITA OPERACIONAL LÍQUIDA')).toBeInTheDocument();
      expect(screen.getByText('(-) CUSTO DOS PRODUTOS VENDIDOS (CPV)')).toBeInTheDocument();
      expect(screen.getByText('(=) LUCRO BRUTO (MARGEM DE CONTRIBUIÇÃO)')).toBeInTheDocument();
      expect(screen.getByText('(-) DESPESAS OPERACIONAIS (OPEX)')).toBeInTheDocument();
      expect(screen.getByText('(=) RESULTADO OPERACIONAL (EBITDA)')).toBeInTheDocument();
    });
  });

  it('allows toggling child breakdown items when clicking on expandable rows', async () => {
    renderWithProviders(<DrePage />);

    await waitFor(() => {
      expect(screen.getByText(/Papéis e Substratos Planos/i)).toBeInTheDocument();
    });

    const cpvRow = screen.getByText('(-) CUSTO DOS PRODUTOS VENDIDOS (CPV)');
    fireEvent.click(cpvRow);

    // Collapsed
    await waitFor(() => {
      expect(screen.queryByText(/Papéis e Substratos Planos/i)).not.toBeInTheDocument();
    });
  });
});
