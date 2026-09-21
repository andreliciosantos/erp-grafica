import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { RawMaterialCategory } from '@erp/shared-types';

export class CreateRawMaterialDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do insumo é obrigatório.' })
  name!: string;

  @IsEnum(RawMaterialCategory, { message: 'Categoria de insumo inválida.' })
  category!: RawMaterialCategory;

  @IsString()
  @IsNotEmpty({ message: 'Unidade de medida é obrigatória (ex: FL, M2, KG, UN).' })
  unitOfMeasure!: string;

  @IsNumber({}, { message: 'Custo unitário deve ser numérico.' })
  @IsPositive({ message: 'Custo unitário deve ser positivo.' })
  costPerUnit!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  currentStock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  sheetWidthMm?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  sheetHeightMm?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  grammage?: number;
}
