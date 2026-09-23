import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { PaymentStatus, PaymentMethod } from '@erp/shared-types';

export class CreateReceivableDto {
  @IsOptional()
  @IsString()
  workOrderId?: string;

  @IsNotEmpty({ message: 'O cliente é obrigatório.' })
  @IsString()
  partyId!: string;

  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  @IsString()
  description!: string;

  @IsOptional()
  @IsNumber()
  installmentNumber?: number;

  @IsOptional()
  @IsNumber()
  totalInstallments?: number;

  @IsNotEmpty({ message: 'O valor é obrigatório.' })
  @IsNumber({}, { message: 'O valor deve ser numérico.' })
  @IsPositive({ message: 'O valor deve ser maior que zero.' })
  amount!: number;

  @IsNotEmpty({ message: 'A data de vencimento é obrigatória.' })
  @IsDateString({}, { message: 'Data de vencimento inválida.' })
  dueDate!: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
