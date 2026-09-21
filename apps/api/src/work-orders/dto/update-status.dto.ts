import { IsEnum, IsNotEmpty } from 'class-validator';
import { WorkOrderStatus } from '@erp/shared-types';

export class UpdateWorkOrderStatusDto {
  @IsEnum(WorkOrderStatus, { message: 'Status da Ordem de Serviço inválido.' })
  @IsNotEmpty({ message: 'Novo status é obrigatório.' })
  status!: WorkOrderStatus;
}
