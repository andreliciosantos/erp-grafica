import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateProductTemplateDto {
  @IsNotEmpty({ message: 'O nome do modelo é obrigatório.' })
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'A largura é obrigatória.' })
  @IsNumber()
  @Min(1)
  defaultWidthMm!: number;

  @IsNotEmpty({ message: 'A altura é obrigatória.' })
  @IsNumber()
  @Min(1)
  defaultHeightMm!: number;

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
  defaultRawMaterialId?: string;

  @IsOptional()
  @IsString()
  defaultMachineId?: string;

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
