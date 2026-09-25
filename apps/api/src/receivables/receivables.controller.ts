import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ReceivablesService } from './receivables.service';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { UpdateReceivableDto } from './dto/update-receivable.dto';
import { PayReceivableDto } from './dto/pay-receivable.dto';
import { GenerateOrderInstallmentsDto } from './dto/generate-order-installments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentStatus } from '@erp/shared-types';

@ApiTags('Contas a Receber')
@ApiBearerAuth('JWT-auth')
@Controller('receivables')
@UseGuards(JwtAuthGuard)
export class ReceivablesController {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar título a receber avulso',
    description: 'Cadastra uma conta a receber avulsa com cliente, descrição, valor e data de vencimento.',
  })
  @ApiResponse({ status: 201, description: 'Título a receber criado com sucesso.' })
  @ApiBadRequestResponse({ description: 'Dados do título inválidos.' })
  create(@Body() dto: CreateReceivableDto) {
    return this.receivablesService.create(dto);
  }

  @Post('generate-for-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Gerar parcelamento automático para Ordem de Serviço',
    description: 'Calcula e cria os títulos a receber vinculados a uma OS com base no plano escolhido (FULL_ADVANCE, HALF_DOWN_HALF_PICKUP ou CUSTOM_INSTALLMENTS em até 12x).',
  })
  @ApiResponse({ status: 201, description: 'Parcelas geradas e vinculadas à OS com sucesso.' })
  @ApiBadRequestResponse({ description: 'Plano inválido ou parcelamento já existente para esta OS.' })
  generateForOrder(@Body() dto: GenerateOrderInstallmentsDto) {
    return this.receivablesService.generateForOrder(dto);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Obter resumo de recebíveis do mês',
    description: 'Retorna os totais consolidados: montante total, valor já recebido, valor pendente a receber e valor vencido (inadimplência).',
  })
  @ApiQuery({ name: 'month', required: false, type: String, example: '2026-09', description: 'Mês de competência (YYYY-MM)' })
  @ApiResponse({ status: 200, description: 'Resumo financeiro de recebíveis.' })
  getSummary(@Query('month') month?: string) {
    return this.receivablesService.getSummary(month);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar contas a receber com múltiplos filtros',
    description: 'Consulta títulos a receber com filtros por status de pagamento (PENDING, PAID, OVERDUE), cliente, Ordem de Serviço, mês de vencimento ou busca textual.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Itens por página' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus, description: 'Status do título' })
  @ApiQuery({ name: 'partyId', required: false, type: String, description: 'Filtrar por cliente (CUID)' })
  @ApiQuery({ name: 'workOrderId', required: false, type: String, description: 'Filtrar por OS (CUID)' })
  @ApiQuery({ name: 'month', required: false, type: String, example: '2026-09', description: 'Mês de vencimento (YYYY-MM)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Busca por descrição ou cliente' })
  @ApiResponse({ status: 200, description: 'Lista paginada de títulos a receber.' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PaymentStatus,
    @Query('partyId') partyId?: string,
    @Query('workOrderId') workOrderId?: string,
    @Query('month') month?: string,
    @Query('search') search?: string,
  ) {
    return this.receivablesService.findAll({
      page,
      limit,
      status,
      partyId,
      workOrderId,
      month,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar título a receber por ID',
    description: 'Retorna os detalhes do título, incluindo histórico de pagamentos, cliente e dados da OS associada.',
  })
  @ApiParam({ name: 'id', description: 'ID único do recebível (CUID)' })
  @ApiResponse({ status: 200, description: 'Título encontrado.' })
  @ApiNotFoundResponse({ description: 'Título não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.receivablesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar informações de um título a receber',
    description: 'Permite alterar a data de vencimento, valor ou observações de um título pendente.',
  })
  @ApiParam({ name: 'id', description: 'ID único do recebível (CUID)' })
  @ApiResponse({ status: 200, description: 'Título atualizado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Título não encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateReceivableDto) {
    return this.receivablesService.update(id, dto);
  }

  @Patch(':id/pay')
  @ApiOperation({
    summary: 'Baixar / Liquidar título a receber',
    description: 'Registra a liquidação do título com método de pagamento (PIX, Boleto, Cartão, Dinheiro), data efetiva, descontos concedidos ou acréscimos aplicados.',
  })
  @ApiParam({ name: 'id', description: 'ID único do recebível (CUID)' })
  @ApiResponse({ status: 200, description: 'Título quitado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Título não encontrado.' })
  @ApiBadRequestResponse({ description: 'Título já liquidado ou dados de pagamento inválidos.' })
  pay(@Param('id') id: string, @Body() dto: PayReceivableDto) {
    return this.receivablesService.pay(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir / Cancelar título a receber',
    description: 'Cancela o título pendente caso não tenha sido liquidado.',
  })
  @ApiParam({ name: 'id', description: 'ID único do recebível (CUID)' })
  @ApiResponse({ status: 200, description: 'Título cancelado com sucesso.' })
  @ApiNotFoundResponse({ description: 'Título não encontrado.' })
  remove(@Param('id') id: string) {
    return this.receivablesService.remove(id);
  }
}
