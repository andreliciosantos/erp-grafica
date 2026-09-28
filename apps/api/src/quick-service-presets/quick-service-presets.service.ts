import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuickServicePresetDto } from './dto/create-quick-service-preset.dto';
import { UpdateQuickServicePresetDto } from './dto/update-quick-service-preset.dto';

export const DEFAULT_QUICK_PRESETS = [
  {
    name: 'Xerox P&B A4',
    category: 'Xerox',
    defaultPrice: 0.5,
    materialConsumeQty: 1,
    materialSearch: 'Sulfite 75g',
  },
  {
    name: 'Xerox Colorida A4',
    category: 'Xerox',
    defaultPrice: 2.0,
    materialConsumeQty: 1,
    materialSearch: 'Sulfite 75g',
  },
  {
    name: 'Impressão A4 Sulfite 75g',
    category: 'Impressão',
    defaultPrice: 1.0,
    materialConsumeQty: 1,
    materialSearch: 'Sulfite 75g',
  },
  {
    name: 'Impressão A3 Couchê 170g',
    category: 'Impressão',
    defaultPrice: 5.0,
    materialConsumeQty: 1,
    materialSearch: 'Couchê 170g',
  },
  {
    name: 'Plastificação Polaseal A4',
    category: 'Acabamento',
    defaultPrice: 6.0,
    materialConsumeQty: 1,
  },
  {
    name: 'Plastificação Polaseal Crachá/RG',
    category: 'Acabamento',
    defaultPrice: 4.0,
    materialConsumeQty: 1,
  },
  {
    name: 'Encadernação Espiral até 50 fls',
    category: 'Acabamento',
    defaultPrice: 8.0,
    materialConsumeQty: 1,
  },
  {
    name: 'Digitalização / Scanner por página',
    category: 'Foto & Scan',
    defaultPrice: 1.0,
    materialConsumeQty: 0,
  },
];

@Injectable()
export class QuickServicePresetsService implements OnModuleInit {
  private readonly logger = new Logger(QuickServicePresetsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureDefaults();
  }

  async ensureDefaults() {
    try {
      const count = await this.prisma.quickServicePreset.count();
      if (count === 0) {
        // Tenta encontrar materiais de referência existentes
        const rawMaterials = await this.prisma.rawMaterial.findMany({
          select: { id: true, name: true },
        });

        for (const item of DEFAULT_QUICK_PRESETS) {
          let matchedMaterialId: string | null = null;
          if (item.materialSearch) {
            const found = rawMaterials.find((m) =>
              m.name.toLowerCase().includes(item.materialSearch.toLowerCase())
            );
            if (found) {
              matchedMaterialId = found.id;
            }
          }

          await this.prisma.quickServicePreset.create({
            data: {
              name: item.name,
              category: item.category,
              defaultPrice: item.defaultPrice,
              rawMaterialId: matchedMaterialId,
              materialConsumeQty: item.materialConsumeQty,
              isActive: true,
            },
          });
        }
        this.logger.log('Modelos padrão de serviços rápidos inicializados com sucesso.');
      }
    } catch (error) {
      this.logger.warn('Não foi possível verificar ou popular modelos de serviços rápidos padrão: ' + (error as Error).message);
    }
  }

  async findAll(activeOnly = true) {
    await this.ensureDefaults();
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.quickServicePreset.findMany({
      where,
      include: {
        rawMaterial: {
          select: {
            id: true,
            name: true,
            unitOfMeasure: true,
            currentStock: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const preset = await this.prisma.quickServicePreset.findUnique({
      where: { id },
      include: {
        rawMaterial: {
          select: {
            id: true,
            name: true,
            unitOfMeasure: true,
            currentStock: true,
          },
        },
      },
    });

    if (!preset) {
      throw new NotFoundException(`Modelo de serviço rápido com ID ${id} não encontrado.`);
    }

    return preset;
  }

  async create(dto: CreateQuickServicePresetDto) {
    return this.prisma.quickServicePreset.create({
      data: {
        name: dto.name.trim(),
        category: dto.category?.trim() || 'Outros',
        defaultPrice: dto.defaultPrice,
        rawMaterialId: dto.rawMaterialId || null,
        materialConsumeQty: dto.materialConsumeQty ?? 1,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        rawMaterial: {
          select: {
            id: true,
            name: true,
            unitOfMeasure: true,
            currentStock: true,
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateQuickServicePresetDto) {
    await this.findOne(id);

    return this.prisma.quickServicePreset.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.category !== undefined ? { category: dto.category.trim() } : {}),
        ...(dto.defaultPrice !== undefined ? { defaultPrice: dto.defaultPrice } : {}),
        ...(dto.rawMaterialId !== undefined ? { rawMaterialId: dto.rawMaterialId || null } : {}),
        ...(dto.materialConsumeQty !== undefined ? { materialConsumeQty: dto.materialConsumeQty } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        rawMaterial: {
          select: {
            id: true,
            name: true,
            unitOfMeasure: true,
            currentStock: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.quickServicePreset.delete({
      where: { id },
    });
  }
}
