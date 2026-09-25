import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { WorkOrder, StageExecutionLog } from '@erp/database';
import {
  WorkOrdersService,
  PaginatedWorkOrdersResponse,
  WorkOrderFullDetails,
} from './work-orders.service';
import { UpdateWorkOrderStatusDto } from './dto/update-status.dto';
import { StageActionDto } from './dto/stage-action.dto';
import { CreateDirectOrderDto } from './dto/create-direct-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkOrderStatus, Role } from '@erp/shared-types';

@ApiTags('Ordens de Serviço')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get('work-orders')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Listar Ordens de Serviço (Quadro Kanban / Lista)',
    description: 'Retorna a lista paginada de Ordens de Serviço, com filtro por status produtivo (PENDING, PRE_PRESS, PRINTING, FINISHING, QUALITY_CONTROL, READY_FOR_PICKUP, DISPATCHED, DELIVERED, CANCELLED) e busca por número da OS ou cliente.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Quantidade por página' })
  @ApiQuery({ name: 'status', required: false, enum: WorkOrderStatus, description: 'Filtrar por etapa do fluxo produtivo' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'OS-2026', description: 'Número da OS ou nome do cliente' })
  @ApiResponse({ status: 200, description: 'Lista de Ordens de Serviço retornada com sucesso.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: WorkOrderStatus,
    @Query('search') search?: string,
  ): Promise<PaginatedWorkOrdersResponse> {
    return this.workOrdersService.findAll(page, limit, status, search);
  }

  @Post('work-orders')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Criar Ordem de Serviço direta (Balcão / Pedido Rápido)',
    description: 'Cria uma OS imediata sem necessidade prévia de cálculo de orçamento, gerando automaticamente a esteira de etapas padrão.',
  })
  @ApiResponse({ status: 201, description: 'Ordem de Serviço criada com sucesso.' })
  @ApiBadRequestResponse({ description: 'Dados do pedido direto inválidos.' })
  createDirect(
    @Body() dto: CreateDirectOrderDto,
    @CurrentUser() user: { id: string },
  ): Promise<WorkOrder> {
    return this.workOrdersService.createDirect(dto, user.id);
  }

  @Get('work-orders/:id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Consultar detalhes completos da Ordem de Serviço',
    description: 'Retorna os dados da OS, itens de produto, etapas produtivas geradas, logs de execução de operadores e faturamento vinculado.',
  })
  @ApiParam({ name: 'id', description: 'ID único da Ordem de Serviço (CUID)' })
  @ApiResponse({ status: 200, description: 'Ordem de Serviço encontrada.' })
  @ApiNotFoundResponse({ description: 'Ordem de Serviço não encontrada.' })
  findOne(@Param('id') id: string): Promise<WorkOrderFullDetails> {
    return this.workOrdersService.findOne(id);
  }

  @Patch('work-orders/:id/status')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Avançar status da Ordem de Serviço (Máquina de Estados)',
    description: 'Avança o status da OS respeitando a ordem produtiva e validações: ao entrar em PRINTING, efetua baixa automática do estoque de papel; ao cancelar, estorna o estoque reservado. Saltos ilegais disparam 400 Bad Request.',
  })
  @ApiParam({ name: 'id', description: 'ID único da Ordem de Serviço (CUID)' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso e regras de estoque executadas.' })
  @ApiBadRequestResponse({ description: 'Transição ilegal de status ou estoque de papel insuficiente.' })
  @ApiNotFoundResponse({ description: 'Ordem de Serviço não encontrada.' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
  ): Promise<WorkOrder> {
    return this.workOrdersService.updateStatus(id, dto.status);
  }

  @Put('work-orders/:id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Atualizar informações da Ordem de Serviço',
    description: 'Permite alterar observações, prioridade ou data de entrega prometida ao cliente.',
  })
  @ApiParam({ name: 'id', description: 'ID único da Ordem de Serviço (CUID)' })
  @ApiResponse({ status: 200, description: 'Ordem de Serviço atualizada.' })
  @ApiNotFoundResponse({ description: 'Ordem de Serviço não encontrada.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderDto,
  ): Promise<WorkOrder> {
    return this.workOrdersService.update(id, dto);
  }

  @Delete('work-orders/:id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Cancelar / Excluir Ordem de Serviço',
    description: 'Cancela a OS, atualiza o status para CANCELLED e realiza o estorno de materiais baixados no estoque.',
  })
  @ApiParam({ name: 'id', description: 'ID único da Ordem de Serviço (CUID)' })
  @ApiResponse({ status: 200, description: 'Ordem de Serviço removida/cancelada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Ordem de Serviço não encontrada.' })
  remove(@Param('id') id: string): Promise<WorkOrder> {
    return this.workOrdersService.remove(id);
  }

  @Post('stages/:stageId/action')
  @Roles(Role.ADMIN, Role.OPERATOR)
  @ApiTags('Chão de Fábrica - Apontamentos')
  @ApiOperation({
    summary: 'Apontamento de chão de fábrica (START, PAUSE, COMPLETE)',
    description: 'Registra a atuação do operador na etapa produtiva (Impressão, Dobra, Plastificação, etc.), calculando o tempo real de máquina e registrando perdas técnicas (refugo) para apropriação de custos.',
  })
  @ApiParam({ name: 'stageId', description: 'ID único da etapa da OS (CUID)' })
  @ApiResponse({ status: 201, description: 'Ação apontada com sucesso e log de execução gerado.' })
  @ApiNotFoundResponse({ description: 'Etapa não encontrada.' })
  @ApiBadRequestResponse({ description: 'Transição ilegal de etapa ou operador inválido.' })
  executeStageAction(
    @Param('stageId') stageId: string,
    @Body() dto: StageActionDto,
  ): Promise<StageExecutionLog | { message: string }> {
    return this.workOrdersService.executeStageAction(stageId, dto);
  }
}

