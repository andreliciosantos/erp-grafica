import {
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
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
}
