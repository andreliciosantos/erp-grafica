import {
  IsArray,
  IsBoolean,
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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelSource } from '@erp/shared-types';
import { CreateQuoteItemDto } from './create-quote-item.dto';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'ID do cliente cadastrado (CUID)',
    example: 'cm1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty({ message: 'partyId é obrigatório.' })
  partyId!: string;

  @ApiPropertyOptional({
    description: 'Canal de entrada do orçamento',
    enum: ChannelSource,
    example: ChannelSource.WEB,
  })
  @IsEnum(ChannelSource, { message: 'Canal de origem inválido.' })
  @IsOptional()
  origin?: ChannelSource;

  @ApiProperty({
    description: 'Margem de Markup aplicada sobre o custo total (ex: 0.35 para 35% de margem)',
    example: 0.35,
    minimum: 0,
    maximum: 0.999,
  })
  @IsNumber({}, { message: 'Markup deve ser numérico (ex: 0.40 para 40%).' })
  @Min(0, { message: 'Markup deve ser maior ou igual a 0.' })
  @Max(0.999, { message: 'Markup deve ser estritamente menor que 1.0.' })
  markupApplied!: number;

  @ApiPropertyOptional({
    description: 'Prazo de validade da proposta em dias corridos (padrão: 10 dias)',
    example: 15,
  })
  @IsNumber()
  @IsOptional()
  validDays?: number;

  @ApiPropertyOptional({
    description: 'Observações técnicas ou comerciais da proposta',
    example: 'Entregar com embalagem termoencolhível em pacotes de 100 unidades.',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Se verdadeiro, aprova automaticamente gerando a Ordem de Serviço de imediato',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  autoApprove?: boolean;

  @ApiProperty({
    description: 'Itens do orçamento (produtos a serem calculados pela engenharia gráfica)',
    type: [CreateQuoteItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items!: CreateQuoteItemDto[];
}
