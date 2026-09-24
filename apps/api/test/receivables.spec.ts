import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReceivablesService } from '../src/receivables/receivables.service';
import { PaymentStatus, PaymentMethod, WorkOrderStatus } from '@erp/shared-types';
import { createMockPrismaService } from './mocks/prisma.mock';

describe('Gestão Financeira de Contas a Receber (ReceivablesService)', () => {
  let receivablesService: ReceivablesService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    prismaMock = createMockPrismaService();
    receivablesService = new ReceivablesService(prismaMock as any);
  });

  describe('Criação e Listagem de Recebíveis', () => {
    it('deve criar um recebível avulso vinculado a um cliente com sucesso', async () => {
      const created = await receivablesService.create({
        partyId: 'p-client-1',
        description: 'Serviço Avulso de Design Gráfico',
        amount: 250.0,
        dueDate: '2026-10-15T00:00:00.000Z',
        installmentNumber: 1,
        totalInstallments: 1,
      });

      expect(created.id).toBeDefined();
      expect(created.description).toBe('Serviço Avulso de Design Gráfico');
      expect(created.amount).toBe(250.0);
      expect(created.status).toBe(PaymentStatus.PENDING);
      expect(created.party?.name).toBe('Cliente Teste Ltda');
    });

    it('deve listar recebíveis e filtrar vencidos dinamicamente (OVERDUE)', async () => {
      const pastDate = new Date(Date.now() - 10 * 86400000).toISOString();
      const futureDate = new Date(Date.now() + 10 * 86400000).toISOString();

      await receivablesService.create({
        partyId: 'p-client-1',
        description: 'Fatura Vencida',
        amount: 300,
        dueDate: pastDate,
      });

      await receivablesService.create({
        partyId: 'p-client-1',
        description: 'Fatura a Vencer',
        amount: 450,
        dueDate: futureDate,
      });

      const overdueResult = await receivablesService.findAll({ status: PaymentStatus.OVERDUE });
      expect(overdueResult.data.length).toBeGreaterThanOrEqual(1);
      expect(overdueResult.data.some((r) => r.description === 'Fatura Vencida')).toBe(true);

      const pendingResult = await receivablesService.findAll({ status: PaymentStatus.PENDING });
      expect(pendingResult.data.some((r) => r.description === 'Fatura a Vencer')).toBe(true);
    });
  });

  describe('Geração de Parcelas para Ordem de Serviço (generateForOrder)', () => {
    it('deve gerar plano 50% de sinal e 50% na retirada', async () => {
      const wo = await prismaMock.workOrder.create({
        data: {
          orderNumber: 'OS-2026-00100',
          partyId: 'p-client-1',
          totalAmount: 1000.0,
          status: WorkOrderStatus.PENDING,
          deliveryDate: new Date('2026-10-01'),
        },
      });

      const installments = await receivablesService.generateForOrder({
        workOrderId: wo.id,
        plan: 'HALF_DOWN_HALF_PICKUP',
        downPaymentPercent: 50,
        firstDueDate: '2026-09-25',
      });

      expect(installments).toHaveLength(2);
      expect(installments[0].amount).toBe(500.0);
      expect(installments[0].installmentNumber).toBe(1);
      expect(installments[0].description).toContain('Sinal (50%)');

      expect(installments[1].amount).toBe(500.0);
      expect(installments[1].installmentNumber).toBe(2);
      expect(installments[1].description).toContain('Saldo na Retirada');
    });

    it('não deve duplicar cobrança quando a OS já possui parcela paga (recalcula apenas o saldo)', async () => {
      const wo = await prismaMock.workOrder.create({
        data: {
          orderNumber: 'OS-2026-00101',
          partyId: 'p-client-1',
          totalAmount: 1000.0,
          status: WorkOrderStatus.PENDING,
        },
      });

      // Simula primeira parcela paga (sinal de 400 pago)
      await prismaMock.receivable.create({
        data: {
          workOrderId: wo.id,
          partyId: wo.partyId,
          description: 'Sinal Pago de R$ 400',
          amount: 400,
          dueDate: new Date(),
          paidAt: new Date(),
          status: PaymentStatus.PAID,
          installmentNumber: 1,
          totalInstallments: 2,
        },
      });

      // Gera parcelas restantes em 2x do saldo restante (1000 - 400 = 600 em 2x de 300)
      const remainingInstallments = await receivablesService.generateForOrder({
        workOrderId: wo.id,
        plan: 'CUSTOM_INSTALLMENTS',
        installmentsCount: 2,
      });

      expect(remainingInstallments).toHaveLength(2);
      expect(remainingInstallments[0].amount).toBe(300);
      expect(remainingInstallments[1].amount).toBe(300);
      expect(remainingInstallments[0].description).toContain('Saldo Parcela');
    });
  });

  describe('Liquidação / Baixa de Recebível (pay)', () => {
    it('deve liquidar recebível com desconto e sincronizar status da OS para PARTIALLY_PAID', async () => {
      const wo = await prismaMock.workOrder.create({
        data: {
          orderNumber: 'OS-2026-00200',
          partyId: 'p-client-1',
          totalAmount: 500.0,
          status: WorkOrderStatus.PENDING,
        },
      });

      const rec1 = await receivablesService.create({
        workOrderId: wo.id,
        partyId: wo.partyId,
        description: 'Parcela 1/2',
        amount: 250.0,
        dueDate: '2026-10-01',
      });

      await receivablesService.create({
        workOrderId: wo.id,
        partyId: wo.partyId,
        description: 'Parcela 2/2',
        amount: 250.0,
        dueDate: '2026-11-01',
      });

      // Dá baixa na parcela 1 com R$ 20 de desconto
      const paidRec = await receivablesService.pay(rec1.id, {
        paymentMethod: PaymentMethod.PIX,
        paidAt: new Date().toISOString(),
        discountAmount: 20,
        notes: 'Desconto promocional aprovado',
      });

      expect(paidRec.status).toBe(PaymentStatus.PAID);
      expect(paidRec.amount).toBe(230.0);
      expect(paidRec.notes).toContain('Desconto: R$ 20.00');

      // Verifica status de pagamento sincronizado na OS
      const updatedWo = await prismaMock.workOrder.findUnique({ where: { id: wo.id } });
      expect(updatedWo?.paymentStatus).toBe(PaymentStatus.PARTIALLY_PAID);
    });

    it('deve liquidar recebível com acréscimo / juros de mora', async () => {
      const rec = await receivablesService.create({
        partyId: 'p-client-1',
        description: 'Boleto em atraso',
        amount: 100.0,
        dueDate: '2026-09-01',
      });

      const paidRec = await receivablesService.pay(rec.id, {
        paymentMethod: PaymentMethod.BOLETO,
        paidAt: new Date().toISOString(),
        surchargeAmount: 15.5,
        notes: 'Cobrança de juros e multa',
      });

      expect(paidRec.status).toBe(PaymentStatus.PAID);
      expect(paidRec.amount).toBe(115.5);
      expect(paidRec.notes).toContain('Acréscimo: R$ 15.50');
    });
  });

  describe('Resumo Financeiro (getSummary)', () => {
    it('deve calcular corretamente totais e taxa de inadimplência ignorando cancelados', async () => {
      // 1. Recebido (R$ 500)
      await prismaMock.receivable.create({
        data: {
          partyId: 'p-client-1',
          description: 'Recebido PIX',
          amount: 500,
          dueDate: new Date(),
          paidAt: new Date(),
          status: PaymentStatus.PAID,
        },
      });

      // 2. A Vencer (R$ 300)
      await prismaMock.receivable.create({
        data: {
          partyId: 'p-client-1',
          description: 'Futuro Boleto',
          amount: 300,
          dueDate: new Date(Date.now() + 15 * 86400000),
          status: PaymentStatus.PENDING,
        },
      });

      // 3. Vencido (R$ 200)
      await prismaMock.receivable.create({
        data: {
          partyId: 'p-client-1',
          description: 'Atrasado',
          amount: 200,
          dueDate: new Date(Date.now() - 5 * 86400000),
          status: PaymentStatus.OVERDUE,
        },
      });

      // 4. Cancelado (R$ 1000) - NÃO deve entrar na soma
      await prismaMock.receivable.create({
        data: {
          partyId: 'p-client-1',
          description: 'Orçamento Cancelado',
          amount: 1000,
          dueDate: new Date(),
          status: PaymentStatus.CANCELLED,
        },
      });

      const summary = await receivablesService.getSummary();
      expect(summary.totalAmount).toBe(1000); // 500 + 300 + 200 (cancelado de 1000 ignorado)
      expect(summary.receivedAmount).toBe(500);
      expect(summary.pendingAmount).toBe(300);
      expect(summary.overdueAmount).toBe(200);
      expect(summary.defaultRatePercent).toBe(20); // 200 / 1000 = 20%
    });
  });
});
