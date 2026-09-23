import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  partyId?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  priority?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  deliveryDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
