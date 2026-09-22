import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateDirectOrderDto {
  @IsString({ message: 'Cliente é obrigatório.' })
  @IsNotEmpty({ message: 'Cliente é obrigatório.' })
  partyId!: string;

  @IsString({ message: 'Descrição do produto é obrigatória.' })
  @IsNotEmpty({ message: 'Descrição do produto é obrigatória.' })
  productName!: string;

  @IsNumber({}, { message: 'Quantidade deve ser um número.' })
  @Min(1, { message: 'Quantidade deve ser de no mínimo 1.' })
  quantity!: number;

  @IsNumber({}, { message: 'Prioridade deve ser um número de 1 a 4.' })
  @IsOptional()
  priority?: number;

  @IsNumber({}, { message: 'Prazo de entrega (dias) deve ser um número.' })
  @IsOptional()
  deliveryDays?: number;

  @IsNumber({}, { message: 'Valor total deve ser um número.' })
  @Min(0, { message: 'Valor total não pode ser negativo.' })
  totalAmount!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
