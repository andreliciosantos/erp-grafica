import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';
import { Role } from '@erp/shared-types';

export class CreateUserDto {
  @IsString({ message: 'Nome deve ser uma string.' })
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  name!: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  @IsNotEmpty({ message: 'E-mail é obrigatório.' })
  email!: string;

  @IsString({ message: 'A senha temporária deve ser uma string.' })
  @MinLength(6, { message: 'A senha temporária deve ter no mínimo 6 caracteres.' })
  @IsNotEmpty({ message: 'A senha temporária é obrigatória.' })
  password!: string;

  @IsEnum(Role, { message: 'Perfil inválido.' })
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
