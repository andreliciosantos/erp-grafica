import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateOrderInstallmentsDto {
  @ApiProperty({
    description: 'ID da Ordem de Serviço faturada (CUID)',
    example: 'cm123order456',
  })
  @IsNotEmpty({ message: 'O ID da Ordem de Serviço é obrigatório.' })
  @IsString()
  workOrderId!: string;

  @ApiProperty({
    description: 'Plano comercial de cobrança',
    enum: ['FULL_ADVANCE', 'HALF_DOWN_HALF_PICKUP', 'CUSTOM_INSTALLMENTS'],
    example: 'HALF_DOWN_HALF_PICKUP',
  })
  @IsNotEmpty({ message: 'O plano de parcelamento é obrigatório.' })
  @IsIn(['FULL_ADVANCE', 'HALF_DOWN_HALF_PICKUP', 'CUSTOM_INSTALLMENTS'])
  plan!: 'FULL_ADVANCE' | 'HALF_DOWN_HALF_PICKUP' | 'CUSTOM_INSTALLMENTS';

  @ApiPropertyOptional({
    description: 'Número de parcelas (para plano CUSTOM_INSTALLMENTS, de 1 a 12)',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  installmentsCount?: number;

  @ApiPropertyOptional({
    description: 'Percentual do sinal/entrada em % (padrão: 50% para HALF_DOWN_HALF_PICKUP)',
    example: 50,
    minimum: 1,
    maximum: 99,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  downPaymentPercent?: number;

  @ApiPropertyOptional({
    description: 'Data de vencimento da primeira parcela (ISO 8601 YYYY-MM-DD)',
    example: '2026-10-05',
  })
  @IsOptional()
  @IsDateString()
  firstDueDate?: string;

  @ApiPropertyOptional({
    description: 'Intervalo em dias entre as parcelas subsequentes (padrão: 30 dias)',
    example: 30,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  intervalDays?: number;
}
