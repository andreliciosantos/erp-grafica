import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PaymentConditionsService } from '../src/payment-conditions/payment-conditions.service';
import { createMockPrismaService } from './mocks/prisma.mock';

describe('PaymentConditionsService', () => {
  let service: PaymentConditionsService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaMock = createMockPrismaService();
    service = new PaymentConditionsService(prismaMock as any);
  });

  it('deve inicializar e garantir as condições de pagamento padrão (ensureDefaults)', async () => {
    await service.ensureDefaults();
    const all = await service.findAll(false);
    expect(all.length).toBeGreaterThanOrEqual(5);
    expect(all.some((c) => c.name.includes('À Vista'))).toBe(true);
    expect(all.some((c) => c.name.includes('3x Sem Juros'))).toBe(true);
  });

  it('deve cadastrar uma nova condição de pagamento personalizada', async () => {
    const created = await service.create({
      name: 'Entrada 40% + 3x (30/60/90d)',
      description: '40% no sinal e restante em 3 vezes',
      installmentsCount: 4,
      downPaymentPercent: 40,
      intervalDays: 30,
      isDefault: false,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Entrada 40% + 3x (30/60/90d)');
    expect(created.installmentsCount).toBe(4);
    expect(created.downPaymentPercent).toBe(40);
  });

  it('deve alternar a condição padrão desmarcando a anterior quando isDefault = true', async () => {
    const cond1 = await service.create({
      name: 'Padrão 1',
      installmentsCount: 1,
      isDefault: true,
    });

    const cond2 = await service.create({
      name: 'Padrão 2',
      installmentsCount: 2,
      isDefault: true,
    });

    expect(prismaMock.paymentCondition.updateMany).toHaveBeenCalledWith({
      where: { isDefault: true },
      data: { isDefault: false },
    });
    expect(cond2.isDefault).toBe(true);
  });

  it('deve atualizar e excluir uma condição existente', async () => {
    const item = await service.create({
      name: 'Temporário para Exclusão',
      installmentsCount: 2,
    });

    const updated = await service.update(item.id, {
      name: 'Nome Atualizado',
      intervalDays: 45,
    });
    expect(updated.name).toBe('Nome Atualizado');

    await service.remove(item.id);
    await expect(service.findOne(item.id)).rejects.toThrow(NotFoundException);
  });
});
