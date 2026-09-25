import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDirectOrderDto {
  @ApiProperty({
    description: 'ID do cliente solicitante (CUID)',
    example: 'cm123client456',
  })
  @IsString({ message: 'Cliente é obrigatório.' })
  @IsNotEmpty({ message: 'Cliente é obrigatório.' })
  partyId!: string;

  @ApiProperty({
    description: 'Descrição ou nome do serviço / produto gráfico',
    example: 'Cartazes A3 em Couchê Brilho 170g 4x0',
  })
  @IsString({ message: 'Descrição do produto é obrigatória.' })
  @IsNotEmpty({ message: 'Descrição do produto é obrigatória.' })
  productName!: string;

  @ApiProperty({
    description: 'Quantidade / tiragem da ordem',
    example: 500,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Quantidade deve ser um número.' })
  @Min(1, { message: 'Quantidade deve ser de no mínimo 1.' })
  quantity!: number;

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
}
