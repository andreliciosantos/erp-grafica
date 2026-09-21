import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateMachineDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome da máquina é obrigatório.' })
  name!: string;

  @IsNumber()
  @IsPositive({ message: 'Custo por hora deve ser positivo.' })
  hourlyRate!: number;

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
