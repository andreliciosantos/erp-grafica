import { Injectable, NotFoundException } from '@nestjs/common';
import { RawMaterial, StockMovement } from '@erp/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { RawMaterialCategory } from '@erp/shared-types';

export interface PaginatedRawMaterialsResponse {
  data: RawMaterial[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type RawMaterialWithMovements = RawMaterial & {
  stockMovements: StockMovement[];
};

@Injectable()
export class RawMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRawMaterialDto): Promise<RawMaterial> {
    return this.prisma.rawMaterial.create({
      data: {
        name: dto.name,
        category: dto.category as RawMaterialCategory,
        unitOfMeasure: dto.unitOfMeasure,
        costPerUnit: dto.costPerUnit,
        currentStock: dto.currentStock ?? 0,
        minStock: dto.minStock ?? 0,
        sheetWidthMm: dto.sheetWidthMm,
        sheetHeightMm: dto.sheetHeightMm,
        grammage: dto.grammage,
      },
    });
  }

  async findAll(category?: RawMaterialCategory, page = 1, limit = 50): Promise<PaginatedRawMaterialsResponse> {
    const skip = (page - 1) * limit;
    const where = category ? { category } : {};

    const [total, data] = await Promise.all([
      this.prisma.rawMaterial.count({ where }),
      this.prisma.rawMaterial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
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

  async findOne(id: string): Promise<RawMaterialWithMovements> {
    const item = await this.prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Matéria-prima com ID ${id} não encontrada.`);
    }

    return item;
  }

  async update(id: string, dto: UpdateRawMaterialDto): Promise<RawMaterial> {
    await this.findOne(id);

    return this.prisma.rawMaterial.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.category && { category: dto.category as RawMaterialCategory }),
        ...(dto.unitOfMeasure && { unitOfMeasure: dto.unitOfMeasure }),
        ...(dto.costPerUnit !== undefined && { costPerUnit: dto.costPerUnit }),
        ...(dto.currentStock !== undefined && { currentStock: dto.currentStock }),
        ...(dto.minStock !== undefined && { minStock: dto.minStock }),
        ...(dto.sheetWidthMm !== undefined && { sheetWidthMm: dto.sheetWidthMm }),
        ...(dto.sheetHeightMm !== undefined && { sheetHeightMm: dto.sheetHeightMm }),
        ...(dto.grammage !== undefined && { grammage: dto.grammage }),
      },
    });
  }
}
