import {
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductTemplateItem } from '@erp/shared-types';
import { CreateProductTemplateDto } from './dto/create-product-template.dto';
import { UpdateProductTemplateDto } from './dto/update-product-template.dto';
import { Prisma } from '@erp/database';

@Injectable()
export class ProductTemplatesService implements OnModuleInit {
  private readonly logger = new Logger(ProductTemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultsIfEmpty();
  }

  private mapToItem(tpl: any): ProductTemplateItem {
    return {
      id: tpl.id,
      name: tpl.name,
      category: tpl.category,
      description: tpl.description,
      defaultWidthMm: tpl.defaultWidthMm,
      defaultHeightMm: tpl.defaultHeightMm,
      defaultColorsFront: tpl.defaultColorsFront,
      defaultColorsBack: tpl.defaultColorsBack,
      defaultFinishing: Array.isArray(tpl.defaultFinishing) ? tpl.defaultFinishing : [],
      defaultRawMaterialId: tpl.defaultRawMaterialId,
      defaultMachineId: tpl.defaultMachineId,
      defaultMarkupPercent: Number(tpl.defaultMarkupPercent),
      suggestedQuantities: Array.isArray(tpl.suggestedQuantities) ? tpl.suggestedQuantities : [500, 1000, 2000],
      isActive: tpl.isActive,
      createdAt: tpl.createdAt.toISOString(),
      updatedAt: tpl.updatedAt.toISOString(),
      rawMaterial: tpl.rawMaterial
        ? {
            id: tpl.rawMaterial.id,
            name: tpl.rawMaterial.name,
            costPerUnit: Number(tpl.rawMaterial.costPerUnit),
            sheetWidthMm: tpl.rawMaterial.sheetWidthMm,
            sheetHeightMm: tpl.rawMaterial.sheetHeightMm,
          }
        : null,
      machine: tpl.machine
        ? {
            id: tpl.machine.id,
            name: tpl.machine.name,
            hourlyRate: Number(tpl.machine.hourlyRate),
            setupMinutes: tpl.machine.setupMinutes,
            maxSheetsHour: tpl.machine.maxSheetsHour,
          }
        : null,
    };
  }

  async seedDefaultsIfEmpty(): Promise<void> {
    const count = await this.prisma.productTemplate.count();
    if (count > 0) return;

    this.logger.log('🌱 Seeding initial standard product templates...');

    const defaults = [
      {
        name: 'Cartão de Visita 4x4 Couchê 300g',
        category: 'Papelaria',
        description: 'Formato clássico 90x50mm, impressão frente e verso colorida com verniz total.',
        defaultWidthMm: 90,
        defaultHeightMm: 50,
        defaultColorsFront: 4,
        defaultColorsBack: 4,
        defaultFinishing: ['VERNIZ_TOTAL'],
        defaultMarkupPercent: new Prisma.Decimal(40),
        suggestedQuantities: [500, 1000, 2000, 5000],
      },
      {
        name: 'Panfleto A5 Couchê 115g 4x0',
        category: 'Promocional',
        description: 'Formato A5 (148x210mm) ideal para panfletagem e divulgação em massa.',
        defaultWidthMm: 148,
        defaultHeightMm: 210,
        defaultColorsFront: 4,
        defaultColorsBack: 0,
        defaultFinishing: ['REFILE'],
        defaultMarkupPercent: new Prisma.Decimal(35),
        suggestedQuantities: [1000, 2500, 5000, 10000],
      },
      {
        name: 'Folder A4 2 Dobras Couchê 150g',
        category: 'Promocional',
        description: 'Folder institucional A4 aberto (297x210mm) com 2 dobras (6 páginas).',
        defaultWidthMm: 297,
        defaultHeightMm: 210,
        defaultColorsFront: 4,
        defaultColorsBack: 4,
        defaultFinishing: ['DOBRA', 'REFILE'],
        defaultMarkupPercent: new Prisma.Decimal(35),
        suggestedQuantities: [500, 1000, 2500, 5000],
      },
      {
        name: 'Banner Lona 440g c/ Bastão e Cordinha',
        category: 'Comunicação Visual',
        description: 'Banner em lona fosca ou brilho 600x900mm com acabamento em madeira e cordinha.',
        defaultWidthMm: 600,
        defaultHeightMm: 900,
        defaultColorsFront: 4,
        defaultColorsBack: 0,
        defaultFinishing: ['BAINHA', 'BASTAO_CORDINHA'],
        defaultMarkupPercent: new Prisma.Decimal(45),
        suggestedQuantities: [1, 2, 5, 10],
      },
      {
        name: 'Adesivo Vinil Meio-Corte',
        category: 'Adesivos & Rótulos',
        description: 'Adesivo 50x50mm impresso em vinil adesivo brilho com meio-corte eletrônico.',
        defaultWidthMm: 50,
        defaultHeightMm: 50,
        defaultColorsFront: 4,
        defaultColorsBack: 0,
        defaultFinishing: ['MEIO_CORTE'],
        defaultMarkupPercent: new Prisma.Decimal(50),
        suggestedQuantities: [100, 500, 1000, 2500],
      },
      {
        name: 'Pasta com Bolsa Couchê 300g',
        category: 'Papelaria',
        description: 'Pasta institucional 310x220mm com bolsa interna colada e porta-cartão.',
        defaultWidthMm: 310,
        defaultHeightMm: 220,
        defaultColorsFront: 4,
        defaultColorsBack: 0,
        defaultFinishing: ['CORTE_VINCO', 'COLAGEM_BOLSA'],
        defaultMarkupPercent: new Prisma.Decimal(40),
        suggestedQuantities: [250, 500, 1000, 2500],
      },
    ];

    for (const d of defaults) {
      await this.prisma.productTemplate.create({
        data: d,
      });
    }

    this.logger.log('✅ Initial product templates seeded successfully.');
  }

  async findAll(category?: string): Promise<ProductTemplateItem[]> {
    const where: Prisma.ProductTemplateWhereInput = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    const items = await this.prisma.productTemplate.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        rawMaterial: true,
        machine: true,
      },
    });

    return items.map((i) => this.mapToItem(i));
  }

  async findOne(id: string): Promise<ProductTemplateItem> {
    const item = await this.prisma.productTemplate.findUnique({
      where: { id },
      include: {
        rawMaterial: true,
        machine: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Modelo com ID ${id} não encontrado.`);
    }

    return this.mapToItem(item);
  }

  async create(dto: CreateProductTemplateDto): Promise<ProductTemplateItem> {
    const created = await this.prisma.productTemplate.create({
      data: {
        name: dto.name.trim(),
        category: dto.category ? dto.category.trim() : 'Papelaria',
        description: dto.description ? dto.description.trim() : null,
        defaultWidthMm: dto.defaultWidthMm,
        defaultHeightMm: dto.defaultHeightMm,
        defaultColorsFront: dto.defaultColorsFront !== undefined ? dto.defaultColorsFront : 4,
        defaultColorsBack: dto.defaultColorsBack !== undefined ? dto.defaultColorsBack : 4,
        defaultFinishing: dto.defaultFinishing || [],
        defaultRawMaterialId: dto.defaultRawMaterialId || null,
        defaultMachineId: dto.defaultMachineId || null,
        defaultMarkupPercent: new Prisma.Decimal(dto.defaultMarkupPercent || 35),
        suggestedQuantities: dto.suggestedQuantities || [500, 1000, 2000],
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        rawMaterial: true,
        machine: true,
      },
    });

    return this.mapToItem(created);
  }

  async update(id: string, dto: UpdateProductTemplateDto): Promise<ProductTemplateItem> {
    await this.findOne(id);

    const updateData: Prisma.ProductTemplateUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.category !== undefined) updateData.category = dto.category.trim();
    if (dto.description !== undefined) updateData.description = dto.description ? dto.description.trim() : null;
    if (dto.defaultWidthMm !== undefined) updateData.defaultWidthMm = dto.defaultWidthMm;
    if (dto.defaultHeightMm !== undefined) updateData.defaultHeightMm = dto.defaultHeightMm;
    if (dto.defaultColorsFront !== undefined) updateData.defaultColorsFront = dto.defaultColorsFront;
    if (dto.defaultColorsBack !== undefined) updateData.defaultColorsBack = dto.defaultColorsBack;
    if (dto.defaultFinishing !== undefined) updateData.defaultFinishing = dto.defaultFinishing;
    if (dto.defaultRawMaterialId !== undefined) {
      updateData.rawMaterial = dto.defaultRawMaterialId
        ? { connect: { id: dto.defaultRawMaterialId } }
        : { disconnect: true };
    }
    if (dto.defaultMachineId !== undefined) {
      updateData.machine = dto.defaultMachineId
        ? { connect: { id: dto.defaultMachineId } }
        : { disconnect: true };
    }
    if (dto.defaultMarkupPercent !== undefined) {
      updateData.defaultMarkupPercent = new Prisma.Decimal(dto.defaultMarkupPercent);
    }
    if (dto.suggestedQuantities !== undefined) {
      updateData.suggestedQuantities = dto.suggestedQuantities;
    }
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const updated = await this.prisma.productTemplate.update({
      where: { id },
      data: updateData,
      include: {
        rawMaterial: true,
        machine: true,
      },
    });

    return this.mapToItem(updated);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    await this.prisma.productTemplate.delete({
      where: { id },
    });

    return { success: true, message: 'Modelo removido com sucesso.' };
  }
}
