import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class UpdateMachineDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  hourlyRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  setupMinutes?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  maxSheetsHour?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
