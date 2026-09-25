import {
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@erp/shared-types';

export class PayReceivableDto {
  @ApiProperty({
    description: 'Data do pagamento / quitação do título (ISO 8601 YYYY-MM-DD)',
    example: '2026-09-25',
  })
  @IsNotEmpty({ message: 'A data do recebimento é obrigatória.' })
  @IsDateString({}, { message: 'Data de recebimento inválida.' })
  paidAt!: string;

  @ApiProperty({
    description: 'Forma de pagamento utilizada',
    enum: PaymentMethod,
    example: PaymentMethod.PIX,
  })
  @IsNotEmpty({ message: 'O método de pagamento é obrigatório.' })
  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido.' })
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Observações do recebimento (ex: comprovante PIX ou número de autorização)',
    example: 'PIX recebido via Banco do Brasil - Autenticação 987654321',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Valor de desconto concedido na liquidação em R$',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O valor do desconto deve ser numérico.' })
  @Min(0, { message: 'O valor do desconto não pode ser negativo.' })
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Valor de acréscimo / juros por atraso em R$',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O valor do acréscimo/juros deve ser numérico.' })
  @Min(0, { message: 'O valor do acréscimo/juros não pode ser negativo.' })
  surchargeAmount?: number;

  @ApiPropertyOptional({
    description: 'Valor líquido efetivamente pago em R$',
    example: 425.0,
    minimum: 0.01,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O valor pago deve ser numérico.' })
  @Min(0.01, { message: 'O valor pago deve ser maior que zero.' })
  paidAmount?: number;
}

