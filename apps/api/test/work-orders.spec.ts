import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { WorkOrdersService } from '../src/work-orders/work-orders.service';
import { WorkOrderStatus, StageStatus, ChannelSource } from '@erp/shared-types';
import { createMockPrismaService } from './mocks/prisma.mock';
import { StageActionEnum } from '../src/work-orders/dto/stage-action.dto';

describe('Máquina de Estados e Chão de Fábrica (WorkOrdersService)', () => {
  let workOrdersService: WorkOrdersService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;
  let eventsGatewayMock: any;

  beforeEach(() => {
    prismaMock = createMockPrismaService();
    eventsGatewayMock = {
      emitWorkOrderStatusChanged: vi.fn(),
      emitOrderReady: vi.fn(),
    };

    workOrdersService = new WorkOrdersService(
      prismaMock as any,
      eventsGatewayMock,
    );
  });

  describe('Transições da Máquina de Estados da OS', () => {
    it('deve permitir a cadeia sequencial correta de status da OS', async () => {
      // Cria uma OS no estado inicial PENDING
      const wo = await prismaMock.workOrder.create({
        data: {
          orderNumber: 'OS-2026-00001',
          barcode: 'OS202600001',
          quoteId: 'q-1',
          partyId: 'p-client-1',
          userId: 'u-admin-1',
          status: WorkOrderStatus.PENDING,
          deliveryDate: new Date(),
          totalAmount: 500,
        },
      });

      // 1. PENDING -> PRE_PRESS
      let updated = await workOrdersService.updateStatus(wo.id, WorkOrderStatus.PRE_PRESS);
      expect(updated.status).toBe(WorkOrderStatus.PRE_PRESS);

      // 2. PRE_PRESS -> PRINTING
      updated = await workOrdersService.updateStatus(wo.id, WorkOrderStatus.PRINTING);
      expect(updated.status).toBe(WorkOrderStatus.PRINTING);

      // 3. PRINTING -> FINISHING
      updated = await workOrdersService.updateStatus(wo.id, WorkOrderStatus.FINISHING);
      expect(updated.status).toBe(WorkOrderStatus.FINISHING);

      // 4. FINISHING -> QUALITY_CONTROL
      updated = await workOrdersService.updateStatus(wo.id, WorkOrderStatus.QUALITY_CONTROL);
      expect(updated.status).toBe(WorkOrderStatus.QUALITY_CONTROL);

      // 5. QUALITY_CONTROL -> READY_FOR_PICKUP
      updated = await workOrdersService.updateStatus(wo.id, WorkOrderStatus.READY_FOR_PICKUP);
      expect(updated.status).toBe(WorkOrderStatus.READY_FOR_PICKUP);
      expect(eventsGatewayMock.emitOrderReady).toHaveBeenCalled();

      // 6. READY_FOR_PICKUP -> DELIVERED
      updated = await workOrdersService.updateStatus(wo.id, WorkOrderStatus.DELIVERED);
      expect(updated.status).toBe(WorkOrderStatus.DELIVERED);
    });

    it('deve rejeitar transições inválidas (pular etapas)', async () => {
      const wo = await prismaMock.workOrder.create({
        data: {
          orderNumber: 'OS-2026-00002',
          barcode: 'OS202600002',
          quoteId: 'q-2',
          partyId: 'p-client-1',
          userId: 'u-admin-1',
          status: WorkOrderStatus.PENDING,
          deliveryDate: new Date(),
          totalAmount: 300,
        },
      });

      // Tentar pular de PENDING direto para DELIVERED deve falhar
      await expect(
        workOrdersService.updateStatus(wo.id, WorkOrderStatus.DELIVERED),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve disparar baixa automática de estoque na transição para PRINTING', async () => {
      const initialStock = prismaMock._state.rawMaterials[0].currentStock; // 1000

      const wo = await prismaMock.workOrder.create({
        data: {
          orderNumber: 'OS-2026-00003',
          barcode: 'OS202600003',
          quoteId: 'q-3',
          partyId: 'p-client-1',
          userId: 'u-admin-1',
          status: WorkOrderStatus.PRE_PRESS,
          deliveryDate: new Date(),
          totalAmount: 400,
        },
      });

      await workOrdersService.updateStatus(wo.id, WorkOrderStatus.PRINTING);

      // Verifica criação do movimento de estoque negativo
      expect(prismaMock.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workOrderId: wo.id,
            reason: 'CONSUMO_PRODUCAO',
          }),
        }),
      );
    });

    it('deve estornar insumos de estoque caso a OS seja CANCELLED', async () => {
      const wo = await prismaMock.workOrder.create({
        data: {
          orderNumber: 'OS-2026-00004',
          barcode: 'OS202600004',
          quoteId: 'q-4',
          partyId: 'p-client-1',
          userId: 'u-admin-1',
          status: WorkOrderStatus.PRINTING,
          deliveryDate: new Date(),
          totalAmount: 400,
        },
      });

      // Simula movimento negativo prévio
      prismaMock._state.stockMovements.push({
        id: 'sm-1',
        rawMaterialId: 'rm-couche-1',
        workOrderId: wo.id,
        quantity: -50,
        reason: 'CONSUMO_PRODUCAO',
      });

      await workOrdersService.updateStatus(wo.id, WorkOrderStatus.CANCELLED);

      // Deve ter criado movimento positivo de estorno
      expect(prismaMock.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workOrderId: wo.id,
            reason: 'ESTORNO_CANCELAMENTO',
          }),
        }),
      );
    });
  });

  describe('Apontamento de Chão de Fábrica (executeStageAction)', () => {
    it('deve iniciar, pausar e concluir uma etapa com registro de perda operacional', async () => {
      // Configura uma etapa no mock
      const stage = {
        id: 'stage-impressao-1',
        workOrderId: 'wo-1',
        stepOrder: 2,
        name: 'Impressão',
        status: StageStatus.PENDING,
        logs: [],
      };
      prismaMock._state.stages.push(stage);

      // 1. START
      const startLog = await workOrdersService.executeStageAction(stage.id, {
        action: StageActionEnum.START,
        operatorId: 'u-op-1',
        machineId: 'm-speedmaster-1',
        notes: 'Iniciando tiragem',
      });
      expect(prismaMock.workOrderStage.update).toHaveBeenCalledWith({
        where: { id: stage.id },
        data: { status: StageStatus.IN_PROGRESS },
      });
      expect(startLog).toBeDefined();

      // 2. COMPLETE com 15 folhas de refugo/perda
      await workOrdersService.executeStageAction(stage.id, {
        action: StageActionEnum.COMPLETE,
        operatorId: 'u-op-1',
        wasteQuantity: 15,
        notes: 'Finalizado com 15 folhas de refugo no acerto de cores',
      });

      expect(prismaMock.workOrderStage.update).toHaveBeenCalledWith({
        where: { id: stage.id },
        data: { status: StageStatus.COMPLETED },
      });
      expect(prismaMock.stageExecutionLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stageId: stage.id,
            operatorId: 'u-op-1',
            wasteQuantity: 15,
          }),
        }),
      );
    });
  });

  describe('Exibição de Nome do Produto e Número da OS', () => {
    it('deve retornar productName mapeado no findAll e findOne', async () => {
      const wo = await prismaMock.workOrder.create({
        data: {
          orderNumber: 'OS-2026-00099',
          barcode: 'OS202600099',
          quoteId: 'q-99',
          partyId: 'p-client-1',
          userId: 'u-admin-1',
          status: WorkOrderStatus.PENDING,
          deliveryDate: new Date(),
          totalAmount: 950,
          quote: {
            items: [{ productName: 'Folders Institucionais 2 Dobras' }],
          },
        },
      });

      const listResult = await workOrdersService.findAll();
      expect(listResult.data.length).toBeGreaterThan(0);
      const foundInList = listResult.data.find((o) => o.id === wo.id);
      expect(foundInList).toBeDefined();
      expect(foundInList?.productName).toBe('Folders Institucionais 2 Dobras');
      expect(foundInList?.orderNumber).toBe('OS-2026-00099');

      const singleResult = await workOrdersService.findOne(wo.id);
      expect(singleResult.orderNumber).toBe('OS-2026-00099');
      expect(singleResult.productName).toBe('Folders Institucionais 2 Dobras');
    });
  });
});

