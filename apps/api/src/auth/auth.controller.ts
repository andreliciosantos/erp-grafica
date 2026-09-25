import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from '@erp/shared-types';

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
  @ApiResponse({
    status: 200,
    description: 'Autenticação realizada com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'Requisição inválida (campos vazios ou formato de e-mail inválido segundo RFC 7807).',
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas (e-mail inexistente ou senha incorreta).',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }
}
