import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export enum StageActionEnum {
  START = 'START',
  PAUSE = 'PAUSE',
  COMPLETE = 'COMPLETE',
}

export class StageActionDto {
  @IsEnum(StageActionEnum, { message: 'Ação deve ser START, PAUSE ou COMPLETE.' })
  @IsNotEmpty({ message: 'Ação é obrigatória.' })
  action!: StageActionEnum;

  @IsString()
  @IsOptional()
  machineId?: string;

  @IsString()
  @IsNotEmpty({ message: 'operatorId é obrigatório para apontamento.' })
  operatorId!: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  wasteQuantity?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
