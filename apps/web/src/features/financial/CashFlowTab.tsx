import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { StatCard } from '../../components/common/StatCard';
import { formatCurrency } from '../../lib/utils';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { CashFlowSummaryDto } from '@erp/shared-types';

interface CashFlowTabProps {
  month: string;
}

export const CashFlowTab: React.FC<CashFlowTabProps> = ({ month }) => {
  const { data: cashFlow, isLoading } = useQuery<CashFlowSummaryDto>({
    queryKey: ['cash-flow', month],
    queryFn: async () => {
      const res = await api.get(`/financial/cash-flow?month=${month}`);
      return res.data;
    },
  });

  const isNetPositive = (cashFlow?.netCashFlow || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Entradas (Recebimentos)"
          value={formatCurrency(cashFlow?.totalInflows || 0)}
          subtitle={`Realizado: ${formatCurrency(cashFlow?.realizedInflows || 0)} | Previsto: ${formatCurrency(cashFlow?.projectedInflows || 0)}`}
          icon={<ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Total de Saídas (Pagamentos)"
          value={formatCurrency(cashFlow?.totalOutflows || 0)}
          subtitle={`Pago: ${formatCurrency(cashFlow?.realizedOutflows || 0)} | A Pagar: ${formatCurrency(cashFlow?.projectedOutflows || 0)}`}
          icon={<ArrowUpRight className="w-5 h-5 text-rose-500 dark:text-rose-400" />}
        />
        <StatCard
          title="Resultado Líquido do Mês"
          value={formatCurrency(cashFlow?.netCashFlow || 0)}
          subtitle={
            isNetPositive
              ? 'Superávit operacional de caixa'
              : 'Déficit (necessidade de capital de giro)'
          }
          icon={
            isNetPositive ? (
              <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            )
          }
        />
        <StatCard
          title="Saldo Acumulado no Fim do Mês"
          value={formatCurrency(
            cashFlow?.days && cashFlow.days.length > 0
              ? cashFlow.days[cashFlow.days.length - 1].accumulatedBalance
              : 0
          )}
          subtitle="Posição projetada de fechamento"
          icon={<Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        />
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Movimentação Diária de Caixa — {month}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Demonstração detalhada de entradas e saídas realizadas e previstas por dia
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4 text-right">Entradas Realizadas</th>
                <th className="py-3 px-4 text-right">Entradas Previstas</th>
                <th className="py-3 px-4 text-right">Saídas Pagas</th>
                <th className="py-3 px-4 text-right">Saídas Previstas</th>
                <th className="py-3 px-4 text-right">Resultado do Dia</th>
                <th className="py-3 px-4 text-right">Saldo Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    Carregando fluxo de caixa...
                  </td>
                </tr>
              ) : !cashFlow || cashFlow.days.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    Nenhuma movimentação de caixa encontrada para este período.
                  </td>
                </tr>
              ) : (
                cashFlow.days.map((day) => {
                  const hasMovement = day.inflows > 0 || day.outflows > 0;
                  const isDayPositive = day.netBalance >= 0;
                  const isAccPositive = day.accumulatedBalance >= 0;

                  return (
                    <tr
                      key={day.date}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors ${
                        !hasMovement ? 'opacity-60 text-slate-400' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-800 dark:text-slate-200">
                        {day.date.split('-')[2]}/{day.date.split('-')[1]}
                      </td>
                      <td className="py-2.5 px-4 text-right text-emerald-700 dark:text-emerald-400">
                        {day.realizedInflows > 0 ? formatCurrency(day.realizedInflows) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-teal-600/80 dark:text-teal-400/80">
                        {day.projectedInflows > 0 ? formatCurrency(day.projectedInflows) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-rose-700 dark:text-rose-400">
                        {day.realizedOutflows > 0 ? formatCurrency(day.realizedOutflows) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-amber-600/80 dark:text-amber-400/80">
                        {day.projectedOutflows > 0 ? formatCurrency(day.projectedOutflows) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        <span
                          className={
                            day.netBalance === 0
                              ? 'text-slate-400'
                              : isDayPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {day.netBalance !== 0 ? formatCurrency(day.netBalance) : '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        <span
                          className={
                            isAccPositive
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {formatCurrency(day.accumulatedBalance)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
