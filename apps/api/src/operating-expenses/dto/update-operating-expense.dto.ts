import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsISO8601,
  IsBoolean,
} from 'class-validator';
import {
  ExpenseCategory,
  ExpenseType,
  PaymentMethod,
  PaymentStatus,
} from '@erp/shared-types';

export class UpdateOperatingExpenseDto {
  @IsString({ message: 'Descrição deve ser um texto.' })
  @IsOptional()
  description?: string;

  @IsEnum(ExpenseCategory, { message: 'Categoria de despesa inválida.' })
  @IsOptional()
  category?: ExpenseCategory;

  @IsEnum(ExpenseType, { message: 'Tipo de despesa inválido.' })
  @IsOptional()
  expenseType?: ExpenseType;

  @IsNumber({}, { message: 'Valor deve ser um número.' })
  @Min(0.01, { message: 'O valor da despesa deve ser maior que zero.' })
  @IsOptional()
  amount?: number;

  @IsISO8601({}, { message: 'Data de vencimento deve estar no formato ISO8601 (YYYY-MM-DD).' })
  @IsOptional()
  dueDate?: string;

  @IsISO8601({}, { message: 'Data de competência deve estar no formato ISO8601 (YYYY-MM-DD).' })
  @IsOptional()
  competenceDate?: string;

  @IsString({ message: 'ID do fornecedor deve ser texto.' })
  @IsOptional()
  supplierId?: string | null;

  @IsString({ message: 'Nome do favorecido/credor deve ser texto.' })
  @IsOptional()
  beneficiaryName?: string | null;

  @IsString({ message: 'Código de barras / PIX deve ser texto.' })
  @IsOptional()
  barcode?: string | null;

  @IsString({ message: 'Número do documento/fatura deve ser texto.' })
  @IsOptional()
  documentNumber?: string | null;

  @IsBoolean({ message: 'Recorrência deve ser verdadeiro ou falso.' })
  @IsOptional()
  isRecurring?: boolean;

  @IsString({ message: 'Intervalo de recorrência deve ser texto.' })
  @IsOptional()
  recurrenceInterval?: string | null;

  @IsISO8601({}, { message: 'Data de término da recorrência deve ser ISO8601.' })
  @IsOptional()
  recurrenceEndDate?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;

  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido.' })
  @IsOptional()
  paymentMethod?: PaymentMethod | null;

  @IsEnum(PaymentStatus, { message: 'Status de pagamento inválido.' })
  @IsOptional()
  status?: PaymentStatus;

  @IsISO8601({}, { message: 'Data de pagamento deve ser ISO8601.' })
  @IsOptional()
  paidAt?: string | null;
}
