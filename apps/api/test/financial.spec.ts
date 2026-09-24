import { describe, it, expect, beforeEach } from 'vitest';
import { FinancialService } from '../src/financial/financial.service';
import { WorkOrderStatus, PaymentStatus, ExpenseCategory } from '@erp/shared-types';
import { createMockPrismaService } from './mocks/prisma.mock';

describe('Relatórios Financeiros e DRE (FinancialService)', () => {
  let financialService: FinancialService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    prismaMock = createMockPrismaService();
    financialService = new FinancialService(prismaMock as any);
  });

  describe('DRE Gerencial por Competência (getDre)', () => {
    it('deve calcular a DRE completa respeitando CPV, OPEX, Margem e Ponto de Equilíbrio', async () => {
      const month = '2026-09';
      const competenceDate = new Date('2026-09-15T12:00:00Z');

      // 1. Ordem de Serviço faturada no mês
      await prismaMock.workOrder.create({
        data: {
          orderNumber: 'OS-DRE-001',
          partyId: 'p-client-1',
          totalAmount: 5000.0,
          status: WorkOrderStatus.COMPLETED,
          createdAt: competenceDate,
          quote: {
            items: [
              {
                paperCostCalculated: 1200.0,
                machineCostTotal: 600.0,
                finishingCostTotal: 200.0,
              },
            ],
          },
        },
      });

      // 2. Despesas Operacionais no mês
      await prismaMock.operatingExpense.create({
        data: {
          description: 'Aluguel do Galpão',
          amount: 1000.0,
          category: ExpenseCategory.RENT_FACILITIES,
          competenceDate,
          status: PaymentStatus.PAID,
        },
      });

      await prismaMock.operatingExpense.create({
        data: {
          description: 'Conta de Energia Elétrica',
          amount: 500.0,
          category: ExpenseCategory.UTILITIES,
          competenceDate,
          status: PaymentStatus.PENDING,
        },
      });

      // Executa DRE com imposto de 6%
      const dre = await financialService.getDre(month, 6.0);

      // Receita Bruta: 5000
      expect(dre.grossRevenue).toBe(5000.0);
      // Impostos (6% de 5000): 300
      expect(dre.taxDeductions).toBe(300.0);
      // Receita Líquida: 4700
      expect(dre.netRevenue).toBe(4700.0);
      // CPV: 1200 + 600 + 200 = 2000
      expect(dre.cpvTotal).toBe(2000.0);
      // Lucro Bruto: 4700 - 2000 = 2700
      expect(dre.grossProfit).toBe(2700.0);
      // Margem Bruta: (2700 / 4700) * 100 = 57.45%
      expect(dre.grossMarginPercent).toBe(57.45);
      // OPEX: 1000 + 500 = 1500
      expect(dre.opexTotal).toBe(1500.0);
      // EBITDA: 2700 - 1500 = 1200
      expect(dre.ebitda).toBe(1200.0);
      // Ponto de Equilíbrio: OPEX / (MargemBruta / 100) = 1500 / 0.5745 = 2610.97
      expect(dre.breakEvenPoint).toBeCloseTo(2610.97, 1);
    });

    it('não deve computar OS e Despesas CANCELADAS na DRE', async () => {
      const month = '2026-09';
      const competenceDate = new Date('2026-09-10T12:00:00Z');

      // OS Válida
      await prismaMock.workOrder.create({
        data: {
          orderNumber: 'OS-VALIDA',
          partyId: 'p-client-1',
          totalAmount: 2000.0,
          status: WorkOrderStatus.IN_PRODUCTION,
          createdAt: competenceDate,
        },
      });

      // OS Cancelada (deve ser ignorada)
      await prismaMock.workOrder.create({
        data: {
          orderNumber: 'OS-CANCELADA',
          partyId: 'p-client-1',
          totalAmount: 10000.0,
          status: WorkOrderStatus.CANCELLED,
          createdAt: competenceDate,
        },
      });

      // Despesa Cancelada (deve ser ignorada)
      await prismaMock.operatingExpense.create({
        data: {
          description: 'Despesa Cancelada',
          amount: 5000.0,
          category: ExpenseCategory.OTHER,
          competenceDate,
          status: PaymentStatus.CANCELLED,
        },
      });

      const dre = await financialService.getDre(month, 0);
      expect(dre.grossRevenue).toBe(2000.0);
      expect(dre.opexTotal).toBe(0.0);
    });
  });

  describe('Fluxo de Caixa Diário (getCashFlow)', () => {
    it('deve discriminar corretamente entradas e saídas realizadas vs projetadas', async () => {
      const month = '2026-09';

      // 1. Recebimento Realizado (PIX pago no dia 10)
      await prismaMock.receivable.create({
        data: {
          partyId: 'p-client-1',
          description: 'Entrada Realizada',
          amount: 1500.0,
          dueDate: new Date('2026-09-10T00:00:00Z'),
          paidAt: new Date('2026-09-10T14:30:00Z'),
          status: PaymentStatus.PAID,
        },
      });

      // 2. Recebimento Previsto (Boleto com vencimento dia 20)
      await prismaMock.receivable.create({
        data: {
          partyId: 'p-client-1',
          description: 'Entrada Projetada',
          amount: 2500.0,
          dueDate: new Date('2026-09-20T00:00:00Z'),
          status: PaymentStatus.PENDING,
        },
      });

      // 3. Pagamento Realizado (Fornecedor pago no dia 05)
      await prismaMock.operatingExpense.create({
        data: {
          description: 'Fornecedor de Tinta',
          amount: 800.0,
          dueDate: new Date('2026-09-05T00:00:00Z'),
          paidAt: new Date('2026-09-05T10:00:00Z'),
          status: PaymentStatus.PAID,
        },
      });

      const cashFlow = await financialService.getCashFlow(month);

      expect(cashFlow.realizedInflows).toBe(1500.0);
      expect(cashFlow.projectedInflows).toBe(2500.0);
      expect(cashFlow.totalInflows).toBe(4000.0);

      expect(cashFlow.realizedOutflows).toBe(800.0);
      expect(cashFlow.projectedOutflows).toBe(0.0);
      expect(cashFlow.totalOutflows).toBe(800.0);

      expect(cashFlow.netCashFlow).toBe(3200.0); // 4000 - 800
      expect(cashFlow.days.length).toBe(30); // Setembro tem 30 dias
    });
  });
});
