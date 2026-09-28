import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  Quote,
  QuoteItem,
  WorkOrder,
  Prisma,
  WorkOrderStatus,
  StageStatus,
  PaymentStatus,
} from '@erp/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import {
  calculateSheetCutting,
  calculateQuotePricing,
  Decimal,
} from '@erp/business-core';
import {
  QuoteStatus,
  ChannelSource,
  WorkOrderStatus as SharedWorkOrderStatus,
} from '@erp/shared-types';
import { EventsGateway } from '../events/events.gateway';

// Padrões industriais e fallbacks de engenharia gráfica
const DEFAULT_FALLBACK_HOURLY_RATE = 100;
const DEFAULT_FALLBACK_SETUP_MINUTES = 15;
const DEFAULT_FALLBACK_SPEED_PER_HOUR = 3000;
const DEFAULT_PARENT_SHEET_WIDTH_MM = 660;
const DEFAULT_PARENT_SHEET_HEIGHT_MM = 960;
const DEFAULT_COST_PER_SHEET = 0.85;
const DEFAULT_BLEED_MM = 3;
const DEFAULT_GRIPPER_MARGIN_MM = 10;
const DEFAULT_WASTE_RATE = 0.10;
const DEFAULT_FINISHING_UNIT_COST = 0.05;
const DEFAULT_VALID_DAYS = 10;

export type QuoteWithDetails = Quote & {
  items: (QuoteItem & {
    rawMaterial?: {
      id: string;
      name: string;
      costPerUnit: Prisma.Decimal | number;
    } | null;
  })[];
  party?: { id: string; name: string; document: string; phone: string; email?: string | null } | null;
  workOrder?: {
    id: string;
    orderNumber: string;
    status: WorkOrderStatus;
    stages?: {
      id: string;
      stepOrder?: number;
      name?: string;
      status: StageStatus;
    }[];
  } | null;
};

export interface PaginatedQuotesResponse {
  data: QuoteWithDetails[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(dto: CreateQuoteDto, userId: string): Promise<QuoteWithDetails> {
    const party = await this.prisma.party.findUnique({
      where: { id: dto.partyId },
    });
    if (!party) {
      throw new NotFoundException(`Cliente com ID ${dto.partyId} não encontrado.`);
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('O orçamento deve conter pelo menos 1 item.');
    }

    const machine =
      (await this.prisma.machine.findFirst({ where: { isActive: true } })) || {
        hourlyRate: new Decimal(DEFAULT_FALLBACK_HOURLY_RATE),
        setupMinutes: DEFAULT_FALLBACK_SETUP_MINUTES,
        maxSheetsHour: DEFAULT_FALLBACK_SPEED_PER_HOUR,
      };

    let totalQuoteCost = new Decimal(0);
    let totalQuoteAmount = new Decimal(0);

    const calculatedItems: Prisma.QuoteItemCreateWithoutQuoteInput[] = [];

    for (const itemDto of dto.items) {
      let rawMaterial = null;
      if (itemDto.rawMaterialId) {
        rawMaterial = await this.prisma.rawMaterial.findUnique({
          where: { id: itemDto.rawMaterialId },
        });
      }

      const parentWidth = rawMaterial?.sheetWidthMm || DEFAULT_PARENT_SHEET_WIDTH_MM;
      const parentHeight = rawMaterial?.sheetHeightMm || DEFAULT_PARENT_SHEET_HEIGHT_MM;
      const costPerSheet = rawMaterial?.costPerUnit
        ? new Decimal(rawMaterial.costPerUnit)
        : new Decimal(DEFAULT_COST_PER_SHEET);

      const cuttingResult = calculateSheetCutting({
        parentSheetWidthMm: parentWidth,
        parentSheetHeightMm: parentHeight,
        itemWidthMm: itemDto.widthMm,
        itemHeightMm: itemDto.heightMm,
        runQuantity: itemDto.quantity,
        bleedMm: DEFAULT_BLEED_MM,
        gripperMarginMm: DEFAULT_GRIPPER_MARGIN_MM,
        wasteRate: DEFAULT_WASTE_RATE,
      });

      const finishingOptionsCount = itemDto.finishingOptions?.length || 0;
      const finishingCostTotal = new Decimal(finishingOptionsCount * DEFAULT_FINISHING_UNIT_COST * itemDto.quantity);

      const pricingResult = calculateQuotePricing({
        sheetsRequired: cuttingResult.sheetsRequired,
        costPerSheet,
        machineHourlyRate: new Decimal(machine.hourlyRate),
        machineSetupMinutes: machine.setupMinutes,
        machineMaxSheetsHour: machine.maxSheetsHour || DEFAULT_FALLBACK_SPEED_PER_HOUR,
        finishingCostTotal,
        markupApplied: dto.markupApplied,
        itemQuantity: itemDto.quantity,
      });

      totalQuoteCost = totalQuoteCost.add(pricingResult.totalCost);
      totalQuoteAmount = totalQuoteAmount.add(pricingResult.totalAmount);

      calculatedItems.push({
        rawMaterial: rawMaterial?.id ? { connect: { id: rawMaterial.id } } : undefined,
        productName: itemDto.productName,
        quantity: itemDto.quantity,
        widthMm: itemDto.widthMm,
        heightMm: itemDto.heightMm,
        colorsFront: itemDto.colorsFront,
        colorsBack: itemDto.colorsBack,
        finishingOptions: itemDto.finishingOptions || [],
        sheetsRequired: cuttingResult.sheetsRequired,
        itemsPerSheet: cuttingResult.itemsPerSheet,
        paperCostCalculated: pricingResult.paperCost,
        finishingCostTotal: pricingResult.finishingCost,
        machineCostTotal: pricingResult.machineCost,
        unitPrice: pricingResult.unitPrice,
        itemTotalAmount: pricingResult.totalAmount,
      });
    }

    const validDays = dto.validDays || DEFAULT_VALID_DAYS;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const shouldAutoApprove = dto.autoApprove !== false;
    const initialStatus = shouldAutoApprove ? QuoteStatus.APPROVED : QuoteStatus.DRAFT;

    const result = await this.prisma.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          partyId: dto.partyId,
          userId,
          status: initialStatus,
          origin: (dto.origin as ChannelSource) || ChannelSource.WEB,
          totalCost: totalQuoteCost,
          markupApplied: new Decimal(dto.markupApplied),
          totalAmount: totalQuoteAmount,
          validUntil,
          notes: dto.notes,
          items: {
            create: calculatedItems,
          },
        },
        include: {
          items: true,
          party: { select: { id: true, name: true, document: true, phone: true } },
        },
      });

      let workOrder = null;
      if (shouldAutoApprove) {
        const currentYear = new Date().getFullYear();
        const orderNumber = `OS-${currentYear}-${String(quote.code).padStart(5, '0')}`;
        const barcode = `OS${currentYear}${String(quote.code).padStart(5, '0')}`;

        workOrder = await tx.workOrder.create({
          data: {
            orderNumber,
            barcode,
            quoteId: quote.id,
            partyId: quote.partyId,
            userId,
            origin: quote.origin,
            status: WorkOrderStatus.PENDING,
            priority: 2,
            deliveryDate: quote.validUntil,
            totalAmount: quote.totalAmount,
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

        if (dto.installments && dto.installments.length > 0) {
          for (const inst of dto.installments) {
            await tx.receivable.create({
              data: {
                workOrderId: workOrder.id,
                partyId: quote.partyId,
                description:
                  inst.description ||
                  `Parcela ${inst.installmentNumber}/${inst.totalInstallments} - ${workOrder.orderNumber}`,
                installmentNumber: inst.installmentNumber,
                totalInstallments: inst.totalInstallments,
                amount: new Decimal(inst.amount),
                dueDate: new Date(inst.dueDate),
                status: PaymentStatus.PENDING,
              },
            });
          }
        }
      }

      return {
        ...quote,
        workOrder,
      };
    });

    if (shouldAutoApprove && result.workOrder) {
      this.eventsGateway.emitWorkOrderStatusChanged({
        workOrderId: result.workOrder.id,
        orderNumber: result.workOrder.orderNumber,
        previousStatus: SharedWorkOrderStatus.PENDING,
        newStatus: SharedWorkOrderStatus.PENDING,
        updatedAt: new Date().toISOString(),
      });
    }

    return result as QuoteWithDetails;
  }

  async findAll(page = 1, limit = 20, status?: QuoteStatus): Promise<PaginatedQuotesResponse> {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [total, data] = await Promise.all([
      this.prisma.quote.count({ where }),
      this.prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          party: { select: { id: true, name: true, document: true, phone: true } },
          items: true,
          workOrder: { select: { id: true, orderNumber: true, status: true } },
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

  async findOne(id: string): Promise<QuoteWithDetails> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        party: true,
        items: {
          include: {
            rawMaterial: true,
          },
        },
        workOrder: {
          include: {
            stages: true,
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Orçamento com ID ${id} não encontrado.`);
    }

    return quote;
  }

  async approve(id: string, userId: string): Promise<WorkOrder> {
    const quote = await this.findOne(id);

    if (quote.status === QuoteStatus.APPROVED) {
      throw new BadRequestException('Este orçamento já está aprovado.');
    }

    if (quote.status === QuoteStatus.REJECTED || quote.status === QuoteStatus.EXPIRED) {
      throw new BadRequestException(`Orçamento com status '${quote.status}' não pode ser aprovado.`);
    }

    const currentYear = new Date().getFullYear();
    const orderNumber = `OS-${currentYear}-${String(quote.code).padStart(5, '0')}`;
    const barcode = `OS${currentYear}${String(quote.code).padStart(5, '0')}`;

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id },
        data: { status: QuoteStatus.APPROVED },
      });

      const workOrder = await tx.workOrder.create({
        data: {
          orderNumber,
          barcode,
          quoteId: quote.id,
          partyId: quote.partyId,
          userId,
          origin: quote.origin,
          status: WorkOrderStatus.PENDING,
          priority: 2,
          deliveryDate: quote.validUntil,
          totalAmount: quote.totalAmount,
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
      previousStatus: SharedWorkOrderStatus.PENDING,
      newStatus: SharedWorkOrderStatus.PENDING,
      updatedAt: new Date().toISOString(),
    });

    return result;
  }

  async remove(id: string): Promise<Quote> {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        workOrder: {
          include: {
            stages: true,
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException(`Orçamento com ID ${id} não encontrado.`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (quote.workOrder) {
        const stageIds = quote.workOrder.stages.map((s) => s.id);
        if (stageIds.length > 0) {
          await tx.stageExecutionLog.deleteMany({
            where: { stageId: { in: stageIds } },
          });
        }
        await tx.workOrderStage.deleteMany({
          where: { workOrderId: quote.workOrder.id },
        });
        await tx.stockMovement.deleteMany({
          where: { workOrderId: quote.workOrder.id },
        });
        await tx.workOrder.delete({
          where: { id: quote.workOrder.id },
        });
      }

      await tx.quoteItem.deleteMany({
        where: { quoteId: id },
      });

      return tx.quote.delete({
        where: { id },
      });
    });
  }
}

