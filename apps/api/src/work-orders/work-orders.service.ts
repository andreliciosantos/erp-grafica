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
  PaymentMethod,
} from '@erp/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  WorkOrderStatus,
  StageStatus,
  ChannelSource,
  QuoteStatus,
  PaymentStatus,
  PartyType,
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
  productName?: string;
  quote?: any;
};

export type WorkOrderFullDetails = WorkOrder & {
  productName?: string;
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
        { quote: { items: { some: { productName: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    const [total, rawData] = await Promise.all([
      this.prisma.workOrder.count({ where }),
      this.prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          party: { select: { id: true, name: true, phone: true } },
          stages: { orderBy: { stepOrder: 'asc' } },
          quote: {
            select: {
              id: true,
              notes: true,
              items: {
                select: {
                  id: true,
                  productName: true,
                  quantity: true,
                  widthMm: true,
                  heightMm: true,
                  colorsFront: true,
                  colorsBack: true,
                  sheetsRequired: true,
                  itemsPerSheet: true,
                  rawMaterial: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const data: WorkOrderWithDetails[] = rawData.map((order) => {
      const primaryItem = (order as any).quote?.items?.[0];
      return {
        ...order,
        productName: primaryItem?.productName || (order as any).quote?.notes || 'Material Gráfico',
      };
    });

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

    const primaryItem = workOrder.quote?.items?.[0];
    return {
      ...workOrder,
      productName: primaryItem?.productName || workOrder.quote?.notes || 'Material Gráfico',
    };
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
    let partyId = dto.partyId;

    if (!partyId) {
      let defaultCustomer = await this.prisma.party.findFirst({
        where: {
          OR: [
            { document: '00000000000' },
            { name: { contains: 'Balcão', mode: 'insensitive' } },
            { name: { contains: 'Consumidor Final', mode: 'insensitive' } },
          ],
        },
      });

      if (!defaultCustomer) {
        defaultCustomer = await this.prisma.party.create({
          data: {
            type: PartyType.INDIVIDUAL,
            name: 'Cliente Balcão / Consumidor Final',
            tradeName: 'Consumidor Avulso',
            document: '00000000000',
            phone: '00000000000',
            isCustomer: true,
            isSupplier: false,
          },
        });
      }
      partyId = defaultCustomer.id;
    } else {
      const party = await this.prisma.party.findUnique({
        where: { id: partyId },
      });
      if (!party) {
        throw new NotFoundException(`Cliente com ID ${partyId} não encontrado.`);
      }
    }

    const currentYear = new Date().getFullYear();
    const deliveryDays = dto.deliveryDays ?? (dto.status === WorkOrderStatus.DELIVERED ? 0 : 5);
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

    const hasItems = Array.isArray(dto.items) && dto.items.length > 0;
    const resolvedProductName =
      dto.productName?.trim() ||
      (hasItems ? dto.items!.map((it) => `${it.productName} (${it.quantity}x)`).join(', ') : 'Serviço Rápido de Balcão');

    const totalQuantity =
      dto.quantity && dto.quantity > 0
        ? dto.quantity
        : (hasItems ? dto.items!.reduce((acc, it) => acc + (it.quantity || 1), 0) : 1);

    const initialStatus = (dto.status as WorkOrderStatus) || WorkOrderStatus.PENDING;
    const initialPaymentStatus = (dto.paymentStatus as PaymentStatus) || (dto.paymentMethod ? PaymentStatus.PAID : PaymentStatus.PENDING);
    const initialStageStatus =
      initialStatus === WorkOrderStatus.DELIVERED || initialStatus === WorkOrderStatus.READY_FOR_PICKUP
        ? StageStatus.COMPLETED
        : StageStatus.PENDING;

    const result = await this.prisma.$transaction(async (tx) => {
      const itemsToCreate = hasItems
        ? dto.items!.map((it) => {
            const uPrice = it.unitPrice ?? (it.quantity > 0 && it.itemTotalAmount ? it.itemTotalAmount / it.quantity : 0);
            const iTotal = it.itemTotalAmount ?? (it.quantity * uPrice);
            const consumePerUnit = it.materialQuantity ?? 1;
            const sheetsRequired = it.rawMaterialId ? Math.ceil(it.quantity * consumePerUnit) : 0;
            return {
              productName: it.productName,
              rawMaterialId: it.rawMaterialId || null,
              quantity: it.quantity,
              widthMm: 0,
              heightMm: 0,
              colorsFront: 4,
              colorsBack: 0,
              finishingOptions: [],
              sheetsRequired,
              itemsPerSheet: 1,
              paperCostCalculated: 0,
              finishingCostTotal: 0,
              machineCostTotal: 0,
              unitPrice: uPrice,
              itemTotalAmount: iTotal,
            };
          })
        : [
            {
              productName: resolvedProductName,
              rawMaterialId: null,
              quantity: totalQuantity,
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
              unitPrice: totalQuantity > 0 ? dto.totalAmount / totalQuantity : dto.totalAmount,
              itemTotalAmount: dto.totalAmount,
            },
          ];

      const quote = await tx.quote.create({
        data: {
          partyId,
          userId,
          status: QuoteStatus.APPROVED,
          origin: ChannelSource.WEB,
          totalCost: dto.totalAmount,
          markupApplied: 0.3,
          totalAmount: dto.totalAmount,
          validUntil: deliveryDate,
          notes: dto.notes,
          items: {
            create: itemsToCreate,
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
          partyId,
          userId,
          origin: ChannelSource.WEB,
          status: initialStatus,
          priority: dto.priority || 2,
          deliveryDate,
          totalAmount: dto.totalAmount,
          paymentStatus: initialPaymentStatus,
          stages: {
            create: [
              { stepOrder: 1, name: 'Pré-impressão', status: initialStageStatus },
              { stepOrder: 2, name: 'Impressão', status: initialStageStatus },
              { stepOrder: 3, name: 'Acabamento', status: initialStageStatus },
              { stepOrder: 4, name: 'Controle de Qualidade', status: initialStageStatus },
              { stepOrder: 5, name: 'Expedição / Retirada', status: initialStageStatus },
            ],
          },
        },
        include: {
          stages: { orderBy: { stepOrder: 'asc' } },
          party: { select: { id: true, name: true, phone: true } },
        },
      });

      // Baixa imediata de estoque para serviços de produção rápida
      if (hasItems) {
        for (const it of dto.items!) {
          if (it.rawMaterialId) {
            const consumePerUnit = it.materialQuantity ?? 1;
            const totalToConsume = Math.ceil(it.quantity * consumePerUnit);
            if (totalToConsume > 0) {
              await tx.stockMovement.create({
                data: {
                  rawMaterialId: it.rawMaterialId,
                  workOrderId: workOrder.id,
                  quantity: -totalToConsume,
                  reason: 'CONSUMO_PRODUCAO',
                },
              });

              await tx.rawMaterial.update({
                where: { id: it.rawMaterialId },
                data: {
                  currentStock: {
                    decrement: totalToConsume,
                  },
                },
              });

              this.logger.log(
                `📦 [Produção Rápida] Estoque baixado: ${totalToConsume} unidades de ${it.rawMaterialId} para OS ${workOrder.orderNumber}`
              );
            }
          }
        }
      }

      if (initialPaymentStatus === PaymentStatus.PAID && dto.totalAmount > 0) {
        await tx.receivable.create({
          data: {
            workOrderId: workOrder.id,
            partyId,
            description: `Venda Rápida / Balcão - ${orderNumber}`,
            installmentNumber: 1,
            totalInstallments: 1,
            amount: dto.totalAmount,
            dueDate: new Date(),
            paidAt: new Date(),
            status: PaymentStatus.PAID,
            paymentMethod: (dto.paymentMethod as any) || PaymentMethod.CASH,
          },
        });
      }

      return workOrder;
    });

    this.eventsGateway.emitWorkOrderStatusChanged({
      workOrderId: result.id,
      orderNumber: result.orderNumber,
      previousStatus: initialStatus,
      newStatus: initialStatus,
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

