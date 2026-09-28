import { describe, it, expect, beforeEach } from 'vitest';
import { OperatingExpensesService } from '../src/operating-expenses/operating-expenses.service';
import { ExpenseCategory, ExpenseType, PaymentStatus, PaymentMethod } from '@erp/shared-types';
import { createMockPrismaService } from './mocks/prisma.mock';

describe('Despesas Operacionais (OperatingExpensesService)', () => {
  let service: OperatingExpensesService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    prismaMock = createMockPrismaService();
    service = new OperatingExpensesService(prismaMock as any);
  });

  describe('Criação e mapeamento com status dinâmico', () => {
    it('deve marcar automaticamente como OVERDUE se a data de vencimento estiver no passado', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const created = await service.create({
        description: 'Boleto Vencido Semana Passada',
        category: ExpenseCategory.UTILITIES,
        expenseType: ExpenseType.VARIABLE,
        amount: 250,
        dueDate: pastDate.toISOString(),
        competenceDate: '2026-09-01T12:00:00.000Z',
      });

      expect(created.status).toBe(PaymentStatus.OVERDUE);
    });

    it('deve manter PENDING se o vencimento for futuro', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const created = await service.create({
        description: 'Aluguel do Mês que Vem',
        category: ExpenseCategory.RENT_FACILITIES,
        expenseType: ExpenseType.FIXED,
        amount: 3200,
        dueDate: futureDate.toISOString(),
        competenceDate: '2026-09-01T12:00:00.000Z',
      });

      expect(created.status).toBe(PaymentStatus.PENDING);
    });
  });

  describe('Duplicação de despesas recorrentes (duplicateNextMonth)', () => {
    it('deve duplicar preservando o último dia do mês quando houver transbordamento de dias (ex: 31 de janeiro para 28 de fevereiro)', async () => {
      const baseComp = new Date('2026-01-31T12:00:00.000Z');
      const baseDue = new Date('2026-01-31T12:00:00.000Z');

      const original = await prismaMock.operatingExpense.create({
        data: {
          description: 'Software Mensal RIP',
          category: ExpenseCategory.SOFTWARE_LICENSES,
          expenseType: ExpenseType.FIXED,
          amount: 450,
          dueDate: baseDue,
          competenceDate: baseComp,
          status: PaymentStatus.PAID,
          paidAt: new Date('2026-01-30T12:00:00.000Z'),
          notes: 'Licença mensal [Valor original: R$ 450.00 - Liquidado: R$ 450.00]',
          isRecurring: true,
        },
      });

      const duplicated = await service.duplicateNextMonth(original.id);

      const duplicatedDue = new Date(duplicated.dueDate);
      const duplicatedComp = new Date(duplicated.competenceDate);

      // Em fevereiro de 2026 (não bissexto), o último dia é 28
      expect(duplicatedDue.getUTCMonth()).toBe(1); // Fevereiro (mês 1)
      expect(duplicatedDue.getUTCDate()).toBe(28); // 28 de Fevereiro, NÃO transbordou para Março!
      expect(duplicatedComp.getUTCMonth()).toBe(1);
      expect(duplicatedComp.getUTCDate()).toBe(28);

      // Status deve ser resetado para não pago
      expect(duplicated.paidAt).toBeNull();

      // Notas de liquidação antiga devem ter sido limpas
      expect(duplicated.notes).not.toContain('Liquidado:');
      expect(duplicated.notes).toContain('[Recorrência gerada]');
    });
  });

  describe('Liquidação de despesa (pay)', () => {
    it('deve liquidar com anotação automática se houver acréscimo de juros ou desconto', async () => {
      const original = await prismaMock.operatingExpense.create({
        data: {
          description: 'Conta de Água',
          category: ExpenseCategory.UTILITIES,
          expenseType: ExpenseType.VARIABLE,
          amount: 200,
          dueDate: new Date('2026-09-20T12:00:00.000Z'),
          competenceDate: new Date('2026-09-01T12:00:00.000Z'),
          status: PaymentStatus.PENDING,
        },
      });

      const paid = await service.pay(original.id, {
        paidAt: '2026-09-22T12:00:00.000Z',
        paidAmount: 215.5, // 15.50 de juros por atraso
        paymentMethod: PaymentMethod.PIX,
        notes: 'Pago com multa por atraso no terminal',
      });

      expect(paid.status).toBe(PaymentStatus.PAID);
      expect(paid.amount).toBe(215.5);
      expect(paid.notes).toContain('Valor original: R$ 200.00 - Liquidado: R$ 215.50');
      expect(paid.notes).toContain('Pago com multa por atraso no terminal');
    });
  });

  describe('Filtro por intervalo entre datas e base de data (startDate, endDate, dateField)', () => {
    it('deve filtrar despesas dentro do intervalo de datas especificado (startDate e endDate)', async () => {
      await prismaMock.operatingExpense.create({
        data: {
          description: 'Despesa Início do Mês',
          category: ExpenseCategory.UTILITIES,
          amount: 100,
          dueDate: new Date('2026-09-05T12:00:00Z'),
          competenceDate: new Date('2026-09-05T12:00:00Z'),
          status: PaymentStatus.PENDING,
        },
      });

      await prismaMock.operatingExpense.create({
        data: {
          description: 'Despesa Meio do Mês',
          category: ExpenseCategory.OFFICE_ADMINISTRATIVE,
          amount: 250,
          dueDate: new Date('2026-09-15T12:00:00Z'),
          competenceDate: new Date('2026-09-15T12:00:00Z'),
          status: PaymentStatus.PENDING,
        },
      });

      await prismaMock.operatingExpense.create({
        data: {
          description: 'Despesa Fim do Mês',
          category: ExpenseCategory.RENT_FACILITIES,
          amount: 500,
          dueDate: new Date('2026-09-28T12:00:00Z'),
          competenceDate: new Date('2026-09-28T12:00:00Z'),
          status: PaymentStatus.PENDING,
        },
      });

      const res = await service.findAll(
        1,
        20,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '2026-09-10',
        '2026-09-20',
        'competenceDate',
      );

      expect(res.data.length).toBe(1);
      expect(res.data[0].description).toBe('Despesa Meio do Mês');
    });

    it('deve permitir filtrar com base na data de vencimento (dueDate)', async () => {
      await prismaMock.operatingExpense.create({
        data: {
          description: 'Aluguel Vencimento Outubro',
          category: ExpenseCategory.RENT_FACILITIES,
          amount: 3000,
          dueDate: new Date('2026-10-10T12:00:00Z'),
          competenceDate: new Date('2026-09-01T12:00:00Z'),
          status: PaymentStatus.PENDING,
        },
      });

      const res = await service.findAll(
        1,
        20,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '2026-10-01',
        '2026-10-15',
        'dueDate',
      );

      expect(res.data.some((d) => d.description === 'Aluguel Vencimento Outubro')).toBe(true);
    });
  });
});
