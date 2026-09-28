import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@erp/shared-types';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  hasPassword?: boolean;
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserSummary> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    let passwordHash: string | null = null;
    let activationToken: string | null = null;
    let activationTokenExpires: Date | null = null;
    let emailVerified = false;

    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
      emailVerified = true;
    } else {
      activationToken = crypto.randomBytes(32).toString('hex');
      activationTokenExpires = new Date(Date.now() + 48 * 3600 * 1000); // 48h
    }

    const created = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: (dto.role as Role) || Role.OPERATOR,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        emailVerified,
        activationToken,
        activationTokenExpires,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (activationToken) {
      await this.mailService.sendUserInvitation({
        to: created.email,
        name: created.name,
        token: activationToken,
      });
    }

    return {
      ...created,
      role: created.role as Role,
      hasPassword: Boolean(passwordHash),
    };
  }

  async resendInvitation(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (user.emailVerified && user.passwordHash) {
      throw new ConflictException('Este usuário já confirmou seu e-mail e definiu uma senha.');
    }

    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenExpires = new Date(Date.now() + 48 * 3600 * 1000); // 48h

    await this.prisma.user.update({
      where: { id },
      data: {
        activationToken,
        activationTokenExpires,
      },
    });

    await this.mailService.sendUserInvitation({
      to: user.email,
      name: user.name,
      token: activationToken,
    });

    return {
      success: true,
      message: `Novo e-mail de ativação enviado com sucesso para ${user.email}!`,
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
          emailVerified: true,
          passwordHash: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as Role,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
        hasPassword: Boolean(u.passwordHash),
        createdAt: u.createdAt,
      })),
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
        emailVerified: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      hasPassword: Boolean(user.passwordHash),
      createdAt: user.createdAt,
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
      dataToUpdate['emailVerified'] = true;
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
        emailVerified: true,
        passwordHash: true,
        updatedAt: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role as Role,
      isActive: updated.isActive,
      emailVerified: updated.emailVerified,
      hasPassword: Boolean(updated.passwordHash),
      updatedAt: updated.updatedAt,
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

