import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExpenseCategory,
  ExpenseType,
  PaymentStatus,
  PaymentMethod,
  OperatingExpenseItem,
  OperatingExpensesSummaryDto,
} from '@erp/shared-types';
import { CreateOperatingExpenseDto } from './dto/create-operating-expense.dto';
import { UpdateOperatingExpenseDto } from './dto/update-operating-expense.dto';
import { PayExpenseDto } from './dto/pay-expense.dto';
import { Prisma } from '@erp/database';

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RENT_FACILITIES: 'Aluguel & Estrutura',
  UTILITIES: 'Utilidades & Energia',
  SOFTWARE_LICENSES: 'Softwares & Licenças',
  OFFICE_ADMINISTRATIVE: 'Administrativo & Contábil',
  COMMERCIAL_MARKETING: 'Comercial & Marketing',
  MAINTENANCE_PREDIAL: 'Manutenção Predial',
  FINANCIAL_TAXES: 'Tributos & Taxas',
  OTHER: 'Outras Despesas',
};

export interface PaginatedExpensesResponse {
  data: OperatingExpenseItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class OperatingExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToItem(expense: any): OperatingExpenseItem {
    return {
      id: expense.id,
      description: expense.description,
      category: expense.category as ExpenseCategory,
      expenseType: expense.expenseType as ExpenseType,
      amount: Number(expense.amount),
      dueDate: expense.dueDate.toISOString(),
      paidAt: expense.paidAt ? expense.paidAt.toISOString() : null,
      status: expense.status as PaymentStatus,
      paymentMethod: expense.paymentMethod ? (expense.paymentMethod as PaymentMethod) : null,
      competenceDate: expense.competenceDate.toISOString(),
      supplierId: expense.supplierId,
      beneficiaryName: expense.beneficiaryName,
      barcode: expense.barcode,
      documentNumber: expense.documentNumber,
      isRecurring: expense.isRecurring,
      recurrenceInterval: expense.recurrenceInterval,
      recurrenceEndDate: expense.recurrenceEndDate ? expense.recurrenceEndDate.toISOString() : null,
      notes: expense.notes,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
      supplier: expense.supplier
        ? {
            id: expense.supplier.id,
            name: expense.supplier.name,
            tradeName: expense.supplier.tradeName,
            document: expense.supplier.document,
          }
        : null,
    };
  }

  async create(dto: CreateOperatingExpenseDto): Promise<OperatingExpenseItem> {
    if (dto.supplierId) {
      const supplierExists = await this.prisma.party.findUnique({
        where: { id: dto.supplierId },
      });
      if (!supplierExists) {
        throw new BadRequestException('Fornecedor informado não foi encontrado.');
      }
    }

    const dueDateObj = new Date(dto.dueDate);
    const competenceDateObj = new Date(dto.competenceDate);
    const now = new Date();

    let initialStatus = dto.status || PaymentStatus.PENDING;
    if (dto.paidAt) {
      initialStatus = PaymentStatus.PAID;
    } else if (initialStatus === PaymentStatus.PENDING && dueDateObj < now) {
      initialStatus = PaymentStatus.OVERDUE;
    }

    const created = await this.prisma.operatingExpense.create({
      data: {
        description: dto.description.trim(),
        category: dto.category,
        expenseType: dto.expenseType || ExpenseType.FIXED,
        amount: new Prisma.Decimal(dto.amount),
        dueDate: dueDateObj,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : null,
        status: initialStatus,
        paymentMethod: dto.paymentMethod || null,
        competenceDate: competenceDateObj,
        supplierId: dto.supplierId || null,
        beneficiaryName: dto.beneficiaryName ? dto.beneficiaryName.trim() : null,
        barcode: dto.barcode ? dto.barcode.trim() : null,
        documentNumber: dto.documentNumber ? dto.documentNumber.trim() : null,
        isRecurring: Boolean(dto.isRecurring),
        recurrenceInterval: dto.recurrenceInterval || (dto.isRecurring ? 'MONTHLY' : null),
        recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null,
        notes: dto.notes ? dto.notes.trim() : null,
      },
      include: {
        supplier: {
          select: { id: true, name: true, tradeName: true, document: true },
        },
      },
    });

    return this.mapToItem(created);
  }

  async findAll(
    page = 1,
    limit = 20,
    competenceMonth?: string,
    category?: ExpenseCategory,
    expenseType?: ExpenseType,
    status?: PaymentStatus,
    search?: string,
  ): Promise<PaginatedExpensesResponse> {
    const skip = (page - 1) * limit;
    const where: Prisma.OperatingExpenseWhereInput = {};

    if (competenceMonth && /^\d{4}-\d{2}$/.test(competenceMonth)) {
      const [yearStr, monthStr] = competenceMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      where.competenceDate = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    if (category) {
      where.category = category;
    }

    if (expenseType) {
      where.expenseType = expenseType;
    }

    if (status) {
      where.status = status;
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { beneficiaryName: { contains: q, mode: 'insensitive' } },
        { documentNumber: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
        { supplier: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, expenses] = await Promise.all([
      this.prisma.operatingExpense.count({ where }),
      this.prisma.operatingExpense.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          supplier: {
            select: { id: true, name: true, tradeName: true, document: true },
          },
        },
      }),
    ]);

    return {
      data: expenses.map((e) => this.mapToItem(e)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getSummary(competenceMonth?: string): Promise<OperatingExpensesSummaryDto> {
    const where: Prisma.OperatingExpenseWhereInput = {};

    if (competenceMonth && /^\d{4}-\d{2}$/.test(competenceMonth)) {
      const [yearStr, monthStr] = competenceMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      where.competenceDate = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    const expenses = await this.prisma.operatingExpense.findMany({
      where,
      select: {
        id: true,
        amount: true,
        status: true,
        category: true,
        expenseType: true,
        dueDate: true,
      },
    });

    const now = new Date();
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    let totalCount = expenses.length;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    let fixedTotal = 0;
    let variableTotal = 0;

    const categoryMap = new Map<ExpenseCategory, { total: number; count: number }>();
    Object.values(ExpenseCategory).forEach((cat) => {
      categoryMap.set(cat, { total: 0, count: 0 });
    });

    for (const exp of expenses) {
      const val = Number(exp.amount) || 0;
      totalAmount += val;

      if (exp.expenseType === ExpenseType.FIXED) {
        fixedTotal += val;
      } else {
        variableTotal += val;
      }

      const catGroup = categoryMap.get(exp.category as ExpenseCategory);
      if (catGroup) {
        catGroup.total += val;
        catGroup.count += 1;
      }

      if (exp.status === PaymentStatus.PAID) {
        paidAmount += val;
        paidCount += 1;
      } else if (exp.status === PaymentStatus.CANCELLED) {
        // Ignora em aberto
      } else {
        // PENDING ou OVERDUE
        const isOverdue = exp.status === PaymentStatus.OVERDUE || exp.dueDate < now;
        if (isOverdue) {
          overdueAmount += val;
          overdueCount += 1;
        } else {
          pendingAmount += val;
          pendingCount += 1;
        }
      }
    }

    const categoryBreakdown = Object.values(ExpenseCategory)
      .map((cat) => {
        const item = categoryMap.get(cat) || { total: 0, count: 0 };
        return {
          category: cat,
          label: CATEGORY_LABELS[cat] || cat,
          total: Number(item.total.toFixed(2)),
          count: item.count,
          percentage: totalAmount > 0 ? Number(((item.total / totalAmount) * 100).toFixed(1)) : 0,
        };
      })
      .filter((c) => c.count > 0 || totalAmount === 0);

    return {
      totalAmount: Number(totalAmount.toFixed(2)),
      paidAmount: Number(paidAmount.toFixed(2)),
      pendingAmount: Number(pendingAmount.toFixed(2)),
      overdueAmount: Number(overdueAmount.toFixed(2)),
      totalCount,
      paidCount,
      pendingCount,
      overdueCount,
      fixedTotal: Number(fixedTotal.toFixed(2)),
      variableTotal: Number(variableTotal.toFixed(2)),
      categoryBreakdown,
    };
  }

  async findOne(id: string): Promise<OperatingExpenseItem> {
    const expense = await this.prisma.operatingExpense.findUnique({
      where: { id },
      include: {
        supplier: {
          select: { id: true, name: true, tradeName: true, document: true },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException(`Despesa com ID ${id} não foi encontrada.`);
    }

    return this.mapToItem(expense);
  }

  async update(id: string, dto: UpdateOperatingExpenseDto): Promise<OperatingExpenseItem> {
    await this.findOne(id);

    if (dto.supplierId) {
      const supplierExists = await this.prisma.party.findUnique({
        where: { id: dto.supplierId },
      });
      if (!supplierExists) {
        throw new BadRequestException('Fornecedor informado não foi encontrado.');
      }
    }

    const data: Prisma.OperatingExpenseUpdateInput = {};

    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.expenseType !== undefined) data.expenseType = dto.expenseType;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.competenceDate !== undefined) data.competenceDate = new Date(dto.competenceDate);
    if (dto.supplierId !== undefined) data.supplier = dto.supplierId ? { connect: { id: dto.supplierId } } : { disconnect: true };
    if (dto.beneficiaryName !== undefined) data.beneficiaryName = dto.beneficiaryName ? dto.beneficiaryName.trim() : null;
    if (dto.barcode !== undefined) data.barcode = dto.barcode ? dto.barcode.trim() : null;
    if (dto.documentNumber !== undefined) data.documentNumber = dto.documentNumber ? dto.documentNumber.trim() : null;
    if (dto.isRecurring !== undefined) data.isRecurring = dto.isRecurring;
    if (dto.recurrenceInterval !== undefined) data.recurrenceInterval = dto.recurrenceInterval;
    if (dto.recurrenceEndDate !== undefined) data.recurrenceEndDate = dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null;
    if (dto.notes !== undefined) data.notes = dto.notes ? dto.notes.trim() : null;
    if (dto.paymentMethod !== undefined) data.paymentMethod = dto.paymentMethod;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.paidAt !== undefined) data.paidAt = dto.paidAt ? new Date(dto.paidAt) : null;

    const updated = await this.prisma.operatingExpense.update({
      where: { id },
      data,
      include: {
        supplier: {
          select: { id: true, name: true, tradeName: true, document: true },
        },
      },
    });

    return this.mapToItem(updated);
  }

  async pay(id: string, dto: PayExpenseDto): Promise<OperatingExpenseItem> {
    const existing = await this.findOne(id);
    const paidAtDate = new Date(dto.paidAt);

    const data: Prisma.OperatingExpenseUpdateInput = {
      status: PaymentStatus.PAID,
      paidAt: paidAtDate,
      paymentMethod: dto.paymentMethod,
    };

    if (dto.paidAmount !== undefined && dto.paidAmount !== existing.amount) {
      data.amount = new Prisma.Decimal(dto.paidAmount);
      const noteAppend = `\n[Valor original: R$ ${existing.amount.toFixed(2)} - Liquidado: R$ ${dto.paidAmount.toFixed(2)}]`;
      data.notes = existing.notes ? `${existing.notes} ${noteAppend}` : noteAppend;
    }

    if (dto.notes) {
      data.notes = existing.notes ? `${existing.notes}\n${dto.notes}` : dto.notes;
    }

    const updated = await this.prisma.operatingExpense.update({
      where: { id },
      data,
      include: {
        supplier: {
          select: { id: true, name: true, tradeName: true, document: true },
        },
      },
    });

    return this.mapToItem(updated);
  }

  async duplicateNextMonth(id: string): Promise<OperatingExpenseItem> {
    const existing = await this.findOne(id);

    const currentDue = new Date(existing.dueDate);
    const nextDue = new Date(currentDue);
    nextDue.setMonth(nextDue.getMonth() + 1);

    const currentComp = new Date(existing.competenceDate);
    const nextComp = new Date(currentComp);
    nextComp.setMonth(nextComp.getMonth() + 1);

    if (existing.recurrenceEndDate) {
      const endLimit = new Date(existing.recurrenceEndDate);
      if (nextDue > endLimit) {
        throw new BadRequestException('A data de vencimento da próxima parcela ultrapassa a data limite da recorrência.');
      }
    }

    const cloned = await this.prisma.operatingExpense.create({
      data: {
        description: existing.description,
        category: existing.category,
        expenseType: existing.expenseType,
        amount: new Prisma.Decimal(existing.amount),
        dueDate: nextDue,
        paidAt: null,
        status: PaymentStatus.PENDING,
        paymentMethod: existing.paymentMethod,
        competenceDate: nextComp,
        supplierId: existing.supplierId,
        beneficiaryName: existing.beneficiaryName,
        barcode: existing.barcode,
        documentNumber: existing.documentNumber,
        isRecurring: existing.isRecurring,
        recurrenceInterval: existing.recurrenceInterval,
        recurrenceEndDate: existing.recurrenceEndDate ? new Date(existing.recurrenceEndDate) : null,
        notes: existing.notes ? `[Recorrência gerada] ${existing.notes}` : '[Recorrência gerada]',
      },
      include: {
        supplier: {
          select: { id: true, name: true, tradeName: true, document: true },
        },
      },
    });

    return this.mapToItem(cloned);
  }

  async remove(id: string): Promise<OperatingExpenseItem> {
    const existing = await this.findOne(id);
    await this.prisma.operatingExpense.delete({ where: { id } });
    return existing;
  }
}
