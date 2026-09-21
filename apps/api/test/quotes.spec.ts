import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QuotesService } from '../src/quotes/quotes.service';
import { ChannelSource, QuoteStatus, WorkOrderStatus } from '@erp/shared-types';
import { createMockPrismaService } from './mocks/prisma.mock';

describe('Módulo de Orçamentos e Aprovação de OS (QuotesService)', () => {
  let quotesService: QuotesService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;
  let eventsGatewayMock: any;

  beforeEach(() => {
    prismaMock = createMockPrismaService();
    eventsGatewayMock = {
      emitWorkOrderStatusChanged: vi.fn(),
      emitOrderReady: vi.fn(),
    };

    quotesService = new QuotesService(
      prismaMock as any,
      eventsGatewayMock,
    );
  });

  describe('QuotesService.create', () => {
    it('deve calcular aproveitamento de corte e preço de venda automaticamente usando business-core', async () => {
      const quote = await quotesService.create(
        {
          partyId: 'p-client-1',
          origin: ChannelSource.WEB,
          markupApplied: 0.40,
          validDays: 10,
          items: [
            {
              productName: 'Cartão de Visita 90x50mm',
              rawMaterialId: 'rm-couche-1',
              quantity: 1000,
              widthMm: 90,
              heightMm: 50,
              colorsFront: 4,
              colorsBack: 4,
              finishingOptions: ['LAMINACAO_FOSCA'],
            },
          ],
        },
        'u-admin-1',
      );

      expect(quote).toBeDefined();
      expect(quote.status).toBe(QuoteStatus.DRAFT);
      expect(quote.items.length).toBe(1);

      const item = quote.items[0];
      // Aproveitamento de corte:
      // Folha pai: 660x960mm. Item: 90x50mm com sangria 3mm -> 96x56mm.
      // Girado a 90° cabe 99 por folha!
      expect(item.itemsPerSheet).toBe(99);
      // Tiragem com 10% de perda: 1000 * 1.10 = 1100 -> ceil(1100 / 99) = 12 folhas
      expect(item.sheetsRequired).toBe(12);

      // Custos calculados:
      expect(Number(item.paperCostCalculated)).toBeGreaterThan(0);
      expect(Number(item.itemTotalAmount)).toBeGreaterThan(0);
      expect(Number(item.unitPrice)).toBeGreaterThan(0);
      expect(Number(quote.totalAmount)).toBeGreaterThan(0);
    });

    it('deve lançar NotFoundException se o cliente não existir', async () => {
      await expect(
        quotesService.create(
          {
            partyId: 'party-inexistente',
            origin: ChannelSource.WEB,
            markupApplied: 0.35,
            items: [
              {
                productName: 'Item',
                quantity: 100,
                widthMm: 100,
                heightMm: 100,
                colorsFront: 4,
                colorsBack: 0,
                finishingOptions: [],
              },
            ],
          },
          'u-admin-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se nenhum item for informado', async () => {
      await expect(
        quotesService.create(
          {
            partyId: 'p-client-1',
            origin: ChannelSource.WEB,
            markupApplied: 0.35,
            items: [],
          },
          'u-admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('QuotesService.approve', () => {
    it('deve aprovar o orçamento e gerar automaticamente a Ordem de Serviço com as 5 etapas', async () => {
      // Cria primeiro um orçamento no mock
      const createdQuote = await quotesService.create(
        {
          partyId: 'p-client-1',
          origin: ChannelSource.WEB,
          markupApplied: 0.35,
          items: [
            {
              productName: 'Folder A4',
              rawMaterialId: 'rm-couche-1',
              quantity: 500,
              widthMm: 210,
              heightMm: 297,
              colorsFront: 4,
              colorsBack: 4,
              finishingOptions: [],
            },
          ],
        },
        'u-admin-1',
      );

      // Aprova o orçamento
      const workOrder = await quotesService.approve(createdQuote.id, 'u-admin-1');

      expect(workOrder).toBeDefined();
      expect(workOrder.status).toBe(WorkOrderStatus.PENDING);
      expect(workOrder.orderNumber).toMatch(/^OS-\d{4}-\d{5}$/);
      expect(workOrder.barcode).toMatch(/^OS\d{4}\d{5}$/);

      // Verifica as 5 etapas obrigatórias
      expect(workOrder.stages.length).toBe(5);
      expect(workOrder.stages.map((s: any) => s.name)).toEqual([
        'Pré-impressão',
        'Impressão',
        'Acabamento',
        'Controle de Qualidade',
        'Expedição / Retirada',
      ]);

      // Verifica emissão do evento WebSocket
      expect(eventsGatewayMock.emitWorkOrderStatusChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          workOrderId: workOrder.id,
          orderNumber: workOrder.orderNumber,
          newStatus: WorkOrderStatus.PENDING,
        }),
      );
    });
  });
});
