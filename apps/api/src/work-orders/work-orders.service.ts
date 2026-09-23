import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  WorkOrder,
  WorkOrderStage,
  StageExecutionLog,
  Party,
  Quote,
  QuoteItem,
  RawMaterial,
  StockMovement,
} from '@erp/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  WorkOrderStatus,
  StageStatus,
  ChannelSource,
  QuoteStatus,
  PaymentStatus,
} from '@erp/shared-types';
import { Decimal } from '@erp/business-core';
import { EventsGateway } from '../events/events.gateway';
import { StageActionDto, StageActionEnum } from './dto/stage-action.dto';
import { CreateDirectOrderDto } from './dto/create-direct-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';

const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.PENDING]: [
    WorkOrderStatus.PRE_PRESS,
    WorkOrderStatus.PRINTING,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.PRE_PRESS]: [
    WorkOrderStatus.PENDING,
    WorkOrderStatus.PRINTING,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.PRINTING]: [
    WorkOrderStatus.PRE_PRESS,
    WorkOrderStatus.FINISHING,
    WorkOrderStatus.QUALITY_CONTROL,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.FINISHING]: [
    WorkOrderStatus.PRINTING,
    WorkOrderStatus.QUALITY_CONTROL,
    WorkOrderStatus.READY_FOR_PICKUP,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.QUALITY_CONTROL]: [
    WorkOrderStatus.FINISHING,
    WorkOrderStatus.PRINTING,
    WorkOrderStatus.READY_FOR_PICKUP,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.READY_FOR_PICKUP]: [
    WorkOrderStatus.QUALITY_CONTROL,
    WorkOrderStatus.DISPATCHED,
    WorkOrderStatus.DELIVERED,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.DISPATCHED]: [
    WorkOrderStatus.READY_FOR_PICKUP,
    WorkOrderStatus.DELIVERED,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.DELIVERED]: [
    WorkOrderStatus.READY_FOR_PICKUP,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.CANCELLED]: [
    WorkOrderStatus.PENDING,
  ],
};


export type WorkOrderWithDetails = WorkOrder & {
  party?: { id: string; name: string; phone: string };
  stages?: WorkOrderStage[];
};

export type WorkOrderFullDetails = WorkOrder & {
  party: Party;
  user: { id: string; name: string; email: string };
  quote: Quote & {
    items: Array<QuoteItem & { rawMaterial: RawMaterial | null }>;
  };
  stages: Array<
    WorkOrderStage & {
      logs: Array<
        StageExecutionLog & {
          operator: { id: string; name: string };
          machine: { id: string; name: string } | null;
        }
      >;
    }
  >;
  stockMovements: Array<StockMovement & { rawMaterial: RawMaterial }>;
};

export interface PaginatedWorkOrdersResponse {
  data: WorkOrderWithDetails[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    status?: WorkOrderStatus,
    search?: string,
  ): Promise<PaginatedWorkOrdersResponse> {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (status) {
      where['status'] = status;
    }

    if (search) {
      where['OR'] = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { party: { name: { contains: search, mode: 'insensitive' } } },
        { party: { phone: { contains: search.replace(/\D/g, '') } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.workOrder.count({ where }),
      this.prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          party: { select: { id: true, name: true, phone: true } },
          stages: { orderBy: { stepOrder: 'asc' } },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<WorkOrderFullDetails> {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }, { barcode: id }],
      },
      include: {
        party: true,
        user: { select: { id: true, name: true, email: true } },
        quote: {
          include: {
            items: {
              include: { rawMaterial: true },
            },
          },
        },
        stages: {
          orderBy: { stepOrder: 'asc' },
          include: {
            logs: {
              orderBy: { startedAt: 'desc' },
              include: {
                operator: { select: { id: true, name: true } },
                machine: { select: { id: true, name: true } },
              },
            },
          },
        },
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          include: { rawMaterial: true },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`Ordem de Serviço ${id} não encontrada.`);
    }

    return workOrder;
  }

  async updateStatus(id: string, newStatus: WorkOrderStatus): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    const currentStatus = workOrder.status as WorkOrderStatus;

    if (currentStatus === newStatus) {
      return workOrder;
    }

    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: não é permitido alterar de '${currentStatus}' para '${newStatus}'.`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Regra PRE_PRESS -> PRINTING: Baixa prevista de estoque dos insumos do orçamento
      if (newStatus === WorkOrderStatus.PRINTING) {
        const existingDeduction = await tx.stockMovement.findFirst({
          where: {
            workOrderId: workOrder.id,
            reason: 'CONSUMO_PRODUCAO',
          },
        });

        if (!existingDeduction) {
          for (const item of workOrder.quote.items) {
            if (item.rawMaterialId && item.sheetsRequired > 0) {
              const qtyToDeduct = new Decimal(item.sheetsRequired).negated();

              await tx.stockMovement.create({
                data: {
                  rawMaterialId: item.rawMaterialId,
                  workOrderId: workOrder.id,
                  quantity: qtyToDeduct.toNumber(),
                  reason: 'CONSUMO_PRODUCAO',
                },
              });

              await tx.rawMaterial.update({
                where: { id: item.rawMaterialId },
                data: {
                  currentStock: {
                    decrement: item.sheetsRequired,
                  },
                },
              });
              this.logger.log(
                `📦 Estoque baixado: ${item.sheetsRequired} folhas de ${item.rawMaterialId} para OS ${workOrder.orderNumber}`
              );
            }
          }
        }
      }

      // 2. Regra -> CANCELLED: Estorno de movimentos de estoque previamente baixados
      if (newStatus === WorkOrderStatus.CANCELLED) {
        const negativeMovements = await tx.stockMovement.findMany({
          where: {
            workOrderId: workOrder.id,
            quantity: { lt: 0 },
          },
        });

        for (const mov of negativeMovements) {
          const positiveReversal = new Decimal(mov.quantity.toString()).abs();

          await tx.stockMovement.create({
            data: {
              rawMaterialId: mov.rawMaterialId,
              workOrderId: workOrder.id,
              quantity: positiveReversal.toNumber(),
              reason: 'ESTORNO_CANCELAMENTO',
            },
          });

          await tx.rawMaterial.update({
            where: { id: mov.rawMaterialId },
            data: {
              currentStock: {
                increment: positiveReversal.toNumber(),
              },
            },
          });
          this.logger.log(
            `🔄 Estoque estornado: ${positiveReversal.toString()} para material ${mov.rawMaterialId} da OS ${workOrder.orderNumber}`
          );
        }
      }

      // 3. Atualizar o status da WorkOrder
      const updated = await tx.workOrder.update({
        where: { id: workOrder.id },
        data: { status: newStatus },
      });

      // 4. Emitir evento WebSocket
      this.eventsGateway.emitWorkOrderStatusChanged({
        workOrderId: updated.id,
        orderNumber: updated.orderNumber,
        previousStatus: currentStatus,
        newStatus,
        updatedAt: new Date().toISOString(),
      });

      // 5. Regra QUALITY_CONTROL -> READY_FOR_PICKUP: notificação específica via WebSocket (Web/Mobile)
      if (newStatus === WorkOrderStatus.READY_FOR_PICKUP) {
        this.eventsGateway.emitOrderReady({
          id: updated.id,
          orderNumber: updated.orderNumber,
          customerName: workOrder.party.name,
        });
      }

      return updated;
    });
  }

  async executeStageAction(
    stageId: string,
    dto: StageActionDto,
  ): Promise<StageExecutionLog | { message: string }> {
    const stage = await this.prisma.workOrderStage.findUnique({
      where: { id: stageId },
      include: {
        logs: {
          where: { finishedAt: null },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!stage) {
      throw new NotFoundException(`Etapa com ID ${stageId} não encontrada.`);
    }

    if (dto.action === StageActionEnum.START) {
      await this.prisma.workOrderStage.update({
        where: { id: stageId },
        data: { status: StageStatus.IN_PROGRESS },
      });

      return this.prisma.stageExecutionLog.create({
        data: {
          stageId,
          operatorId: dto.operatorId,
          machineId: dto.machineId || null,
          startedAt: new Date(),
          notes: dto.notes,
        },
      });
    }

    if (dto.action === StageActionEnum.PAUSE) {
      await this.prisma.workOrderStage.update({
        where: { id: stageId },
        data: { status: StageStatus.PAUSED },
      });

      const openLog = stage.logs[0];
      if (openLog) {
        return this.prisma.stageExecutionLog.update({
          where: { id: openLog.id },
          data: {
            finishedAt: new Date(),
            wasteQuantity: dto.wasteQuantity || openLog.wasteQuantity,
            notes: dto.notes || openLog.notes,
          },
        });
      }
      return { message: 'Etapa pausada com sucesso.' };
    }

    if (dto.action === StageActionEnum.COMPLETE) {
      await this.prisma.workOrderStage.update({
        where: { id: stageId },
        data: { status: StageStatus.COMPLETED },
      });

      const openLog = stage.logs[0];
      if (openLog) {
        return this.prisma.stageExecutionLog.update({
          where: { id: openLog.id },
          data: {
            finishedAt: new Date(),
            wasteQuantity: dto.wasteQuantity !== undefined ? dto.wasteQuantity : openLog.wasteQuantity,
            notes: dto.notes || openLog.notes,
          },
        });
      } else {
        return this.prisma.stageExecutionLog.create({
          data: {
            stageId,
            operatorId: dto.operatorId,
            machineId: dto.machineId || null,
            startedAt: new Date(),
            finishedAt: new Date(),
            wasteQuantity: dto.wasteQuantity || 0,
            notes: dto.notes,
          },
        });
      }
    }

    throw new BadRequestException('Ação desconhecida.');
  }

  async createDirect(dto: CreateDirectOrderDto, userId: string): Promise<WorkOrder> {
    const party = await this.prisma.party.findUnique({
      where: { id: dto.partyId },
    });
    if (!party) {
      throw new NotFoundException(`Cliente com ID ${dto.partyId} não encontrado.`);
    }

    const currentYear = new Date().getFullYear();
    const deliveryDays = dto.deliveryDays || 5;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

    const result = await this.prisma.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          partyId: dto.partyId,
          userId,
          status: QuoteStatus.APPROVED,
          origin: ChannelSource.WEB,
          totalCost: dto.totalAmount,
          markupApplied: 0.3,
          totalAmount: dto.totalAmount,
          validUntil: deliveryDate,
          notes: dto.notes,
          items: {
            create: [
              {
                productName: dto.productName,
                quantity: dto.quantity,
                widthMm: 0,
                heightMm: 0,
                colorsFront: 4,
                colorsBack: 0,
                finishingOptions: [],
                sheetsRequired: 0,
                itemsPerSheet: 1,
                paperCostCalculated: 0,
                finishingCostTotal: 0,
                machineCostTotal: 0,
                unitPrice: dto.quantity > 0 ? dto.totalAmount / dto.quantity : dto.totalAmount,
                itemTotalAmount: dto.totalAmount,
              },
            ],
          },
        },
      });

      const orderNumber = `OS-${currentYear}-${String(quote.code).padStart(5, '0')}`;
      const barcode = `OS${currentYear}${String(quote.code).padStart(5, '0')}`;

      const workOrder = await tx.workOrder.create({
        data: {
          orderNumber,
          barcode,
          quoteId: quote.id,
          partyId: dto.partyId,
          userId,
          origin: ChannelSource.WEB,
          status: WorkOrderStatus.PENDING,
          priority: dto.priority || 2,
          deliveryDate,
          totalAmount: dto.totalAmount,
          paymentStatus: PaymentStatus.PENDING,
          stages: {
            create: [
              { stepOrder: 1, name: 'Pré-impressão', status: StageStatus.PENDING },
              { stepOrder: 2, name: 'Impressão', status: StageStatus.PENDING },
              { stepOrder: 3, name: 'Acabamento', status: StageStatus.PENDING },
              { stepOrder: 4, name: 'Controle de Qualidade', status: StageStatus.PENDING },
              { stepOrder: 5, name: 'Expedição / Retirada', status: StageStatus.PENDING },
            ],
          },
        },
        include: {
          stages: { orderBy: { stepOrder: 'asc' } },
          party: { select: { id: true, name: true, phone: true } },
        },
      });

      return workOrder;
    });

    this.eventsGateway.emitWorkOrderStatusChanged({
      workOrderId: result.id,
      orderNumber: result.orderNumber,
      previousStatus: WorkOrderStatus.PENDING,
      newStatus: WorkOrderStatus.PENDING,
      updatedAt: new Date().toISOString(),
    });

    return result;
  }

  async update(id: string, dto: UpdateWorkOrderDto): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update WorkOrder fields
      const workOrderUpdateData: Record<string, any> = {};
      if (dto.partyId) workOrderUpdateData.partyId = dto.partyId;
      if (dto.priority !== undefined) workOrderUpdateData.priority = dto.priority;
      if (dto.totalAmount !== undefined) workOrderUpdateData.totalAmount = dto.totalAmount;
      if (dto.deliveryDays !== undefined) {
        workOrderUpdateData.deliveryDate = new Date(Date.now() + dto.deliveryDays * 86400000);
      }

      const updatedWorkOrder = await tx.workOrder.update({
        where: { id: workOrder.id },
        data: workOrderUpdateData,
        include: {
          stages: { orderBy: { stepOrder: 'asc' } },
          party: { select: { id: true, name: true, phone: true } },
        },
      });

      // 2. Update Quote & QuoteItem if needed
      const quoteUpdateData: Record<string, any> = {};
      if (dto.partyId) quoteUpdateData.partyId = dto.partyId;
      if (dto.totalAmount !== undefined) quoteUpdateData.totalAmount = dto.totalAmount;
      if (dto.notes !== undefined) quoteUpdateData.notes = dto.notes;

      if (Object.keys(quoteUpdateData).length > 0) {
        await tx.quote.update({
          where: { id: workOrder.quoteId },
          data: quoteUpdateData,
        });
      }

      // Update QuoteItem if productName, quantity or totalAmount provided
      if (dto.productName !== undefined || dto.quantity !== undefined || dto.totalAmount !== undefined) {
        const firstItem = workOrder.quote?.items?.[0];
        if (firstItem) {
          const newQty = dto.quantity !== undefined ? dto.quantity : firstItem.quantity;
          const newTotal = dto.totalAmount !== undefined ? dto.totalAmount : Number(firstItem.itemTotalAmount);
          const newUnitPrice = newQty > 0 ? newTotal / newQty : newTotal;

          await tx.quoteItem.update({
            where: { id: firstItem.id },
            data: {
              ...(dto.productName ? { productName: dto.productName } : {}),
              ...(dto.quantity ? { quantity: dto.quantity } : {}),
              ...(dto.totalAmount !== undefined ? { itemTotalAmount: dto.totalAmount } : {}),
              unitPrice: newUnitPrice,
            },
          });
        }
      }

      return updatedWorkOrder;
    });

    this.eventsGateway.emitWorkOrderStatusChanged({
      workOrderId: result.id,
      orderNumber: result.orderNumber,
      previousStatus: result.status as WorkOrderStatus,
      newStatus: result.status as WorkOrderStatus,
      updatedAt: new Date().toISOString(),
    });

    return result;
  }

  async remove(id: string): Promise<WorkOrder> {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        stages: true,
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`Ordem de Serviço com ID ${id} não encontrada.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const stageIds = workOrder.stages.map((s) => s.id);
      if (stageIds.length > 0) {
        await tx.stageExecutionLog.deleteMany({
          where: { stageId: { in: stageIds } },
        });
      }

      await tx.workOrderStage.deleteMany({
        where: { workOrderId: workOrder.id },
      });

      await tx.stockMovement.deleteMany({
        where: { workOrderId: workOrder.id },
      });

      const deleted = await tx.workOrder.delete({
        where: { id: workOrder.id },
      });

      await tx.quote.update({
        where: { id: workOrder.quoteId },
        data: { status: QuoteStatus.DRAFT },
      });

      return deleted;
    });
  }
}

