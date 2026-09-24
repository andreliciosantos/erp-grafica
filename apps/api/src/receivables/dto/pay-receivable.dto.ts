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
import { PaymentMethod } from '@erp/shared-types';

export class PayReceivableDto {
  @IsNotEmpty({ message: 'A data do recebimento é obrigatória.' })
  @IsDateString({}, { message: 'Data de recebimento inválida.' })
  paidAt!: string;

  @IsNotEmpty({ message: 'O método de pagamento é obrigatório.' })
  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido.' })
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O valor do desconto deve ser numérico.' })
  @Min(0, { message: 'O valor do desconto não pode ser negativo.' })
  discountAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O valor do acréscimo/juros deve ser numérico.' })
  @Min(0, { message: 'O valor do acréscimo/juros não pode ser negativo.' })
  surchargeAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O valor pago deve ser numérico.' })
  @Min(0.01, { message: 'O valor pago deve ser maior que zero.' })
  paidAmount?: number;
}

