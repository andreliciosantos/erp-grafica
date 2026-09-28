import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateAccountDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Token de ativação da conta recebido por e-mail de convite',
  })
  @IsString({ message: 'Token deve ser uma string.' })
  @IsNotEmpty({ message: 'Token é obrigatório.' })
  token!: string;

  @ApiProperty({
    example: 'MinhaSenhaSegura@2026',
    description: 'Senha definitiva escolhida pelo usuário (mínimo 6 caracteres)',
  })
  @IsString({ message: 'Senha deve ser uma string.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password!: string;
}
