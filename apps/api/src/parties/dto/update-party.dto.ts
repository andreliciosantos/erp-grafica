import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PartyType } from '@erp/shared-types';

export class UpdatePartyDto {
  @IsEnum(PartyType)
  @IsOptional()
  type?: PartyType;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  tradeName?: string;

  @IsString()
  @IsOptional()
  document?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

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
