import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatDateTime, getStatusConfig, getPriorityConfig } from '../../lib/utils';
import {
  Calculator,
  KanbanSquare,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { WorkOrderItem, QuoteResponseDto, RawMaterialItem, PaginatedResult } from '../../types';

export const DashboardPage: React.FC = () => {
  // Fetch Quotes
  const { data: quotesData } = useQuery<PaginatedResult<QuoteResponseDto>>({
    queryKey: ['quotes-dashboard'],
    queryFn: async () => {
      const res = await api.get('/quotes?limit=100');
      return res.data;
    },
  });

  // Fetch Work Orders
  const { data: ordersData } = useQuery<PaginatedResult<WorkOrderItem>>({
    queryKey: ['work-orders-dashboard'],
    queryFn: async () => {
      const res = await api.get('/work-orders?limit=100');
      return res.data;
    },
  });

  // Fetch Raw Materials to detect low stock
  const { data: materialsData } = useQuery<PaginatedResult<RawMaterialItem>>({
    queryKey: ['materials-dashboard'],
    queryFn: async () => {
      const res = await api.get('/raw-materials?limit=100');
      return res.data;
    },
  });

  const quotes = quotesData?.data || [];
  const orders = ordersData?.data || [];
  const materials = materialsData?.data || [];

  const totalQuotesAmount = quotes.reduce((acc, q) => acc + (Number(q.totalAmount) || 0), 0);
  const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const readyOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP');
  const lowStockMaterials = materials.filter((m) => Number(m.currentStock) <= Number(m.minStock));

  // Count by stage for funnel
  const stagesCount = {
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    PRE_PRESS: orders.filter((o) => o.status === 'PRE_PRESS').length,
    PRINTING: orders.filter((o) => o.status === 'PRINTING').length,
    FINISHING: orders.filter((o) => o.status === 'FINISHING').length,
    QUALITY_CONTROL: orders.filter((o) => o.status === 'QUALITY_CONTROL').length,
    READY_FOR_PICKUP: orders.filter((o) => o.status === 'READY_FOR_PICKUP').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Visão Geral da Produção</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoramento em tempo real de orçamentos, estoque e ordens de serviço
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/quotes/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Novo Orçamento
            </Button>
          </Link>
          <Link to="/work-orders">
            <Button variant="outline" size="sm">
              <KanbanSquare className="w-4 h-4" />
              Quadro de Produção
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Volume Cotado"
          value={formatCurrency(totalQuotesAmount)}
          subtitle={`${quotes.length} orçamentos gerados`}
          icon={<Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          trend={{ value: '12% este mês', positive: true }}
        />
        <StatCard
          title="Em Produção Ativa"
          value={`${activeOrders.length} OS`}
          subtitle="Em etapas industriais"
          icon={<KanbanSquare className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />}
        />
        <StatCard
          title="Prontos p/ Retirada"
          value={`${readyOrders.length} OS`}
          subtitle="Aguardando entrega/cliente"
          icon={<CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />}
        />
        <StatCard
          title="Insumos em Alerta"
          value={`${lowStockMaterials.length} itens`}
          subtitle="Estoque no limite mínimo"
          icon={<AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />}
        />
      </div>

      {/* Production Pipeline Progress */}
      <Card>
        <CardHeader>
          <CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Distribuição do Chão de Fábrica por Etapa
          </CardTitle>
          <Link to="/work-orders" className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 font-medium">
            Ver no Kanban <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stagesCount).map(([stage, count]) => {
              const config = getStatusConfig(stage);
              return (
                <div
                  key={stage}
                  className="rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-3 flex flex-col justify-between shadow-xs"
                >
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{config.label}</p>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">OS ativas</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço Recentes</CardTitle>
          <Link to="/work-orders" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
            Ver todas ({orders.length})
          </Link>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
              Nenhuma ordem de serviço cadastrada no momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    <th className="pb-2.5 font-medium">Número OS</th>
                    <th className="pb-2.5 font-medium">Status Atual</th>
                    <th className="pb-2.5 font-medium">Prioridade</th>
                    <th className="pb-2.5 font-medium">Valor Total</th>
                    <th className="pb-2.5 font-medium">Data de Criação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                  {orders.slice(0, 6).map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const priorityConfig = getPriorityConfig(order.priority);
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="font-mono text-emerald-700 dark:text-emerald-400">{order.orderNumber}</span>
                        </td>
                        <td className="py-3">
                          <Badge variant={statusConfig.variant} size="sm">
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${priorityConfig.badge}`}>
                            {priorityConfig.label}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-slate-700 dark:text-slate-300">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">
                          {formatDateTime(order.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
