import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { PaymentStatus, PaymentMethod } from '@erp/shared-types';

export class UpdateReceivableDto {
  @IsOptional()
  @IsString()
  partyId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  installmentNumber?: number;

  @IsOptional()
  @IsNumber()
  totalInstallments?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod | null;

  @IsOptional()
  @IsString()
  barcode?: string | null;

  @IsOptional()
  @IsString()
  documentNumber?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsDateString()
  paidAt?: string | null;
}
