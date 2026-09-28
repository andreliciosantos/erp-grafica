import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { QuickServicePresetsService } from '../src/quick-service-presets/quick-service-presets.service';
import { createMockPrismaService } from './mocks/prisma.mock';

describe('QuickServicePresetsService', () => {
  let service: QuickServicePresetsService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prismaMock = createMockPrismaService();
    service = new QuickServicePresetsService(prismaMock as any);
  });

  it('deve inicializar e garantir os modelos padrão de serviços rápidos (ensureDefaults)', async () => {
    await service.ensureDefaults();
    const all = await service.findAll(false);
    expect(all.length).toBeGreaterThanOrEqual(7);
    expect(all.some((p) => p.name.includes('Xerox P&B A4'))).toBe(true);
    expect(all.some((p) => p.name.includes('Plastificação'))).toBe(true);
  });

  it('deve cadastrar um novo modelo de serviço rápido com material e consumo vinculado', async () => {
    const created = await service.create({
      name: 'Banner Lona 440g 1x1m',
      category: 'Comunicação Visual',
      defaultPrice: 65.0,
      rawMaterialId: 'rm-couche-1',
      materialConsumeQty: 1,
      isActive: true,
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Banner Lona 440g 1x1m');
    expect(created.defaultPrice).toBe(65.0);
    expect(created.rawMaterialId).toBe('rm-couche-1');
    expect(created.materialConsumeQty).toBe(1);
  });

  it('deve atualizar e excluir um modelo de serviço rápido', async () => {
    const item = await service.create({
      name: 'Modelo para Teste de Exclusão',
      defaultPrice: 10.0,
      category: 'Outros',
    });

    const updated = await service.update(item.id, {
      name: 'Modelo Atualizado',
      defaultPrice: 15.0,
    });
    expect(updated.name).toBe('Modelo Atualizado');
    expect(updated.defaultPrice).toBe(15.0);

    await service.remove(item.id);
    await expect(service.findOne(item.id)).rejects.toThrow(NotFoundException);
  });
});
