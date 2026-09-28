import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../src/users/users.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';
import { createMockPrismaService } from './mocks/prisma.mock';
import { Role } from '@erp/shared-types';

describe('UsersService - Root Admin Security & Protections', () => {
  let usersService: UsersService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;
  let mailServiceMock: { sendUserInvitation: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prismaMock = createMockPrismaService();
    mailServiceMock = {
      sendUserInvitation: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MailService, useValue: mailServiceMock },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('Root Admin Protections', () => {
    it('deve impedir a exclusão ou desativação do Administrador principal (root)', async () => {
      (prismaMock.user.findUnique as any).mockResolvedValueOnce({
        id: 'u-admin-1',
        name: 'Administrador do Sistema',
        email: 'admin@erpgrafica.com',
        role: Role.ADMIN,
        isActive: true,
        isRoot: true,
        emailVerified: true,
      });

      await expect(usersService.remove('u-admin-1')).rejects.toThrow(ForbiddenException);
      expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });

    it('deve impedir a desativação (isActive = false) do Administrador principal (root)', async () => {
      (prismaMock.user.findUnique as any).mockResolvedValueOnce({
        id: 'u-admin-1',
        name: 'Administrador do Sistema',
        email: 'admin@erpgrafica.com',
        role: Role.ADMIN,
        isActive: true,
        isRoot: true,
        emailVerified: true,
      });

      await expect(
        usersService.update('u-admin-1', {
          isActive: false,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve impedir a alteração de perfil (role) do Administrador principal (root)', async () => {
      (prismaMock.user.findUnique as any).mockResolvedValueOnce({
        id: 'u-admin-1',
        name: 'Administrador do Sistema',
        email: 'admin@erpgrafica.com',
        role: Role.ADMIN,
        isActive: true,
        isRoot: true,
        emailVerified: true,
      });

      await expect(
        usersService.update('u-admin-1', {
          role: Role.OPERATOR,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve impedir o reenvio de convite para o Administrador principal (root)', async () => {
      (prismaMock.user.findUnique as any).mockResolvedValueOnce({
        id: 'u-admin-1',
        name: 'Administrador do Sistema',
        email: 'admin@erpgrafica.com',
        role: Role.ADMIN,
        isActive: true,
        isRoot: true,
        emailVerified: true,
        passwordHash: 'hash',
      });

      await expect(usersService.resendInvitation('u-admin-1')).rejects.toThrow(ConflictException);
    });

    it('deve permitir a exclusão de um usuário comum sem vínculos', async () => {
      (prismaMock.user.findUnique as any).mockResolvedValueOnce({
        id: 'u-op-1',
        name: 'Operador Temporário',
        email: 'op.temp@erpgrafica.com',
        role: Role.OPERATOR,
        isActive: true,
        isRoot: false,
        emailVerified: true,
      });

      // No quotes, workOrders or stageLogs
      (prismaMock.quote.count as any).mockResolvedValueOnce(0);
      (prismaMock.workOrder.count as any).mockResolvedValueOnce(0);
      (prismaMock.stageExecutionLog.count as any).mockResolvedValueOnce(0);
      (prismaMock.user.delete as any).mockResolvedValueOnce({});

      const result = await usersService.remove('u-op-1');
      expect(result.success).toBe(true);
      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'u-op-1' } });
    });
  });
});
