import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';
import { Role } from '@erp/shared-types';

export class CreateUserDto {
  @IsString({ message: 'Nome deve ser uma string.' })
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  name!: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @IsString({ message: 'Senha deve ser uma string.' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres.' })
  password!: string;

  @IsEnum(Role, { message: 'Perfil inválido.' })
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
