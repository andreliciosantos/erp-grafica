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

export class GenerateOrderInstallmentsDto {
  @IsNotEmpty({ message: 'O ID da Ordem de Serviço é obrigatório.' })
  @IsString()
  workOrderId!: string;

  @IsNotEmpty({ message: 'O plano de parcelamento é obrigatório.' })
  @IsIn(['FULL_ADVANCE', 'HALF_DOWN_HALF_PICKUP', 'CUSTOM_INSTALLMENTS'])
  plan!: 'FULL_ADVANCE' | 'HALF_DOWN_HALF_PICKUP' | 'CUSTOM_INSTALLMENTS';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  installmentsCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  downPaymentPercent?: number;

  @IsOptional()
  @IsDateString()
  firstDueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  intervalDays?: number;
}
