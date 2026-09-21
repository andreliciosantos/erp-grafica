import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException, ForbiddenException, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/auth/auth.service';
import { ApiKeyGuard } from '../src/auth/guards/api-key.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { Role } from '@erp/shared-types';
import { createMockPrismaService } from './mocks/prisma.mock';

describe('Módulo de Autenticação e Segurança (Auth / Guards)', () => {
  let authService: AuthService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    prismaMock = createMockPrismaService();
    jwtService = new JwtService({ secret: 'test-secret' });
    configService = new ConfigService({
      JWT_SECRET: 'test-secret',
      BOT_API_KEY: 'valid-bot-key-123',
    });

    authService = new AuthService(
      prismaMock as any,
      jwtService,
      configService,
    );
  });

  describe('AuthService.login', () => {
    it('deve autenticar com sucesso e retornar accessToken, refreshToken e dados do usuário', async () => {
      const result = await authService.login({
        email: 'admin@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: 'u-admin-1',
        name: 'Admin Test',
        email: 'admin@test.com',
        role: Role.ADMIN,
      });
    });

    it('deve lançar UnauthorizedException quando a senha estiver incorreta', async () => {
      await expect(
        authService.login({
          email: 'admin@test.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para e-mail não cadastrado', async () => {
      await expect(
        authService.login({
          email: 'inexistente@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('ApiKeyGuard (Segurança para Chatbot WhatsApp/Telegram)', () => {
    let apiKeyGuard: ApiKeyGuard;

    beforeEach(() => {
      apiKeyGuard = new ApiKeyGuard(configService);
    });

    it('deve permitir acesso e definir Role.BOT_SERVICE com header x-api-key válido', () => {
      const request: any = {
        headers: { 'x-api-key': 'valid-bot-key-123' },
      };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      const canActivate = apiKeyGuard.canActivate(context);

      expect(canActivate).toBe(true);
      expect(request.user).toBeDefined();
      expect(request.user.role).toBe(Role.BOT_SERVICE);
    });

    it('deve rejeitar com UnauthorizedException se o header x-api-key estiver ausente', () => {
      const request: any = { headers: {} };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      expect(() => apiKeyGuard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('deve rejeitar com UnauthorizedException se o header x-api-key for inválido', () => {
      const request: any = { headers: { 'x-api-key': 'chave-incorreta' } };
      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext;

      expect(() => apiKeyGuard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });

  describe('RolesGuard (RBAC)', () => {
    it('deve permitir acesso se o usuário possuir o perfil necessário', () => {
      const reflectorMock = {
        getAllAndOverride: vi.fn().mockReturnValue([Role.ADMIN, Role.COMMERCIAL]),
      };
      const rolesGuard = new RolesGuard(reflectorMock as any);

      const context = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'u-1', role: Role.ADMIN },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('deve lançar ForbiddenException se o usuário não possuir o perfil necessário', () => {
      const reflectorMock = {
        getAllAndOverride: vi.fn().mockReturnValue([Role.ADMIN]),
      };
      const rolesGuard = new RolesGuard(reflectorMock as any);

      const context = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'u-1', role: Role.OPERATOR },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
