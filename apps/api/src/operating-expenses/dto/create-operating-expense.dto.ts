import {
  IsString,
  IsNotEmpty,
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

export class CreateOperatingExpenseDto {
  @IsString({ message: 'Descrição deve ser um texto.' })
  @IsNotEmpty({ message: 'Descrição da despesa é obrigatória.' })
  description!: string;

  @IsEnum(ExpenseCategory, { message: 'Categoria de despesa inválida.' })
  @IsNotEmpty({ message: 'Categoria é obrigatória.' })
  category!: ExpenseCategory;

  @IsEnum(ExpenseType, { message: 'Tipo de despesa inválido.' })
  @IsOptional()
  expenseType?: ExpenseType;

  @IsNumber({}, { message: 'Valor deve ser um número.' })
  @Min(0.01, { message: 'O valor da despesa deve ser maior que zero.' })
  amount!: number;

  @IsISO8601({}, { message: 'Data de vencimento deve estar no formato ISO8601 (YYYY-MM-DD).' })
  @IsNotEmpty({ message: 'Data de vencimento é obrigatória.' })
  dueDate!: string;

  @IsISO8601({}, { message: 'Data de competência deve estar no formato ISO8601 (YYYY-MM-DD).' })
  @IsNotEmpty({ message: 'Mês/Data de competência é obrigatória.' })
  competenceDate!: string;

  @IsString({ message: 'ID do fornecedor deve ser texto.' })
  @IsOptional()
  supplierId?: string;

  @IsString({ message: 'Nome do favorecido/credor deve ser texto.' })
  @IsOptional()
  beneficiaryName?: string;

  @IsString({ message: 'Código de barras / PIX deve ser texto.' })
  @IsOptional()
  barcode?: string;

  @IsString({ message: 'Número do documento/fatura deve ser texto.' })
  @IsOptional()
  documentNumber?: string;

  @IsBoolean({ message: 'Recorrência deve ser verdadeiro ou falso.' })
  @IsOptional()
  isRecurring?: boolean;

  @IsString({ message: 'Intervalo de recorrência deve ser texto.' })
  @IsOptional()
  recurrenceInterval?: string;

  @IsISO8601({}, { message: 'Data de término da recorrência deve ser ISO8601.' })
  @IsOptional()
  recurrenceEndDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(PaymentMethod, { message: 'Método de pagamento inválido.' })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsEnum(PaymentStatus, { message: 'Status de pagamento inválido.' })
  @IsOptional()
  status?: PaymentStatus;

  @IsISO8601({}, { message: 'Data de pagamento deve ser ISO8601.' })
  @IsOptional()
  paidAt?: string;
}
