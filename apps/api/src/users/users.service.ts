import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@erp/shared-types';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginatedUsersResponse {
  data: UserSummary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<UserSummary> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: (dto.role as Role) || Role.OPERATOR,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      ...created,
      role: created.role as Role,
    };
  }

  async findAll(page = 1, limit = 20): Promise<PaginatedUsersResponse> {
    const skip = (page - 1) * limit;
    const [total, users] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data: users.map((u) => ({ ...u, role: u.role as Role })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<UserSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    return {
      ...user,
      role: user.role as Role,
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserSummary> {
    await this.findOne(id);

    const dataToUpdate: Record<string, unknown> = {};
    if (dto.name) dataToUpdate['name'] = dto.name;
    if (dto.email) dataToUpdate['email'] = dto.email;
    if (dto.role) dataToUpdate['role'] = dto.role;
    if (dto.isActive !== undefined) dataToUpdate['isActive'] = dto.isActive;
    if (dto.password) {
      dataToUpdate['passwordHash'] = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      role: updated.role as Role,
    };
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(id);

    const [quotesCount, workOrdersCount, stageLogsCount] = await Promise.all([
      this.prisma.quote.count({ where: { userId: id } }),
      this.prisma.workOrder.count({ where: { userId: id } }),
      this.prisma.stageExecutionLog.count({ where: { operatorId: id } }),
    ]);

    if (quotesCount > 0 || workOrdersCount > 0 || stageLogsCount > 0) {
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return { success: true, message: 'Usuário desativado com sucesso (histórico preservado).' };
    } else {
      await this.prisma.user.delete({
        where: { id },
      });
      return { success: true, message: 'Usuário excluído com sucesso.' };
    }
  }
}

