import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Token de redefinição de senha recebido por e-mail',
  })
  @IsString({ message: 'Token deve ser uma string.' })
  @IsNotEmpty({ message: 'Token é obrigatório.' })
  token!: string;

  @ApiProperty({
    example: 'NovaSenhaForte@2026',
    description: 'Nova senha a ser cadastrada (mínimo 6 caracteres)',
  })
  @IsString({ message: 'Senha deve ser uma string.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password!: string;
}
