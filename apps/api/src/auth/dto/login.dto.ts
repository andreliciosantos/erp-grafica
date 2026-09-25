import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'E-mail corporativo do usuário',
    example: 'admin@erpgrafica.com',
  })
  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @ApiProperty({
    description: 'Senha de acesso (mínimo de 6 caracteres)',
    example: 'admin123',
  })
  @IsString({ message: 'A senha deve ser uma string.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password!: string;
}
