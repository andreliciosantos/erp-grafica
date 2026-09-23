import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { formatCurrency } from '../../lib/utils';
import {
  TrendingUp,
  Calendar,
  Percent,
  Calculator,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
} from 'lucide-react';
import { DreMonthlyReportDto } from '@erp/shared-types';

export const DrePage: React.FC = () => {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(6.0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    '1.0': true,
    '3.0': true,
    '5.0': true,
  });

  const toggleSection = (code: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const { data: dre, isLoading } = useQuery<DreMonthlyReportDto>({
    queryKey: ['financial-dre', selectedMonth, taxRatePercent],
    queryFn: async () => {
      const res = await api.get(
        `/financial/dre?month=${selectedMonth}&taxRate=${taxRatePercent}`
      );
      return res.data;
    },
  });

  const isProfitable = (dre?.ebitda || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Title & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            DRE Gerencial em Tempo Real
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Demonstrativo do Resultado do Exercício com apuração de CPV, Margem de Contribuição e EBITDA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tax Rate Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
            <Percent className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Alíquota Impostos:</span>
            <input
              type="number"
              step="0.5"
              min="0"
              max="30"
              value={taxRatePercent}
              onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
              className="w-14 text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent border-none focus:outline-hidden text-right"
            />
            <span className="text-xs font-semibold text-slate-400">%</span>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Competência:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none focus:outline-hidden text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Top Indicators Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento Bruto"
          value={formatCurrency(dre?.grossRevenue || 0)}
          subtitle={`Receita Líquida: ${formatCurrency(dre?.netRevenue || 0)}`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Margem de Contribuição"
          value={formatCurrency(dre?.grossProfit || 0)}
          subtitle={`${dre?.grossMarginPercent || 0}% sobre a receita líquida`}
          icon={
            (dre?.grossProfit || 0) >= 0 ? (
              <ArrowUpRight className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            )
          }
        />
        <StatCard
          title="EBITDA (Resultado Operacional)"
          value={formatCurrency(dre?.ebitda || 0)}
          subtitle={`Margem Operacional: ${dre?.ebitdaMarginPercent || 0}%`}
          icon={
            isProfitable ? (
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            )
          }
        />
        <StatCard
          title="Ponto de Equilíbrio (Break-Even)"
          value={formatCurrency(dre?.breakEvenPoint || 0)}
          subtitle="Faturamento mínimo para cobrir despesas"
          icon={<Calculator className="w-5 h-5 text-amber-500 dark:text-amber-400" />}
        />
      </div>

      {/* Multi-segment distribution visual bar */}
      {dre && dre.netRevenue > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Destinação da Receita Líquida do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-3">
            <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden shadow-inner">
              <div
                style={{ width: `${Math.min(100, Math.max(0, (dre.cpvTotal / dre.netRevenue) * 100))}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`CPV: ${formatCurrency(dre.cpvTotal)}`}
              />
              <div
                style={{ width: `${Math.min(100, Math.max(0, (dre.opexTotal / dre.netRevenue) * 100))}%` }}
                className="bg-purple-500 h-full transition-all"
                title={`OPEX: ${formatCurrency(dre.opexTotal)}`}
              />
              {dre.ebitda > 0 && (
                <div
                  style={{ width: `${Math.min(100, (dre.ebitda / dre.netRevenue) * 100)}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Lucro Líquido / EBITDA: ${formatCurrency(dre.ebitda)}`}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Custos Diretos (CPV): <strong>{formatCurrency(dre.cpvTotal)}</strong> ({Math.round((dre.cpvTotal / dre.netRevenue) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Despesas Fixas/Variáveis (OPEX): <strong>{formatCurrency(dre.opexTotal)}</strong> ({Math.round((dre.opexTotal / dre.netRevenue) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>EBITDA / Lucro: <strong>{formatCurrency(dre.ebitda)}</strong> ({dre.ebitdaMarginPercent}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accounting Statement Table (Estrutura DRE) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Demonstração do Resultado — {selectedMonth}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Valores calculados em regime de competência industrial
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            % s/ Receita Líquida
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Carregando dados da DRE...
            </div>
          ) : !dre ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhum dado financeiro encontrado para esta competência.
            </div>
          ) : (
            dre.sections.map((sec) => {
              const hasChildren = Boolean(sec.children && sec.children.length > 0);
              const isExpanded = expandedSections[sec.code];

              // Styling per section type
              let rowBg = 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20';
              let textStyle = 'text-slate-800 dark:text-slate-200 font-medium';
              let amountStyle = 'text-slate-800 dark:text-slate-200 font-semibold';

              if (sec.isTotal) {
                rowBg = 'bg-slate-50/90 dark:bg-slate-950/60 font-bold';
                textStyle = 'text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wide';
                amountStyle = 'text-slate-900 dark:text-slate-100 font-bold text-sm';
              }

              if (sec.type === 'REVENUE' && sec.isTotal) {
                amountStyle = 'text-emerald-700 dark:text-emerald-400 font-bold text-sm';
              } else if (sec.type === 'RESULT' && sec.code === '6.0') {
                rowBg = isProfitable
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30'
                  : 'bg-rose-50/60 dark:bg-rose-950/30';
                amountStyle = isProfitable
                  ? 'text-emerald-700 dark:text-emerald-400 font-extrabold text-base'
                  : 'text-rose-700 dark:text-rose-400 font-extrabold text-base';
              }

              return (
                <div key={sec.code} className="transition-colors">
                  <div
                    onClick={() => hasChildren && toggleSection(sec.code)}
                    className={`flex items-center justify-between py-3.5 px-4 text-xs ${rowBg} ${
                      hasChildren ? 'cursor-pointer select-none' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {hasChildren ? (
                        <span className="p-0.5 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </span>
                      ) : (
                        <span className="w-5" />
                      )}
                      <span className="text-[11px] font-mono text-slate-400">{sec.code}</span>
                      <span className={textStyle}>{sec.name}</span>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="w-16 text-right font-mono text-slate-400 text-[11px]">
                        {sec.percentageOfRevenue.toFixed(1)}%
                      </span>
                      <span className={`w-32 text-right ${amountStyle}`}>
                        {formatCurrency(sec.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Child Items */}
                  {hasChildren && isExpanded && (
                    <div className="bg-slate-50/40 dark:bg-slate-950/20 divide-y divide-slate-100/60 dark:divide-slate-800/40 pl-11 pr-4">
                      {sec.children!.map((child, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 text-xs text-slate-600 dark:text-slate-400"
                        >
                          <span className="truncate pr-4">• {child.name}</span>
                          <div className="flex items-center gap-6 shrink-0">
                            <span className="w-16 text-right font-mono text-[10px] text-slate-400">
                              {child.percentage.toFixed(1)}%
                            </span>
                            <span className="w-32 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                              {formatCurrency(child.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
