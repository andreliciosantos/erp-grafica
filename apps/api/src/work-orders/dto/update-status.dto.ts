import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkOrderStatus } from '@erp/shared-types';

export class UpdateWorkOrderStatusDto {
  @ApiProperty({
    description: 'Novo status da Ordem de Serviço na máquina de estados',
    enum: WorkOrderStatus,
    example: WorkOrderStatus.PRE_PRESS,
  })
  @IsEnum(WorkOrderStatus, { message: 'Status da Ordem de Serviço inválido.' })
  @IsNotEmpty({ message: 'Novo status é obrigatório.' })
  status!: WorkOrderStatus;
}
