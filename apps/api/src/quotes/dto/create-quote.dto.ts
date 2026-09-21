import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChannelSource } from '@erp/shared-types';
import { CreateQuoteItemDto } from './create-quote-item.dto';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty({ message: 'partyId é obrigatório.' })
  partyId!: string;

  @IsEnum(ChannelSource, { message: 'Canal de origem inválido.' })
  @IsOptional()
  origin?: ChannelSource;

  @IsNumber({}, { message: 'Markup deve ser numérico (ex: 0.40 para 40%).' })
  @Min(0, { message: 'Markup deve ser maior ou igual a 0.' })
  @Max(0.999, { message: 'Markup deve ser estritamente menor que 1.0.' })
  markupApplied!: number;

  @IsNumber()
  @IsOptional()
  validDays?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items!: CreateQuoteItemDto[];
}
