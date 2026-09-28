import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { AuthResponseDto, VerifyTokenResponseDto } from '@erp/shared-types';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuário e obter token JWT',
    description: 'Valida credenciais (e-mail e senha) e retorna o token de acesso (Bearer JWT) e os dados do usuário logado.',
  })
  @ApiResponse({ status: 200, description: 'Autenticação realizada com sucesso.' })
  @ApiBadRequestResponse({ description: 'Requisição inválida (campos vazios ou formato de e-mail inválido).' })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas ou conta não ativada.' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar redefinição de senha',
    description: 'Gera um token seguro de recuperação de senha e despacha um e-mail com o link de redefinição para o usuário.',
  })
  @ApiResponse({ status: 200, description: 'E-mail de recuperação despachado (se o usuário existir).' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    return this.authService.forgotPassword(dto);
  }

  @Get('verify-token')
  @ApiOperation({
    summary: 'Verificar validade de token de ativação ou redefinição',
    description: 'Permite que a interface web valide se um token de ativação ou de recuperação ainda está válido antes de exibir o formulário.',
  })
  @ApiQuery({ name: 'token', required: true, description: 'Token a ser verificado' })
  @ApiQuery({ name: 'type', required: true, enum: ['activation', 'reset'], description: 'Tipo do token' })
  async verifyToken(
    @Query('token') token: string,
    @Query('type') type: 'activation' | 'reset',
  ): Promise<VerifyTokenResponseDto> {
    return this.authService.verifyToken(token, type || 'activation');
  }

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ativar conta e cadastrar senha inicial',
    description: 'Confirma o e-mail do usuário convidado e grava a sua senha pessoal definitiva de acesso ao sistema.',
  })
  @ApiResponse({ status: 200, description: 'Conta ativada e usuário autenticado.' })
  @ApiBadRequestResponse({ description: 'Token inválido ou expirado.' })
  async activateAccount(@Body() dto: ActivateAccountDto): Promise<AuthResponseDto> {
    return this.authService.activateAccount(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redefinir senha de acesso',
    description: 'Grava a nova senha de acesso através de um token válido de recuperação.',
  })
  @ApiResponse({ status: 200, description: 'Senha atualizada com sucesso.' })
  @ApiBadRequestResponse({ description: 'Token inválido ou expirado.' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    return this.authService.resetPassword(dto);
  }
}
