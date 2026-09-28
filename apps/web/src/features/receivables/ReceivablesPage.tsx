import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { formatCurrency, formatDate, getPaymentStatusConfig } from '../../lib/utils';
import {
  Coins,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowDownLeft,
  Calendar,
  Trash2,
  Plus,
  Edit2,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import {
  ReceivableItem,
  ReceivablesSummaryDto,
  PaymentStatus,
} from '@erp/shared-types';
import { PaginatedResult } from '../../types';
import { PayReceivableModal } from './PayReceivableModal';
import { ReceivableFormModal } from './ReceivableFormModal';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { PaymentConditionsModal } from './PaymentConditionsModal';

export const ReceivablesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Selected month filter (default to current YYYY-MM)
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const limit = 50;

  // Modals state
  const [payingReceivable, setPayingReceivable] = useState<ReceivableItem | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPaymentConditionsModalOpen, setIsPaymentConditionsModalOpen] = useState(false);
  const [receivableToEdit, setReceivableToEdit] = useState<ReceivableItem | null>(null);
  const [receiptToShow, setReceiptToShow] = useState<ReceivableItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ReceivableItem | null>(null);

  // Fetch summary
  const { data: summary } = useQuery<ReceivablesSummaryDto>({
    queryKey: ['receivables-summary', selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/receivables/summary?month=${selectedMonth}`);
      return res.data;
    },
  });

  // Fetch list
  const { data: listData, isLoading } = useQuery<PaginatedResult<ReceivableItem>>({
    queryKey: ['receivables', selectedMonth, statusFilter, searchTerm, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (selectedMonth) params.append('month', selectedMonth);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const res = await api.get(`/receivables?${params.toString()}`);
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/receivables/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['receivables-summary'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dre'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      setItemToDelete(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Falha ao excluir recebível.');
    },
  });

  const receivables: ReceivableItem[] = listData?.data || [];
  const totalPages = listData?.meta?.totalPages || 1;

  const handleExportCsv = () => {
    if (receivables.length === 0) {
      alert('Nenhum recebível disponível para exportação com os filtros atuais.');
      return;
    }

    const headers = [
      'Descricao',
      'Ordem_Servico',
      'Cliente',
      'Documento',
      'Parcela',
      'Vencimento',
      'Status',
      'Valor_R$',
      'Data_Pagamento',
      'Forma_Pagamento',
      'Observacoes',
    ];

    const rows = receivables.map((r) => [
      `"${r.description.replace(/"/g, '""')}"`,
      r.workOrder ? `"${r.workOrder.orderNumber}"` : '""',
      `"${(r.party?.name || 'Cliente Avulso').replace(/"/g, '""')}"`,
      `"${r.party?.document || ''}"`,
      `"${r.installmentNumber}/${r.totalInstallments}"`,
      `"${r.dueDate.split('T')[0]}"`,
      `"${r.status}"`,
      r.amount.toFixed(2),
      r.paidAt ? `"${r.paidAt.split('T')[0]}"` : '""',
      `"${r.paymentMethod || ''}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contas_a_receber_${selectedMonth || 'todas'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Contas a Receber (Receivables)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de sinais, parcelas de ordens de serviço e controle de inadimplência
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Vencimento:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="text-xs font-semibold bg-transparent border-none focus:outline-hidden text-slate-800 dark:text-slate-200"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaymentConditionsModalOpen(true)}
            className="text-xs h-9 px-3"
            title="Configurar tipos de pagamento e parcelamento padrão"
          >
            <CreditCard className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Condições de Pagamento
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs h-9 px-3"
            title="Exportar listagem em planilha CSV"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
            CSV
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setReceivableToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
          >
            <Plus className="w-4 h-4 mr-1" />
            Novo Recebível
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Previsão de Receita"
          value={formatCurrency(summary?.totalAmount || 0)}
          subtitle={`${summary?.totalCount || 0} lançamentos no mês`}
          icon={<Coins className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        />
        <StatCard
          title="Total Recebido"
          value={formatCurrency(summary?.receivedAmount || 0)}
          subtitle={
            summary?.totalAmount && summary.totalAmount > 0
              ? `${Math.round(((summary.receivedAmount || 0) / summary.totalAmount) * 100)}% liquidado`
              : '0% liquidado'
          }
          icon={<ArrowDownLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="A Receber no Prazo"
          value={formatCurrency(summary?.pendingAmount || 0)}
          subtitle={`${summary?.pendingCount || 0} parcelas pendentes`}
          icon={<Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />}
        />
        <StatCard
          title="Inadimplência (Vencidos)"
          value={formatCurrency(summary?.overdueAmount || 0)}
          subtitle={`${summary?.defaultRatePercent || 0}% do total vencido`}
          icon={<AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />}
        />
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-3.5 sm:p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por descrição, cliente, OS, documento..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none pb-0.5">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shrink-0">
              {(['ALL', 'PENDING', 'PAID', 'OVERDUE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {st === 'ALL' && 'Todos'}
                  {st === 'PENDING' && 'Pendentes'}
                  {st === 'PAID' && 'Recebidos'}
                  {st === 'OVERDUE' && 'Vencidos'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receivables Table (Desktop) */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Descrição / OS</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4 text-center">Parcela</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Carregando contas a receber...
                  </td>
                </tr>
              ) : receivables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum recebível encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                receivables.map((item) => {
                  const statusConfig = getPaymentStatusConfig(item.status);
                  const isPaid = item.status === PaymentStatus.PAID;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {item.description}
                        </div>
                        {item.workOrder && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {item.workOrder.orderNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {item.party?.name || 'Cliente Avulso'}
                        </div>
                        {item.party?.phone && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            {item.party.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {item.installmentNumber}/{item.totalInstallments}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                          {formatDate(item.dueDate)}
                        </div>
                        {isPaid && item.paidAt && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Recebido em: {formatDate(item.paidAt)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusConfig.variant} className={statusConfig.bg}>
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isPaid ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReceiptToShow(item)}
                              className="text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs h-7 px-2"
                              title="Visualizar e imprimir recibo"
                            >
                              <Printer className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Recibo
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPayingReceivable(item)}
                              className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs h-7 px-2.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Receber
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReceivableToEdit(item);
                              setIsFormModalOpen(true);
                            }}
                            className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 h-7 w-7 p-0"
                            title="Editar título"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setItemToDelete(item)}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 h-7 w-7 p-0"
                            title="Excluir recebível"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Mostrando página <strong>{page}</strong> de <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2"
              >
                Próxima <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Receivables Cards (Mobile) */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {isLoading ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Carregando contas a receber...
          </div>
        ) : receivables.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Nenhum recebível encontrado.
          </div>
        ) : (
          receivables.map((item) => {
            const statusConfig = getPaymentStatusConfig(item.status);
            const isPaid = item.status === PaymentStatus.PAID;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {item.description}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.party?.name || 'Cliente Avulso'}
                    </p>
                    {item.workOrder && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {item.workOrder.orderNumber}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusConfig.variant} className={statusConfig.bg}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">
                    Vencimento: <strong className="text-slate-700 dark:text-slate-300">{formatDate(item.dueDate)}</strong>
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <span className="text-[11px] font-medium text-slate-400">
                    Parcela {item.installmentNumber} de {item.totalInstallments}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isPaid ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReceiptToShow(item)}
                        className="text-xs h-8"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Recibo
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setPayingReceivable(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Receber
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReceivableToEdit(item);
                        setIsFormModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-slate-800 h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setItemToDelete(item)}
                      className="text-slate-400 hover:text-rose-600 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-2 text-xs text-slate-500">
            <span>Página {page} de {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8"
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      <PayReceivableModal
        isOpen={Boolean(payingReceivable)}
        onClose={() => setPayingReceivable(null)}
        receivable={payingReceivable}
        onSuccess={(paidItem) => {
          if (paidItem) {
            setReceiptToShow(paidItem);
          }
        }}
      />

      {/* Create / Edit Modal */}
      <ReceivableFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setReceivableToEdit(null);
        }}
        receivableToEdit={receivableToEdit}
      />

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={Boolean(receiptToShow)}
        onClose={() => setReceiptToShow(null)}
        receivable={receiptToShow}
      />

      {/* Payment Conditions & Installment Templates Modal */}
      <PaymentConditionsModal
        isOpen={isPaymentConditionsModalOpen}
        onClose={() => setIsPaymentConditionsModalOpen(false)}
      />

      {/* Confirm Delete Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Confirmar Exclusão
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tem certeza que deseja remover o recebível <strong>"{itemToDelete.description}"</strong> de {formatCurrency(itemToDelete.amount)}?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="ghost" onClick={() => setItemToDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(itemToDelete.id)}
                isLoading={deleteMutation.isPending}
              >
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

