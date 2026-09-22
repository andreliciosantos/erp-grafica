import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Party } from '@erp/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { PartyType } from '@erp/shared-types';

export interface PaginatedPartiesResponse {
  data: Party[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class PartiesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDigits(val: string): string {
    return val.replace(/\D/g, '');
  }

  async create(dto: CreatePartyDto): Promise<Party> {
    const cleanDoc = this.normalizeDigits(dto.document);
    const cleanPhone = this.normalizeDigits(dto.phone);

    const existing = await this.prisma.party.findUnique({
      where: { document: cleanDoc },
    });
    if (existing) {
      throw new ConflictException('Já existe um cliente/fornecedor com este CPF/CNPJ.');
    }

    return this.prisma.party.create({
      data: {
        type: (dto.type as PartyType) || PartyType.INDIVIDUAL,
        name: dto.name,
        tradeName: dto.tradeName,
        document: cleanDoc,
        email: dto.email,
        phone: cleanPhone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        isCustomer: dto.isCustomer !== undefined ? dto.isCustomer : true,
        isSupplier: dto.isSupplier !== undefined ? dto.isSupplier : false,
      },
    });
  }

  async findAll(page = 1, limit = 20, search?: string): Promise<PaginatedPartiesResponse> {
    const skip = (page - 1) * limit;
    const whereClause: Record<string, unknown> = {};

    if (search) {
      const cleanSearch = this.normalizeDigits(search);
      whereClause['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } },
        ...(cleanSearch
          ? [{ document: { contains: cleanSearch } }, { phone: { contains: cleanSearch } }]
          : []),
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.party.count({ where: whereClause }),
      this.prisma.party.findMany({
        where: whereClause,
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

  async findOne(id: string): Promise<Party> {
    const party = await this.prisma.party.findUnique({
      where: { id },
    });
    if (!party) {
      throw new NotFoundException(`Cliente/Fornecedor com ID ${id} não encontrado.`);
    }
    return party;
  }

  async findByPhone(phone: string): Promise<Party | null> {
    const clean = this.normalizeDigits(phone);
    const suffix = clean.length >= 8 ? clean.slice(-8) : clean;
    return this.prisma.party.findFirst({
      where: {
        phone: { contains: suffix },
      },
    });
  }

  async update(id: string, dto: UpdatePartyDto): Promise<Party> {
    await this.findOne(id);

    const dataToUpdate: Record<string, unknown> = {};
    if (dto.name) dataToUpdate['name'] = dto.name;
    if (dto.tradeName !== undefined) dataToUpdate['tradeName'] = dto.tradeName;
    if (dto.type) dataToUpdate['type'] = dto.type;
    if (dto.email !== undefined) dataToUpdate['email'] = dto.email;
    if (dto.address !== undefined) dataToUpdate['address'] = dto.address;
    if (dto.city !== undefined) dataToUpdate['city'] = dto.city;
    if (dto.state !== undefined) dataToUpdate['state'] = dto.state;
    if (dto.isCustomer !== undefined) dataToUpdate['isCustomer'] = dto.isCustomer;
    if (dto.isSupplier !== undefined) dataToUpdate['isSupplier'] = dto.isSupplier;
    if (dto.document) dataToUpdate['document'] = this.normalizeDigits(dto.document);
    if (dto.phone) dataToUpdate['phone'] = this.normalizeDigits(dto.phone);

    return this.prisma.party.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string): Promise<Party> {
    const party = await this.findOne(id);
    const workOrdersCount = await this.prisma.workOrder.count({ where: { partyId: id } });
    if (workOrdersCount > 0) {
      throw new ConflictException(
        `Não é possível excluir o cliente/fornecedor pois existem ${workOrdersCount} ordens de serviço vinculadas.`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const quotes = await tx.quote.findMany({ where: { partyId: id } });
      const quoteIds = quotes.map((q) => q.id);
      if (quoteIds.length > 0) {
        await tx.quoteItem.deleteMany({
          where: { quoteId: { in: quoteIds } },
        });
        await tx.quote.deleteMany({
          where: { partyId: id },
        });
      }

      return tx.party.delete({
        where: { id },
      });
    });
  }
}

