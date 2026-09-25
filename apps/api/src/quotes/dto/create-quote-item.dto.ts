import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuoteItemDto {
  @ApiProperty({
    description: 'Nome do produto gráfico',
    example: 'Folder Institucional A4 4x4',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome do produto é obrigatório (ex: Cartão de Visita, Folder A4).' })
  productName!: string;

  @ApiPropertyOptional({
    description: 'ID da matéria-prima (papel) cadastrada',
    example: 'rm-couche-1',
  })
  @IsString()
  @IsOptional()
  rawMaterialId?: string;

  @ApiProperty({
    description: 'Tiragem desejada (quantidade de exemplares)',
    example: 1000,
  })
  @IsInt()
  @IsPositive({ message: 'Quantidade deve ser um inteiro positivo.' })
  quantity!: number;

  @ApiProperty({
    description: 'Largura do impresso aberto em milímetros',
    example: 210,
  })
  @IsInt()
  @IsPositive({ message: 'Largura em mm deve ser um inteiro positivo.' })
  widthMm!: number;

  @ApiProperty({
    description: 'Altura do impresso aberto em milímetros',
    example: 297,
  })
  @IsInt()
  @IsPositive({ message: 'Altura em mm deve ser um inteiro positivo.' })
  heightMm!: number;

  @ApiProperty({
    description: 'Cores de impressão na frente (0 para sem impressão, 1 para mono, 4 para CMYK)',
    example: 4,
  })
  @IsInt()
  @Min(0)
  colorsFront!: number;

  @ApiProperty({
    description: 'Cores de impressão no verso (0 para sem impressão, 1 para mono, 4 para CMYK)',
    example: 4,
  })
  @IsInt()
  @Min(0)
  colorsBack!: number;

  @ApiPropertyOptional({
    description: 'Lista de acabamentos a serem aplicados',
    example: ['DOBRA', 'LAMINACAO_FOSCA'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  finishingOptions?: string[];
}
