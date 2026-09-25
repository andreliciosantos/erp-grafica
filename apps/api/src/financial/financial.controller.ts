import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Financeiro e DRE')
@ApiBearerAuth('JWT-auth')
@Controller('financial')
@UseGuards(JwtAuthGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('dre')
  @ApiOperation({
    summary: 'Demonstração do Resultado do Exercício (DRE Gerencial)',
    description: 'Calcula o DRE estruturado do mês: Faturamento Bruto de OSs, Deduções e Impostos sobre Vendas, Custo dos Produtos Vendidos (CPV - Papel, Máquina e Acabamentos), Lucro Bruto / Margem de Contribuição, Despesas Operacionais (OPEX), EBITDA e Ponto de Equilíbrio (Break-Even em R$).',
  })
  @ApiQuery({ name: 'month', required: false, type: String, example: '2026-09', description: 'Mês de competência (formato YYYY-MM)' })
  @ApiQuery({ name: 'taxRate', required: false, type: Number, example: 6.0, description: 'Alíquota de imposto sobre vendas em % (padrão: 6.0%)' })
  @ApiResponse({ status: 200, description: 'Relatório hierárquico do DRE consolidado.' })
  getDre(
    @Query('month') month?: string,
    @Query('taxRate') taxRate?: number,
  ) {
    return this.financialService.getDre(
      month,
      taxRate ? Number(taxRate) : undefined,
    );
  }

  @Get('cash-flow')
  @ApiOperation({
    summary: 'Fluxo de Caixa Mensal e Diário (Realizado vs Projetado)',
    description: 'Gera a curva diária de entradas (Recebíveis quitados vs pendentes) e saídas (Despesas quitadas vs a vencer), calculando o saldo líquido diário e a evolução do saldo acumulado.',
  })
  @ApiQuery({ name: 'month', required: false, type: String, example: '2026-09', description: 'Mês de competência (formato YYYY-MM)' })
  @ApiResponse({ status: 200, description: 'Resumo e gráfico dia a dia do fluxo de caixa.' })
  getCashFlow(@Query('month') month?: string) {
    return this.financialService.getCashFlow(month);
  }
}
