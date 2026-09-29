import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { FirstLoginChangePasswordDto } from './dto/first-login-change-password.dto';
import { AuthResponseDto, Role, VerifyTokenResponseDto } from '@erp/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.trim().toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Esta conta ainda não possui senha cadastrada. Entre em contato com o administrador do sistema.'
      );
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.generateAuthResponse(user);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Medida de segurança contra enumeração de usuários: sempre responde com mensagem padronizada
    if (!user || !user.isActive) {
      return {
        success: true,
        message: 'Se o e-mail informado estiver cadastrado, as instruções para redefinição foram enviadas.',
      };
    }

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600 * 1000); // 1 hora

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpires,
      },
    });

    await this.mailService.sendPasswordReset({
      to: user.email,
      name: user.name,
      token: resetPasswordToken,
    });

    return {
      success: true,
      message: 'Se o e-mail informado estiver cadastrado, as instruções para redefinição foram enviadas.',
    };
  }

  async verifyToken(token: string, type: 'activation' | 'reset'): Promise<VerifyTokenResponseDto> {
    const now = new Date();

    if (type === 'activation') {
      const user = await this.prisma.user.findFirst({
        where: {
          activationToken: token,
          activationTokenExpires: { gt: now },
        },
        select: { email: true, name: true },
      });

      if (!user) {
        return {
          valid: false,
          type: 'activation',
          message: 'O link de ativação é inválido ou já expirou. Solicite um novo convite ao administrador.',
        };
      }

      return {
        valid: true,
        type: 'activation',
        email: user.email,
        name: user.name,
      };
    } else {
      const user = await this.prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { gt: now },
        },
        select: { email: true, name: true },
      });

      if (!user) {
        return {
          valid: false,
          type: 'reset',
          message: 'O link de redefinição de senha é inválido ou já expirou. Solicite uma nova recuperação.',
        };
      }

      return {
        valid: true,
        type: 'reset',
        email: user.email,
        name: user.name,
      };
    }
  }

  async activateAccount(dto: ActivateAccountDto): Promise<AuthResponseDto> {
    const now = new Date();
    const user = await this.prisma.user.findFirst({
      where: {
        activationToken: dto.token,
        activationTokenExpires: { gt: now },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Token de ativação inválido ou expirado. Por favor, solicite um novo convite.'
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: true,
        isActive: true,
        activationToken: null,
        activationTokenExpires: null,
      },
    });

    return this.generateAuthResponse(updatedUser);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    const now = new Date();
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: dto.token,
        resetPasswordExpires: { gt: now },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Token de redefinição inválido ou expirado. Por favor, solicite novamente a recuperação de senha.'
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: true,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return {
      success: true,
      message: 'Senha alterada com sucesso! Você já pode realizar o login com sua nova senha.',
    };
  }

  async firstLoginChangePassword(
    dto: FirstLoginChangePasswordDto,
    tokenOrUserId?: string,
  ): Promise<AuthResponseDto> {
    let userId: string | undefined;

    if (tokenOrUserId) {
      try {
        const payload = this.jwtService.verify(tokenOrUserId);
        userId = payload.sub;
      } catch (_) {
        userId = tokenOrUserId;
      }
    }

    let user = null;

    if (userId) {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
    } else if (dto.email && dto.temporaryPassword) {
      const found = await this.prisma.user.findUnique({
        where: { email: dto.email.trim().toLowerCase() },
      });
      if (found && found.passwordHash) {
        const isValid = await bcrypt.compare(dto.temporaryPassword, found.passwordHash);
        if (isValid) {
          user = found;
        }
      }
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas ou usuário não autenticado.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        emailVerified: true,
      },
    });

    return this.generateAuthResponse(updatedUser);
  }

  private generateAuthResponse(user: {
    id: string;
    email: string;
    name: string;
    role: any;
    mustChangePassword?: boolean;
  }): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'super-secret-refresh-key-change-in-production-2026'
      ),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as `${number}d` | `${number}h` | `${number}m` | `${number}s`,
    });

    const mustChange = Boolean(user.mustChangePassword);

    return {
      accessToken,
      refreshToken,
      mustChangePassword: mustChange,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
        mustChangePassword: mustChange,
      },
    };
  }
}
