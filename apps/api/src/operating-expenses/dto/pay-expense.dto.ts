import {
  IsNotEmpty,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  Min,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '@erp/shared-types';

export class PayExpenseDto {
  @IsISO8601({}, { message: 'Data de pagamento deve ser ISO8601.' })
  @IsNotEmpty({ message: 'Data de pagamento é obrigatória.' })
  paidAt!: string;

  @IsNumber({}, { message: 'Valor pago deve ser um número.' })
  @Min(0.01, { message: 'Valor pago deve ser maior que zero.' })
  @IsOptional()
  paidAmount?: number;

  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido.' })
  @IsNotEmpty({ message: 'Método de pagamento é obrigatório.' })
  paymentMethod!: PaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;
}
