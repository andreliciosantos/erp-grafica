import { Injectable, NotFoundException } from '@nestjs/common';
import { Machine } from '@erp/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';

@Injectable()
export class MachinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMachineDto): Promise<Machine> {
    return this.prisma.machine.create({
      data: {
        name: dto.name,
        hourlyRate: dto.hourlyRate,
        setupMinutes: dto.setupMinutes ?? 15,
        maxSheetsHour: dto.maxSheetsHour,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async findAll(activeOnly = false): Promise<Machine[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.machine.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string): Promise<Machine> {
    const machine = await this.prisma.machine.findUnique({
      where: { id },
    });
    if (!machine) {
      throw new NotFoundException(`Máquina com ID ${id} não encontrada.`);
    }
    return machine;
  }

  async update(id: string, dto: UpdateMachineDto): Promise<Machine> {
    await this.findOne(id);

    return this.prisma.machine.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
        ...(dto.setupMinutes !== undefined && { setupMinutes: dto.setupMinutes }),
        ...(dto.maxSheetsHour !== undefined && { maxSheetsHour: dto.maxSheetsHour }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }
}
