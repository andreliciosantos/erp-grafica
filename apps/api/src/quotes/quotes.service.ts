import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Quote, QuoteItem, WorkOrder } from '@erp/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import {
  calculateSheetCutting,
  calculateQuotePricing,
  Decimal,
} from '@erp/business-core';
import {
  QuoteStatus,
  WorkOrderStatus,
  StageStatus,
  PaymentStatus,
  ChannelSource,
} from '@erp/shared-types';
import { EventsGateway } from '../events/events.gateway';

export type QuoteWithDetails = Quote & {
  items: QuoteItem[];
  party?: { id: string; name: string; document: string; phone: string };
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
        hourlyRate: new Decimal(100),
        setupMinutes: 15,
        maxSheetsHour: 3000,
      };

    let totalQuoteCost = new Decimal(0);
    let totalQuoteAmount = new Decimal(0);

    const calculatedItems = [];

    for (const itemDto of dto.items) {
      let rawMaterial = null;
      if (itemDto.rawMaterialId) {
        rawMaterial = await this.prisma.rawMaterial.findUnique({
          where: { id: itemDto.rawMaterialId },
        });
      }

      const parentWidth = rawMaterial?.sheetWidthMm || 660;
      const parentHeight = rawMaterial?.sheetHeightMm || 960;
      const costPerSheet = rawMaterial?.costPerUnit ? new Decimal(rawMaterial.costPerUnit) : new Decimal(0.85);

      const cuttingResult = calculateSheetCutting({
        parentSheetWidthMm: parentWidth,
        parentSheetHeightMm: parentHeight,
        itemWidthMm: itemDto.widthMm,
        itemHeightMm: itemDto.heightMm,
        runQuantity: itemDto.quantity,
        bleedMm: 3,
        gripperMarginMm: 10,
        wasteRate: 0.10,
      });

      const finishingOptionsCount = itemDto.finishingOptions?.length || 0;
      const finishingCostTotal = new Decimal(finishingOptionsCount * 0.05 * itemDto.quantity);

      const pricingResult = calculateQuotePricing({
        sheetsRequired: cuttingResult.sheetsRequired,
        costPerSheet,
        machineHourlyRate: new Decimal(machine.hourlyRate),
        machineSetupMinutes: machine.setupMinutes,
        machineMaxSheetsHour: machine.maxSheetsHour || 3000,
        finishingCostTotal,
        markupApplied: dto.markupApplied,
        itemQuantity: itemDto.quantity,
      });

      totalQuoteCost = totalQuoteCost.add(pricingResult.totalCost);
      totalQuoteAmount = totalQuoteAmount.add(pricingResult.totalAmount);

      calculatedItems.push({
        rawMaterialId: rawMaterial?.id || null,
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

    const validDays = dto.validDays || 10;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    return this.prisma.quote.create({
      data: {
        partyId: dto.partyId,
        userId,
        status: QuoteStatus.DRAFT,
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
      previousStatus: WorkOrderStatus.PENDING,
      newStatus: WorkOrderStatus.PENDING,
      updatedAt: new Date().toISOString(),
    });

    return result;
  }
}
