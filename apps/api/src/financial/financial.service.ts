import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExpenseCategory,
  DreMonthlyReportDto,
  DreSectionItem,
  CashFlowSummaryDto,
  CashFlowDayDto,
} from '@erp/shared-types';
import { CATEGORY_LABELS } from '../operating-expenses/operating-expenses.service';

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDre(month?: string, taxRatePercentParam?: number): Promise<DreMonthlyReportDto> {
    const targetMonth = month || new Date().toISOString().substring(0, 7); // YYYY-MM
    const [yearStr, monthStr] = targetMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);

    const startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

    const taxRatePercent = taxRatePercentParam !== undefined && !isNaN(taxRatePercentParam)
      ? taxRatePercentParam
      : 6.0;

    // 1. Fetch Work Orders for the competence month
    const workOrders = await this.prisma.workOrder.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        quote: {
          include: {
            items: true,
          },
        },
      },
    });

    let grossRevenue = 0;
    let paperCost = 0;
    let printingMachineCost = 0;
    let finishingCost = 0;

    workOrders.forEach((wo) => {
      grossRevenue += Number(wo.totalAmount);

      if (wo.quote?.items) {
        wo.quote.items.forEach((item) => {
          paperCost += Number(item.paperCostCalculated || 0);
          printingMachineCost += Number(item.machineCostTotal || 0);
          finishingCost += Number(item.finishingCostTotal || 0);
        });
      }
    });

    // 2. Fetch Operating Expenses for the competence month
    const expenses = await this.prisma.operatingExpense.findMany({
      where: {
        competenceDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    let opexTotal = 0;
    const opexByCategoryMap: Record<ExpenseCategory, number> = {
      RENT_FACILITIES: 0,
      UTILITIES: 0,
      SOFTWARE_LICENSES: 0,
      OFFICE_ADMINISTRATIVE: 0,
      COMMERCIAL_MARKETING: 0,
      MAINTENANCE_PREDIAL: 0,
      FINANCIAL_TAXES: 0,
      OTHER: 0,
    };

    expenses.forEach((exp) => {
      const val = Number(exp.amount);
      opexTotal += val;
      if (opexByCategoryMap[exp.category as ExpenseCategory] !== undefined) {
        opexByCategoryMap[exp.category as ExpenseCategory] += val;
      } else {
        opexByCategoryMap.OTHER += val;
      }
    });

    // 3. Accounting Computations
    const taxDeductions = Number(((grossRevenue * taxRatePercent) / 100).toFixed(2));
    const netRevenue = Number((grossRevenue - taxDeductions).toFixed(2));
    const cpvTotal = Number((paperCost + printingMachineCost + finishingCost).toFixed(2));
    const grossProfit = Number((netRevenue - cpvTotal).toFixed(2));
    const grossMarginPercent = netRevenue > 0
      ? Number(((grossProfit / netRevenue) * 100).toFixed(2))
      : 0;

    const ebitda = Number((grossProfit - opexTotal).toFixed(2));
    const ebitdaMarginPercent = netRevenue > 0
      ? Number(((ebitda / netRevenue) * 100).toFixed(2))
      : 0;

    // Break-even point (Ponto de Equilíbrio em R$): OPEX / Margem de Contribuição %
    const breakEvenPoint = grossMarginPercent > 0
      ? Number(((opexTotal / (grossMarginPercent / 100))).toFixed(2))
      : 0;

    const opexBreakdown = Object.entries(opexByCategoryMap).map(([cat, amount]) => ({
      category: cat as ExpenseCategory,
      label: CATEGORY_LABELS[cat as ExpenseCategory] || cat,
      amount: Number(amount.toFixed(2)),
    }));

    // 4. Structured Accounting Sections (DRE Hierárquico)
    const baseCalcRevenue = netRevenue > 0 ? netRevenue : 1;

    const sections: DreSectionItem[] = [
      {
        code: '1.0',
        name: 'RECEITA OPERACIONAL BRUTA',
        amount: Number(grossRevenue.toFixed(2)),
        percentageOfRevenue: Number(((grossRevenue / baseCalcRevenue) * 100).toFixed(2)),
        isTotal: false,
        type: 'REVENUE',
        children: [
          {
            name: `Faturamento de Ordens de Serviço (${workOrders.length} OS)`,
            amount: Number(grossRevenue.toFixed(2)),
            percentage: 100,
          },
        ],
      },
      {
        code: '1.1',
        name: `(-) Deduções e Impostos sobre Vendas (${taxRatePercent.toFixed(1)}%)`,
        amount: taxDeductions,
        percentageOfRevenue: Number(((taxDeductions / baseCalcRevenue) * 100).toFixed(2)),
        isTotal: false,
        type: 'DEDUCTION',
        children: [
          {
            name: 'Simples Nacional / Tributos Incidentes',
            amount: taxDeductions,
            percentage: 100,
          },
        ],
      },
      {
        code: '2.0',
        name: '(=) RECEITA OPERACIONAL LÍQUIDA',
        amount: netRevenue,
        percentageOfRevenue: 100,
        isTotal: true,
        type: 'REVENUE',
      },
      {
        code: '3.0',
        name: '(-) CUSTO DOS PRODUTOS VENDIDOS (CPV)',
        amount: cpvTotal,
        percentageOfRevenue: Number(((cpvTotal / baseCalcRevenue) * 100).toFixed(2)),
        isTotal: false,
        type: 'CPV',
        children: [
          {
            name: 'Papéis e Substratos Planos',
            amount: Number(paperCost.toFixed(2)),
            percentage: cpvTotal > 0 ? Number(((paperCost / cpvTotal) * 100).toFixed(1)) : 0,
          },
          {
            name: 'Hora-Máquina de Impressão e Setup',
            amount: Number(printingMachineCost.toFixed(2)),
            percentage: cpvTotal > 0 ? Number(((printingMachineCost / cpvTotal) * 100).toFixed(1)) : 0,
          },
          {
            name: 'Acabamentos e Serviços de Terceiros',
            amount: Number(finishingCost.toFixed(2)),
            percentage: cpvTotal > 0 ? Number(((finishingCost / cpvTotal) * 100).toFixed(1)) : 0,
          },
        ],
      },
      {
        code: '4.0',
        name: '(=) LUCRO BRUTO (MARGEM DE CONTRIBUIÇÃO)',
        amount: grossProfit,
        percentageOfRevenue: grossMarginPercent,
        isTotal: true,
        type: 'RESULT',
      },
      {
        code: '5.0',
        name: '(-) DESPESAS OPERACIONAIS (OPEX)',
        amount: Number(opexTotal.toFixed(2)),
        percentageOfRevenue: Number(((opexTotal / baseCalcRevenue) * 100).toFixed(2)),
        isTotal: false,
        type: 'OPEX',
        children: opexBreakdown.filter((o) => o.amount > 0).map((o) => ({
          name: o.label,
          amount: o.amount,
          percentage: opexTotal > 0 ? Number(((o.amount / opexTotal) * 100).toFixed(1)) : 0,
        })),
      },
      {
        code: '6.0',
        name: '(=) RESULTADO OPERACIONAL (EBITDA)',
        amount: ebitda,
        percentageOfRevenue: ebitdaMarginPercent,
        isTotal: true,
        type: 'RESULT',
      },
    ];

    return {
      competenceMonth: targetMonth,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      taxRatePercent,
      taxDeductions,
      netRevenue,
      cpvTotal,
      cpvBreakdown: {
        paperCost: Number(paperCost.toFixed(2)),
        printingMachineCost: Number(printingMachineCost.toFixed(2)),
        finishingCost: Number(finishingCost.toFixed(2)),
      },
      grossProfit,
      grossMarginPercent,
      opexTotal: Number(opexTotal.toFixed(2)),
      opexBreakdown,
      ebitda,
      ebitdaMarginPercent,
      breakEvenPoint,
      sections,
    };
  }

  async getCashFlow(month?: string): Promise<CashFlowSummaryDto> {
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    const [yearStr, monthStr] = targetMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);

    const startOfMonth = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    const [receivables, expenses] = await Promise.all([
      this.prisma.receivable.findMany({
        where: {
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      this.prisma.operatingExpense.findMany({
        where: {
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);

    const dailyInflows: Record<number, number> = {};
    const dailyOutflows: Record<number, number> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      dailyInflows[d] = 0;
      dailyOutflows[d] = 0;
    }

    receivables.forEach((r) => {
      const day = new Date(r.dueDate).getUTCDate();
      dailyInflows[day] = (dailyInflows[day] || 0) + Number(r.amount);
    });

    expenses.forEach((e) => {
      const day = new Date(e.dueDate).getUTCDate();
      dailyOutflows[day] = (dailyOutflows[day] || 0) + Number(e.amount);
    });

    let totalInflows = 0;
    let totalOutflows = 0;
    let accumulated = 0;

    const days: CashFlowDayDto[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const inf = dailyInflows[d] || 0;
      const outf = dailyOutflows[d] || 0;
      const net = inf - outf;
      accumulated += net;

      totalInflows += inf;
      totalOutflows += outf;

      const dateStr = `${targetMonth}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        inflows: Number(inf.toFixed(2)),
        outflows: Number(outf.toFixed(2)),
        netBalance: Number(net.toFixed(2)),
        accumulatedBalance: Number(accumulated.toFixed(2)),
      });
    }

    return {
      month: targetMonth,
      totalInflows: Number(totalInflows.toFixed(2)),
      totalOutflows: Number(totalOutflows.toFixed(2)),
      netCashFlow: Number((totalInflows - totalOutflows).toFixed(2)),
      days,
    };
  }
}
