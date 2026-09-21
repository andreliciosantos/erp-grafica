import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PartyType } from '@erp/shared-types';

export class CreatePartyDto {
  @IsEnum(PartyType, { message: 'Tipo deve ser INDIVIDUAL ou COMPANY.' })
  @IsOptional()
  type?: PartyType;

  @IsString()
  @IsNotEmpty({ message: 'Nome / Razão Social é obrigatório.' })
  name!: string;

  @IsString()
  @IsOptional()
  tradeName?: string;

  @IsString()
  @IsNotEmpty({ message: 'CPF ou CNPJ é obrigatório.' })
  document!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório para identificação.' })
  phone!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsBoolean()
  @IsOptional()
  isCustomer?: boolean;

  @IsBoolean()
  @IsOptional()
  isSupplier?: boolean;
}
