import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentConditionDto } from './dto/create-payment-condition.dto';
import { UpdatePaymentConditionDto } from './dto/update-payment-condition.dto';

export const DEFAULT_PAYMENT_CONDITIONS = [
  {
    name: 'À Vista (100% no Pedido)',
    description: 'Pagamento integral de 100% no ato do pedido via PIX, dinheiro ou cartão.',
    installmentsCount: 1,
    downPaymentPercent: 100,
    intervalDays: 0,
    dayOffsets: [0],
    isDefault: true,
  },
  {
    name: 'Sinal 50% + 50% na Retirada / 30d',
    description: 'Sinal de 50% no pedido e o saldo de 50% na entrega ou em 30 dias.',
    installmentsCount: 2,
    downPaymentPercent: 50,
    intervalDays: 30,
    dayOffsets: [0, 30],
    isDefault: false,
  },
  {
    name: '3x Sem Juros (30 / 60 / 90 dias)',
    description: 'Parcelamento em 3 vezes iguais sem juros a cada 30 dias.',
    installmentsCount: 3,
    downPaymentPercent: 0,
    intervalDays: 30,
    dayOffsets: [30, 60, 90],
    isDefault: false,
  },
  {
    name: 'Entrada 30% + 2x (30 / 60 dias)',
    description: 'Entrada inicial de 30% e 2 parcelas de 35% aos 30 e 60 dias.',
    installmentsCount: 3,
    downPaymentPercent: 30,
    intervalDays: 30,
    dayOffsets: [0, 30, 60],
    isDefault: false,
  },
  {
    name: 'Boleto Faturado 28 dias (1x)',
    description: 'Faturamento para clientes pessoa jurídica com vencimento para 28 dias.',
    installmentsCount: 1,
    downPaymentPercent: 0,
    intervalDays: 28,
    dayOffsets: [28],
    isDefault: false,
  },
];

@Injectable()
export class PaymentConditionsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureDefaults();
  }

  async ensureDefaults() {
    try {
      const count = await this.prisma.paymentCondition.count();
      if (count === 0) {
        for (const item of DEFAULT_PAYMENT_CONDITIONS) {
          await this.prisma.paymentCondition.create({
            data: {
              name: item.name,
              description: item.description,
              installmentsCount: item.installmentsCount,
              downPaymentPercent: item.downPaymentPercent,
              intervalDays: item.intervalDays,
              dayOffsets: item.dayOffsets,
              isDefault: item.isDefault,
              isActive: true,
            },
          });
        }
      }
    } catch {
      // Ignora erro em ambientes de teste sem migração aplicada
    }
  }

  async findAll(activeOnly = true) {
    await this.ensureDefaults();
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.paymentCondition.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { installmentsCount: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const condition = await this.prisma.paymentCondition.findUnique({
      where: { id },
    });
    if (!condition) {
      throw new NotFoundException(`Condição de pagamento com ID ${id} não encontrada.`);
    }
    return condition;
  }

  async create(dto: CreatePaymentConditionDto) {
    if (dto.isDefault) {
      await this.prisma.paymentCondition.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.paymentCondition.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        installmentsCount: dto.installmentsCount,
        downPaymentPercent: dto.downPaymentPercent || 0,
        intervalDays: dto.intervalDays || 30,
        dayOffsets: dto.dayOffsets || [],
        isDefault: dto.isDefault || false,
        isActive: true,
      },
    });
  }

  async update(id: string, dto: UpdatePaymentConditionDto) {
    await this.findOne(id);

    if (dto.isDefault) {
      await this.prisma.paymentCondition.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.paymentCondition.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
        ...(dto.installmentsCount !== undefined ? { installmentsCount: dto.installmentsCount } : {}),
        ...(dto.downPaymentPercent !== undefined ? { downPaymentPercent: dto.downPaymentPercent } : {}),
        ...(dto.intervalDays !== undefined ? { intervalDays: dto.intervalDays } : {}),
        ...(dto.dayOffsets !== undefined ? { dayOffsets: dto.dayOffsets } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.paymentCondition.delete({
      where: { id },
    });
  }
}
