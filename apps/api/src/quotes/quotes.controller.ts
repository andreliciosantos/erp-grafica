import {
  Controller,
  Get,
  Post,
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
import { WorkOrder, Quote } from '@erp/database';
import {
  QuotesService,
  QuoteWithDetails,
  PaginatedQuotesResponse,
} from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QuoteStatus, Role } from '@erp/shared-types';

@ApiTags('Orçamentos Técnicos')
@ApiBearerAuth('JWT-auth')
@Controller('quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Calcular e criar orçamento técnico gráfico',
    description: 'Processa as dimensões do produto aberto, calcula o aproveitamento em folha gráfica (imposição e corte), consumo de papel, chapas CTP, tinta CMYK, acabamentos e aplica a margem de markup informada.',
  })
  @ApiResponse({ status: 201, description: 'Orçamento calculado e gerado com sucesso com detalhamento técnico por item.' })
  @ApiBadRequestResponse({ description: 'Parâmetros de cálculo inválidos ou matéria-prima não encontrada.' })
  @ApiForbiddenResponse({ description: 'Acesso negado para o perfil do usuário.' })
  create(
    @Body() dto: CreateQuoteDto,
    @CurrentUser() user: { id: string },
  ): Promise<QuoteWithDetails> {
    return this.quotesService.create(dto, user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Listar orçamentos com paginação e filtro de status',
    description: 'Retorna a lista de propostas comerciais emitidas, com filtro opcional por DRAFT, SENT, APPROVED, REJECTED, EXPIRED.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Itens por página' })
  @ApiQuery({ name: 'status', required: false, enum: QuoteStatus, description: 'Filtrar por status do orçamento' })
  @ApiResponse({ status: 200, description: 'Lista de orçamentos retornada com sucesso.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: QuoteStatus,
  ): Promise<PaginatedQuotesResponse> {
    return this.quotesService.findAll(page, limit, status);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Consultar orçamento completo por ID',
    description: 'Retorna o orçamento com todas as métricas gráficas calculadas: rendimento por folha, folhas gastas, custo de papel, custo de máquina e total geral.',
  })
  @ApiParam({ name: 'id', description: 'ID único do orçamento (CUID)' })
  @ApiResponse({ status: 200, description: 'Orçamento encontrado com todos os detalhes de itens.' })
  @ApiNotFoundResponse({ description: 'Orçamento não encontrado.' })
  findOne(@Param('id') id: string): Promise<QuoteWithDetails> {
    return this.quotesService.findOne(id);
  }

  @Post(':id/approve')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Aprovar orçamento e gerar Ordem de Serviço (OS)',
    description: 'Transforma o orçamento aprovado pelo cliente em uma Ordem de Serviço (OS) com suas etapas produtivas (Pré-impressão, Impressão, Acabamento, Expedição) geradas automaticamente.',
  })
  @ApiParam({ name: 'id', description: 'ID único do orçamento (CUID)' })
  @ApiResponse({ status: 201, description: 'Orçamento aprovado e Ordem de Serviço gerada.' })
  @ApiNotFoundResponse({ description: 'Orçamento não encontrado.' })
  @ApiBadRequestResponse({ description: 'Orçamento já foi aprovado ou está cancelado.' })
  approve(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<WorkOrder> {
    return this.quotesService.approve(id, user.id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR)
  @ApiOperation({
    summary: 'Excluir orçamento',
    description: 'Remove o orçamento caso não possua Ordem de Serviço gerada a partir dele.',
  })
  @ApiParam({ name: 'id', description: 'ID único do orçamento (CUID)' })
  @ApiResponse({ status: 200, description: 'Orçamento excluído com sucesso.' })
  @ApiNotFoundResponse({ description: 'Orçamento não encontrado.' })
  @ApiBadRequestResponse({ description: 'Não é possível excluir um orçamento aprovado com OS ativa.' })
  remove(@Param('id') id: string): Promise<Quote> {
    return this.quotesService.remove(id);
  }
}

