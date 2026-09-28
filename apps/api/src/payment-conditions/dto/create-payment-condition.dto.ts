import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentConditionDto {
  @ApiProperty({
    description: 'Nome da condição de pagamento ou parcelamento',
    example: 'Sinal 50% + 50% na Retirada',
  })
  @IsNotEmpty({ message: 'Nome da condição de pagamento é obrigatório.' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada dos termos comerciais',
    example: '50% de entrada no ato do pedido e 50% restante após 30 dias ou na retirada.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Número total de parcelas (de 1 a 24)',
    example: 2,
    minimum: 1,
    maximum: 24,
  })
  @IsNumber({}, { message: 'Número de parcelas deve ser numérico.' })
  @Min(1, { message: 'O número de parcelas deve ser de no mínimo 1.' })
  @Max(24, { message: 'O número de parcelas deve ser de no máximo 24.' })
  installmentsCount!: number;

  @ApiPropertyOptional({
    description: 'Percentual de entrada / sinal em % (0 a 100)',
    example: 50,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  downPaymentPercent?: number;

  @ApiPropertyOptional({
    description: 'Intervalo padrão em dias entre as parcelas',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  intervalDays?: number;

  @ApiPropertyOptional({
    description: 'Offsets de dias para cada parcela (ex: [0, 30, 60])',
    example: [0, 30],
  })
  @IsOptional()
  @IsArray()
  dayOffsets?: number[];

  @ApiPropertyOptional({
    description: 'Indica se esta é a condição padrão selecionada',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
