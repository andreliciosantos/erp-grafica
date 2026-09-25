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
import {
  OperatingExpensesService,
  PaginatedExpensesResponse,
} from './operating-expenses.service';
import { CreateOperatingExpenseDto } from './dto/create-operating-expense.dto';
import { UpdateOperatingExpenseDto } from './dto/update-operating-expense.dto';
import { PayExpenseDto } from './dto/pay-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  Role,
  ExpenseCategory,
  ExpenseType,
  PaymentStatus,
  OperatingExpenseItem,
  OperatingExpensesSummaryDto,
} from '@erp/shared-types';

@ApiTags('Despesas Operacionais')
@ApiBearerAuth('JWT-auth')
@Controller('operating-expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OperatingExpensesController {
  constructor(
    private readonly operatingExpensesService: OperatingExpensesService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.FINANCIAL)
  @ApiOperation({
    summary: 'Cadastrar nova despesa operacional (OPEX)',
    description: 'Cadastra despesas fixas ou variáveis (aluguel, energia, licenças de software, folha, manutenção) com data de vencimento e competência.',
  })
  @ApiResponse({ status: 201, description: 'Despesa cadastrada com sucesso.' })
  @ApiBadRequestResponse({ description: 'Dados da despesa inválidos.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito aos perfis ADMIN e FINANCIAL.' })
  create(@Body() dto: CreateOperatingExpenseDto): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.create(dto);
  }

  @Get('summary')
  @Roles(Role.ADMIN, Role.FINANCIAL, Role.COMMERCIAL)
  @ApiOperation({
    summary: 'Obter resumo consolidado de despesas operacionais do mês',
    description: 'Retorna total gasto, total pendente, despesas vencidas e rateio percentual por categoria de custo.',
  })
  @ApiQuery({ name: 'competenceMonth', required: false, type: String, example: '2026-09', description: 'Mês de competência (YYYY-MM)' })
  @ApiResponse({ status: 200, description: 'Resumo consolidado de despesas.' })
  getSummary(
    @Query('competenceMonth') competenceMonth?: string,
  ): Promise<OperatingExpensesSummaryDto> {
    return this.operatingExpensesService.getSummary(competenceMonth);
  }

  @Get()
  @Roles(Role.ADMIN, Role.FINANCIAL, Role.COMMERCIAL)
  @ApiOperation({
    summary: 'Listar despesas operacionais com filtros avançados',
    description: 'Permite filtrar despesas por competência, categoria, tipo (FIXED / VARIABLE), status de quitação ou busca textual por fornecedor/descrição.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Itens por página' })
  @ApiQuery({ name: 'competenceMonth', required: false, type: String, example: '2026-09', description: 'Mês de competência (YYYY-MM)' })
  @ApiQuery({ name: 'category', required: false, enum: ExpenseCategory, description: 'Categoria de despesa' })
  @ApiQuery({ name: 'expenseType', required: false, enum: ExpenseType, description: 'Tipo: FIXED ou VARIABLE' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus, description: 'Status de quitação' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Busca por descrição ou fornecedor' })
  @ApiResponse({ status: 200, description: 'Lista paginada de despesas operacionais.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('competenceMonth') competenceMonth?: string,
    @Query('category') category?: ExpenseCategory,
    @Query('expenseType') expenseType?: ExpenseType,
    @Query('status') status?: PaymentStatus,
    @Query('search') search?: string,
  ): Promise<PaginatedExpensesResponse> {
    return this.operatingExpensesService.findAll(
      page,
      limit,
      competenceMonth,
      category,
      expenseType,
      status,
      search,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.FINANCIAL, Role.COMMERCIAL)
  @ApiOperation({
    summary: 'Buscar detalhes de uma despesa operacional',
    description: 'Retorna a fatura, código de barras, fornecedor vinculado e histórico de pagamento.',
  })
  @ApiParam({ name: 'id', description: 'ID único da despesa (CUID)' })
  @ApiResponse({ status: 200, description: 'Despesa encontrada.' })
  @ApiNotFoundResponse({ description: 'Despesa não encontrada.' })
  findOne(@Param('id') id: string): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.FINANCIAL)
  @ApiOperation({
    summary: 'Atualizar despesa operacional',
    description: 'Permite alterar valores, datas de vencimento ou categoria de uma despesa pendente.',
  })
  @ApiParam({ name: 'id', description: 'ID único da despesa (CUID)' })
  @ApiResponse({ status: 200, description: 'Despesa atualizada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Despesa não encontrada.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito aos perfis ADMIN e FINANCIAL.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOperatingExpenseDto,
  ): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.update(id, dto);
  }

  @Patch(':id/pay')
  @Roles(Role.ADMIN, Role.FINANCIAL)
  @ApiOperation({
    summary: 'Baixar / Liquidar pagamento de despesa operacional',
    description: 'Registra a saída financeira da conta da gráfica com método de pagamento e data efetiva de pagamento.',
  })
  @ApiParam({ name: 'id', description: 'ID único da despesa (CUID)' })
  @ApiResponse({ status: 200, description: 'Despesa liquidada com sucesso.' })
  @ApiNotFoundResponse({ description: 'Despesa não encontrada.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito aos perfis ADMIN e FINANCIAL.' })
  pay(
    @Param('id') id: string,
    @Body() dto: PayExpenseDto,
  ): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.pay(id, dto);
  }

  @Post(':id/duplicate')
  @Roles(Role.ADMIN, Role.FINANCIAL)
  @ApiOperation({
    summary: 'Duplicar despesa fixa para a próxima competência mensal',
    description: 'Clona uma despesa recorrente (ex: Aluguel do galpão, Internet, Software CTP) para o mês seguinte com vencimento recalculado.',
  })
  @ApiParam({ name: 'id', description: 'ID único da despesa de origem (CUID)' })
  @ApiResponse({ status: 201, description: 'Despesa duplicada para o próximo mês com sucesso.' })
  @ApiNotFoundResponse({ description: 'Despesa original não encontrada.' })
  duplicateNextMonth(@Param('id') id: string): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.duplicateNextMonth(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.FINANCIAL)
  @ApiOperation({
    summary: 'Excluir despesa operacional',
    description: 'Remove a despesa do sistema caso esteja pendente.',
  })
  @ApiParam({ name: 'id', description: 'ID único da despesa (CUID)' })
  @ApiResponse({ status: 200, description: 'Despesa removida com sucesso.' })
  @ApiNotFoundResponse({ description: 'Despesa não encontrada.' })
  @ApiForbiddenResponse({ description: 'Acesso restrito aos perfis ADMIN e FINANCIAL.' })
  remove(@Param('id') id: string): Promise<OperatingExpenseItem> {
    return this.operatingExpensesService.remove(id);
  }
}
