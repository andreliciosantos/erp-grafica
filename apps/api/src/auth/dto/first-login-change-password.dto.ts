import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FirstLoginChangePasswordDto {
  @ApiProperty({
    example: 'NovaSenhaDefinitiva@2026',
    description: 'Nova senha definitiva do usuário (mínimo 6 caracteres)',
  })
  @IsString({ message: 'A nova senha deve ser uma string.' })
  @MinLength(6, { message: 'A nova senha definitiva deve ter no mínimo 6 caracteres.' })
  @IsNotEmpty({ message: 'A nova senha é obrigatória.' })
  newPassword!: string;

  @ApiPropertyOptional({
    example: 'usuario@erpgrafica.com',
    description: 'E-mail do usuário (opcional se fornecido via token Bearer)',
  })
  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'temp123456',
    description: 'Senha temporária utilizada no primeiro acesso (opcional se fornecido via token Bearer)',
  })
  @IsString({ message: 'Senha temporária deve ser uma string.' })
  @IsOptional()
  temporaryPassword?: string;
}
