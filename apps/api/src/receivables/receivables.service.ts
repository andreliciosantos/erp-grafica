import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaymentStatus,
  PaymentMethod,
  WorkOrderStatus,
  ReceivableItem,
  ReceivablesSummaryDto,
} from '@erp/shared-types';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { PayReceivableDto } from './dto/pay-receivable.dto';
import { GenerateOrderInstallmentsDto } from './dto/generate-order-installments.dto';
import { Prisma } from '@erp/database';

export interface PaginatedReceivablesResponse {
  data: ReceivableItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ReceivablesService {
  private readonly logger = new Logger(ReceivablesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapToItem(receivable: any): ReceivableItem {
    return {
      id: receivable.id,
      workOrderId: receivable.workOrderId,
      partyId: receivable.partyId,
      description: receivable.description,
      installmentNumber: receivable.installmentNumber,
      totalInstallments: receivable.totalInstallments,
      amount: Number(receivable.amount),
      dueDate: receivable.dueDate.toISOString(),
      paidAt: receivable.paidAt ? receivable.paidAt.toISOString() : null,
      status: receivable.status as PaymentStatus,
      paymentMethod: receivable.paymentMethod ? (receivable.paymentMethod as PaymentMethod) : null,
      barcode: receivable.barcode,
      documentNumber: receivable.documentNumber,
      notes: receivable.notes,
      createdAt: receivable.createdAt.toISOString(),
      updatedAt: receivable.updatedAt.toISOString(),
      party: receivable.party
        ? {
            id: receivable.party.id,
            name: receivable.party.name,
            tradeName: receivable.party.tradeName,
            document: receivable.party.document,
            phone: receivable.party.phone,
          }
        : undefined,
      workOrder: receivable.workOrder
        ? {
            id: receivable.workOrder.id,
            orderNumber: receivable.workOrder.orderNumber,
            totalAmount: Number(receivable.workOrder.totalAmount),
            status: receivable.workOrder.status as WorkOrderStatus,
          }
        : null,
    };
  }

  async create(dto: CreateReceivableDto): Promise<ReceivableItem> {
    const partyExists = await this.prisma.party.findUnique({
      where: { id: dto.partyId },
    });
    if (!partyExists) {
      throw new BadRequestException('Cliente informado não foi encontrado.');
    }

    if (dto.workOrderId) {
      const orderExists = await this.prisma.workOrder.findUnique({
        where: { id: dto.workOrderId },
      });
      if (!orderExists) {
        throw new BadRequestException('Ordem de serviço informada não foi encontrada.');
      }
    }

    const dueDateObj = new Date(dto.dueDate);
    const now = new Date();

    let initialStatus = dto.status || PaymentStatus.PENDING;
    if (initialStatus === PaymentStatus.PENDING && dueDateObj < now) {
      initialStatus = PaymentStatus.OVERDUE;
    }

    const created = await this.prisma.receivable.create({
      data: {
        partyId: dto.partyId,
        workOrderId: dto.workOrderId || null,
        description: dto.description.trim(),
        installmentNumber: dto.installmentNumber || 1,
        totalInstallments: dto.totalInstallments || 1,
        amount: new Prisma.Decimal(dto.amount),
        dueDate: dueDateObj,
        status: initialStatus,
        paymentMethod: dto.paymentMethod || null,
        barcode: dto.barcode ? dto.barcode.trim() : null,
        documentNumber: dto.documentNumber ? dto.documentNumber.trim() : null,
        notes: dto.notes ? dto.notes.trim() : null,
      },
      include: {
        party: true,
        workOrder: true,
      },
    });

    if (dto.workOrderId) {
      await this.syncWorkOrderPaymentStatus(dto.workOrderId);
    }

    return this.mapToItem(created);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    partyId?: string;
    workOrderId?: string;
    month?: string; // YYYY-MM
    search?: string;
  }): Promise<PaginatedReceivablesResponse> {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ReceivableWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.partyId) {
      where.partyId = params.partyId;
    }

    if (params.workOrderId) {
      where.workOrderId = params.workOrderId;
    }

    if (params.month) {
      const [yearStr, monthStr] = params.month.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      if (!isNaN(year) && !isNaN(month)) {
        const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
        const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        where.dueDate = {
          gte: startOfMonth,
          lte: endOfMonth,
        };
      }
    }

    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { description: { contains: term, mode: 'insensitive' } },
        { documentNumber: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
        { party: { name: { contains: term, mode: 'insensitive' } } },
        { party: { document: { contains: term, mode: 'insensitive' } } },
        { workOrder: { orderNumber: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.receivable.count({ where }),
      this.prisma.receivable.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          party: true,
          workOrder: true,
        },
      }),
    ]);

    // Dynamic overdue update for items past dueDate
    const now = new Date();
    const updatedRecords = records.map((rec) => {
      if (rec.status === PaymentStatus.PENDING && new Date(rec.dueDate) < now) {
        return { ...rec, status: PaymentStatus.OVERDUE };
      }
      return rec;
    });

    return {
      data: updatedRecords.map((r) => this.mapToItem(r)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ReceivableItem> {
    const item = await this.prisma.receivable.findUnique({
      where: { id },
      include: {
        party: true,
        workOrder: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Recebível com ID ${id} não encontrado.`);
    }

    return this.mapToItem(item);
  }

  async update(id: string, dto: UpdateReceivableDto): Promise<ReceivableItem> {
    await this.findOne(id);

    const updateData: Prisma.ReceivableUpdateInput = {};

    if (dto.partyId) {
      updateData.party = { connect: { id: dto.partyId } };
    }
    if (dto.description !== undefined) updateData.description = dto.description.trim();
    if (dto.installmentNumber !== undefined) updateData.installmentNumber = dto.installmentNumber;
    if (dto.totalInstallments !== undefined) updateData.totalInstallments = dto.totalInstallments;
    if (dto.amount !== undefined) updateData.amount = new Prisma.Decimal(dto.amount);
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.paymentMethod !== undefined) updateData.paymentMethod = dto.paymentMethod;
    if (dto.barcode !== undefined) updateData.barcode = dto.barcode ? dto.barcode.trim() : null;
    if (dto.documentNumber !== undefined) updateData.documentNumber = dto.documentNumber ? dto.documentNumber.trim() : null;
    if (dto.notes !== undefined) updateData.notes = dto.notes ? dto.notes.trim() : null;
    if (dto.paidAt !== undefined) updateData.paidAt = dto.paidAt ? new Date(dto.paidAt) : null;

    const updated = await this.prisma.receivable.update({
      where: { id },
      data: updateData,
      include: {
        party: true,
        workOrder: true,
      },
    });

    if (updated.workOrderId) {
      await this.syncWorkOrderPaymentStatus(updated.workOrderId);
    }

    return this.mapToItem(updated);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const existing = await this.findOne(id);

    await this.prisma.receivable.delete({
      where: { id },
    });

    if (existing.workOrderId) {
      await this.syncWorkOrderPaymentStatus(existing.workOrderId);
    }

    return { success: true, message: 'Recebível removido com sucesso.' };
  }

  async pay(id: string, dto: PayReceivableDto): Promise<ReceivableItem> {
    const existing = await this.findOne(id);

    const paidAtDate = new Date(dto.paidAt);

    const updated = await this.prisma.receivable.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: paidAtDate,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes ? dto.notes.trim() : existing.notes,
      },
      include: {
        party: true,
        workOrder: true,
      },
    });

    if (updated.workOrderId) {
      await this.syncWorkOrderPaymentStatus(updated.workOrderId);
    }

    return this.mapToItem(updated);
  }

  async generateForOrder(dto: GenerateOrderInstallmentsDto): Promise<ReceivableItem[]> {
    const order = await this.prisma.workOrder.findUnique({
      where: { id: dto.workOrderId },
      include: { party: true },
    });

    if (!order) {
      throw new NotFoundException(`Ordem de serviço com ID ${dto.workOrderId} não encontrada.`);
    }

    const totalAmount = Number(order.totalAmount);
    if (totalAmount <= 0) {
      throw new BadRequestException('A ordem de serviço possui valor zerado ou inválido.');
    }

    // Delete existing unpaid receivables for this workOrder to avoid duplicate plans
    await this.prisma.receivable.deleteMany({
      where: {
        workOrderId: order.id,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
      },
    });

    const createdItems: any[] = [];
    const baseDueDate = dto.firstDueDate ? new Date(dto.firstDueDate) : new Date();

    if (dto.plan === 'FULL_ADVANCE') {
      const rec = await this.prisma.receivable.create({
        data: {
          workOrderId: order.id,
          partyId: order.partyId,
          description: `Pagamento Integral (À Vista) - ${order.orderNumber}`,
          installmentNumber: 1,
          totalInstallments: 1,
          amount: new Prisma.Decimal(totalAmount),
          dueDate: baseDueDate,
          status: PaymentStatus.PENDING,
        },
        include: { party: true, workOrder: true },
      });
      createdItems.push(rec);
    } else if (dto.plan === 'HALF_DOWN_HALF_PICKUP') {
      const downPercent = (dto.downPaymentPercent || 50) / 100;
      const downAmount = Number((totalAmount * downPercent).toFixed(2));
      const pickupAmount = Number((totalAmount - downAmount).toFixed(2));

      // 1. Sinal (hoje ou data informada)
      const rec1 = await this.prisma.receivable.create({
        data: {
          workOrderId: order.id,
          partyId: order.partyId,
          description: `Sinal (${Math.round(downPercent * 100)}%) - ${order.orderNumber}`,
          installmentNumber: 1,
          totalInstallments: 2,
          amount: new Prisma.Decimal(downAmount),
          dueDate: baseDueDate,
          status: PaymentStatus.PENDING,
        },
        include: { party: true, workOrder: true },
      });
      createdItems.push(rec1);

      // 2. Saldo na Retirada (data da entrega da OS)
      const pickupDate = order.deliveryDate ? new Date(order.deliveryDate) : new Date(baseDueDate.getTime() + 7 * 86400000);
      const rec2 = await this.prisma.receivable.create({
        data: {
          workOrderId: order.id,
          partyId: order.partyId,
          description: `Saldo na Retirada - ${order.orderNumber}`,
          installmentNumber: 2,
          totalInstallments: 2,
          amount: new Prisma.Decimal(pickupAmount),
          dueDate: pickupDate,
          status: PaymentStatus.PENDING,
        },
        include: { party: true, workOrder: true },
      });
      createdItems.push(rec2);
    } else {
      // CUSTOM_INSTALLMENTS
      const count = Math.max(1, Math.min(12, dto.installmentsCount || 3));
      const intervalDays = dto.intervalDays || 30;
      const installmentVal = Number((totalAmount / count).toFixed(2));
      let remainder = Number((totalAmount - installmentVal * count).toFixed(2));

      for (let i = 1; i <= count; i++) {
        const val = i === 1 ? Number((installmentVal + remainder).toFixed(2)) : installmentVal;
        const currentDueDate = new Date(baseDueDate.getTime() + (i - 1) * intervalDays * 86400000);

        const rec = await this.prisma.receivable.create({
          data: {
            workOrderId: order.id,
            partyId: order.partyId,
            description: `Parcela ${i}/${count} - ${order.orderNumber}`,
            installmentNumber: i,
            totalInstallments: count,
            amount: new Prisma.Decimal(val),
            dueDate: currentDueDate,
            status: PaymentStatus.PENDING,
          },
          include: { party: true, workOrder: true },
        });
        createdItems.push(rec);
      }
    }

    await this.syncWorkOrderPaymentStatus(order.id);

    return createdItems.map((r) => this.mapToItem(r));
  }

  private async syncWorkOrderPaymentStatus(workOrderId: string): Promise<void> {
    const receivables = await this.prisma.receivable.findMany({
      where: { workOrderId },
    });

    if (receivables.length === 0) return;

    const totalCount = receivables.length;
    const paidCount = receivables.filter((r) => r.status === PaymentStatus.PAID).length;
    const now = new Date();
    const hasOverdue = receivables.some(
      (r) => r.status === PaymentStatus.OVERDUE || (r.status === PaymentStatus.PENDING && new Date(r.dueDate) < now)
    );

    let newStatus: PaymentStatus = PaymentStatus.PENDING;
    if (paidCount === totalCount) {
      newStatus = PaymentStatus.PAID;
    } else if (paidCount > 0) {
      newStatus = PaymentStatus.PARTIALLY_PAID;
    } else if (hasOverdue) {
      newStatus = PaymentStatus.OVERDUE;
    }

    await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: { paymentStatus: newStatus },
    });
  }

  async getSummary(month?: string): Promise<ReceivablesSummaryDto> {
    const where: Prisma.ReceivableWhereInput = {};

    if (month) {
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10);
      if (!isNaN(year) && !isNaN(monthNum)) {
        const startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
        const endOfMonth = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));
        where.dueDate = {
          gte: startOfMonth,
          lte: endOfMonth,
        };
      }
    }

    const items = await this.prisma.receivable.findMany({
      where,
    });

    const now = new Date();
    let totalAmount = 0;
    let receivedAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    let totalCount = items.length;
    let receivedCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    items.forEach((item) => {
      const val = Number(item.amount);
      totalAmount += val;

      if (item.status === PaymentStatus.PAID) {
        receivedAmount += val;
        receivedCount++;
      } else if (item.status === PaymentStatus.OVERDUE || (item.status === PaymentStatus.PENDING && new Date(item.dueDate) < now)) {
        overdueAmount += val;
        overdueCount++;
      } else {
        pendingAmount += val;
        pendingCount++;
      }
    });

    const defaultRatePercent = totalAmount > 0
      ? Number(((overdueAmount / totalAmount) * 100).toFixed(2))
      : 0;

    return {
      totalAmount: Number(totalAmount.toFixed(2)),
      receivedAmount: Number(receivedAmount.toFixed(2)),
      pendingAmount: Number(pendingAmount.toFixed(2)),
      overdueAmount: Number(overdueAmount.toFixed(2)),
      totalCount,
      receivedCount,
      pendingCount,
      overdueCount,
      defaultRatePercent,
    };
  }
}
