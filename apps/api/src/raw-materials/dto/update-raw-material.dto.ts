import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { RawMaterialCategory } from '@erp/shared-types';

export class UpdateRawMaterialDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(RawMaterialCategory)
  @IsOptional()
  category?: RawMaterialCategory;

  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  costPerUnit?: number;

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
