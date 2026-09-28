import { IsString, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateQuickServicePresetDto {
  @ApiPropertyOptional({
    description: 'Nome do serviço rápido',
    example: 'Xerox P&B A4',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Categoria do serviço rápido',
    example: 'Xerox',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Preço unitário padrão de venda em R$',
    example: 0.5,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Preço padrão deve ser um número.' })
  @Min(0, { message: 'Preço padrão não pode ser negativo.' })
  @IsOptional()
  defaultPrice?: number;

  @ApiPropertyOptional({
    description: 'ID da matéria-prima/insumo consumido do estoque',
    example: 'cm123rawmat456',
  })
  @IsString()
  @IsOptional()
  rawMaterialId?: string | null;

  @ApiPropertyOptional({
    description: 'Quantidade de insumo gasta por unidade de serviço',
    example: 1,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Quantidade de consumo deve ser um número.' })
  @Min(0, { message: 'Quantidade de consumo não pode ser negativa.' })
  @IsOptional()
  materialConsumeQty?: number;

  @ApiPropertyOptional({
    description: 'Se o modelo está ativo',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
