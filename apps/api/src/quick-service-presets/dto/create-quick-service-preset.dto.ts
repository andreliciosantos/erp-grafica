import { IsString, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuickServicePresetDto {
  @ApiProperty({
    description: 'Nome do serviço rápido (ex: Xerox P&B A4, Plastificação A4)',
    example: 'Xerox P&B A4',
  })
  @IsString({ message: 'Nome do serviço é obrigatório.' })
  name!: string;

  @ApiPropertyOptional({
    description: 'Categoria do serviço rápido',
    example: 'Xerox',
    default: 'Outros',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Preço unitário padrão de venda em R$',
    example: 0.5,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Preço padrão deve ser um número.' })
  @Min(0, { message: 'Preço padrão não pode ser negativo.' })
  defaultPrice!: number;

  @ApiPropertyOptional({
    description: 'ID da matéria-prima/insumo consumido do estoque',
    example: 'cm123rawmat456',
  })
  @IsString()
  @IsOptional()
  rawMaterialId?: string | null;

  @ApiPropertyOptional({
    description: 'Quantidade de insumo gasta por unidade de serviço (ex: 1 folha por cópia)',
    example: 1,
    default: 1,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Quantidade de consumo deve ser um número.' })
  @Min(0, { message: 'Quantidade de consumo não pode ser negativa.' })
  @IsOptional()
  materialConsumeQty?: number;

  @ApiPropertyOptional({
    description: 'Se o modelo está ativo para seleção rápida',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
