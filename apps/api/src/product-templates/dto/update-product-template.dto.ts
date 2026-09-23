import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';

export class UpdateProductTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultWidthMm?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultHeightMm?: number;

  @IsOptional()
  @IsNumber()
  defaultColorsFront?: number;

  @IsOptional()
  @IsNumber()
  defaultColorsBack?: number;

  @IsOptional()
  @IsArray()
  defaultFinishing?: string[];

  @IsOptional()
  @IsString()
  defaultRawMaterialId?: string | null;

  @IsOptional()
  @IsString()
  defaultMachineId?: string | null;

  @IsOptional()
  @IsNumber()
  defaultMarkupPercent?: number;

  @IsOptional()
  @IsArray()
  suggestedQuantities?: number[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
