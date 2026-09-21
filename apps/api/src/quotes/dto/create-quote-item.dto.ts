import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateQuoteItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do produto é obrigatório (ex: Cartão de Visita, Folder A4).' })
  productName!: string;

  @IsString()
  @IsOptional()
  rawMaterialId?: string;

  @IsInt()
  @IsPositive({ message: 'Quantidade deve ser um inteiro positivo.' })
  quantity!: number;

  @IsInt()
  @IsPositive({ message: 'Largura em mm deve ser um inteiro positivo.' })
  widthMm!: number;

  @IsInt()
  @IsPositive({ message: 'Altura em mm deve ser um inteiro positivo.' })
  heightMm!: number;

  @IsInt()
  @Min(0)
  colorsFront!: number;

  @IsInt()
  @Min(0)
  colorsBack!: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  finishingOptions?: string[];
}
