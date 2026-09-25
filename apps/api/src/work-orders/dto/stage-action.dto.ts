import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StageActionEnum {
  START = 'START',
  PAUSE = 'PAUSE',
  COMPLETE = 'COMPLETE',
}

export class StageActionDto {
  @ApiProperty({
    description: 'Ação executada pelo operador na etapa',
    enum: StageActionEnum,
    example: StageActionEnum.START,
  })
  @IsEnum(StageActionEnum, { message: 'Ação deve ser START, PAUSE ou COMPLETE.' })
  @IsNotEmpty({ message: 'Ação é obrigatória.' })
  action!: StageActionEnum;

  @ApiPropertyOptional({
    description: 'ID da máquina gráfica utilizada na etapa (CUID)',
    example: 'cm123machine456',
  })
  @IsString()
  @IsOptional()
  machineId?: string;

  @ApiProperty({
    description: 'ID do operador responsável pelo apontamento (CUID)',
    example: 'cm123user456',
  })
  @IsString()
  @IsNotEmpty({ message: 'operatorId é obrigatório para apontamento.' })
  operatorId!: string;

  @ApiPropertyOptional({
    description: 'Quantidade de folhas ou peças perdidas (refugo / acerto técnico)',
    example: 15,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  wasteQuantity?: number;

  @ApiPropertyOptional({
    description: 'Observações do operador (ex: parada para troca de blanqueta ou ajuste de faca)',
    example: 'Início da tiragem após acerto de registro e densidade de tinta.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
