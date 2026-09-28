import { IsString, IsNumber, IsOptional, Min, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QuickOrderItemDto {
  @ApiProperty({
    description: 'Nome ou descrição do serviço rápido',
    example: 'Xerox P&B A4',
  })
  @IsString({ message: 'Nome do serviço é obrigatório.' })
  productName!: string;

  @ApiProperty({
    description: 'Quantidade de unidades / cópias',
    example: 10,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Quantidade do item deve ser um número.' })
  @Min(1, { message: 'Quantidade deve ser de no mínimo 1.' })
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Preço unitário do serviço em R$',
    example: 0.5,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Preço unitário deve ser um número.' })
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({
    description: 'Subtotal do item em R$',
    example: 5.0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Subtotal deve ser um número.' })
  @IsOptional()
  itemTotalAmount?: number;
}

export class CreateDirectOrderDto {
  @ApiPropertyOptional({
    description: 'ID do cliente solicitante (CUID). Se omitido, vincula automaticamente a Cliente Balcão / Consumidor Final.',
    example: 'cm123client456',
  })
  @IsString({ message: 'ID do cliente deve ser texto.' })
  @IsOptional()
  partyId?: string;

  @ApiPropertyOptional({
    description: 'Descrição ou nome do serviço / produto gráfico',
    example: 'Cartazes A3 em Couchê Brilho 170g 4x0',
  })
  @IsString({ message: 'Descrição do produto deve ser texto.' })
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional({
    description: 'Quantidade / tiragem da ordem',
    example: 500,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Quantidade deve ser um número.' })
  @Min(1, { message: 'Quantidade deve ser de no mínimo 1.' })
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Nível de prioridade da produção (1: Baixa, 2: Normal, 3: Alta, 4: Urgente)',
    example: 2,
    default: 2,
  })
  @IsNumber({}, { message: 'Prioridade deve ser um número de 1 a 4.' })
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({
    description: 'Prazo estimado de entrega em dias úteis',
    example: 5,
  })
  @IsNumber({}, { message: 'Prazo de entrega (dias) deve ser um número.' })
  @IsOptional()
  deliveryDays?: number;

  @ApiProperty({
    description: 'Valor total negociado do pedido em R$',
    example: 850.0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Valor total deve ser um número.' })
  @Min(0, { message: 'Valor total não pode ser negativo.' })
  totalAmount!: number;

  @ApiPropertyOptional({
    description: 'Instruções e observações de acabamento e entrega',
    example: 'Refilar no formato exato 297x420mm e embalar a cada 50 peças.',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Lista detalhada de serviços rápidos de balcão',
    type: [QuickOrderItemDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QuickOrderItemDto)
  items?: QuickOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Forma de pagamento (PIX, CASH, CREDIT_CARD, DEBIT_CARD, BOLETO)',
    example: 'PIX',
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Status do pagamento (PAID ou PENDING)',
    example: 'PAID',
  })
  @IsString()
  @IsOptional()
  paymentStatus?: string;

  @ApiPropertyOptional({
    description: 'Status inicial da Ordem de Serviço (PENDING, READY_FOR_PICKUP, DELIVERED)',
    example: 'DELIVERED',
  })
  @IsString()
  @IsOptional()
  status?: string;
}
