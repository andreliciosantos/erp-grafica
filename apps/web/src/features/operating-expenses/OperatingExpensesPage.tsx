import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { ExpenseModal } from './ExpenseModal';
import { PayExpenseModal } from './PayExpenseModal';
import {
  formatCurrency,
  formatDate,
  getExpenseCategoryConfig,
  getPaymentStatusConfig,
  cn,
} from '../../lib/utils';
import {
  OperatingExpenseItem,
  OperatingExpensesSummaryDto,
  ExpenseCategory,
  ExpenseType,
  PaymentStatus,
  PaginatedResult,
} from '../../types';
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  Repeat,
  Calendar,
  Layers,
  Building2,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  X,
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, { bar: string; dot: string }> = {
  RENT_FACILITIES: { bar: 'bg-indigo-500', dot: 'bg-indigo-500' },
  UTILITIES: { bar: 'bg-amber-500', dot: 'bg-amber-500' },
  SOFTWARE_LICENSES: { bar: 'bg-cyan-500', dot: 'bg-cyan-500' },
  OFFICE_ADMINISTRATIVE: { bar: 'bg-purple-500', dot: 'bg-purple-500' },
  COMMERCIAL_MARKETING: { bar: 'bg-pink-500', dot: 'bg-pink-500' },
  MAINTENANCE_PREDIAL: { bar: 'bg-orange-500', dot: 'bg-orange-500' },
  FINANCIAL_TAXES: { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  OTHER: { bar: 'bg-slate-500', dot: 'bg-slate-500' },
};

export const OperatingExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Current year-month in YYYY-MM
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [competenceMonth, setCompetenceMonth] = useState<string>(currentMonthStr);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<OperatingExpenseItem | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [expenseToPay, setExpenseToPay] = useState<OperatingExpenseItem | null>(null);

  // Modal de Confirmação Elegante (substitui window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'danger' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirmar',
    variant: 'primary',
    onConfirm: () => {},
  });

  // Navegação rápida de competência mensal
  const handleNavigateMonth = (offsetMonths: number) => {
    if (!competenceMonth || !/^\d{4}-\d{2}$/.test(competenceMonth)) {
      setCompetenceMonth(currentMonthStr);
      setPage(1);
      return;
    }
    const [y, m] = competenceMonth.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1 + offsetMonths, 1));
    setCompetenceMonth(date.toISOString().slice(0, 7));
    setPage(1);
  };

  const handleResetToCurrentMonth = () => {
    setCompetenceMonth(currentMonthStr);
    setPage(1);
  };

  const handleCopyBarcode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Summary Metrics Query
  const { data: summary } = useQuery<OperatingExpensesSummaryDto>({
    queryKey: ['operating-expenses-summary', competenceMonth],
    queryFn: async () => {
      const res = await api.get(`/operating-expenses/summary?competenceMonth=${competenceMonth}`);
      return res.data;
    },
  });

  // Expenses List Query
  const { data: expensesData, isLoading } = useQuery<PaginatedResult<OperatingExpenseItem>>({
    queryKey: [
      'operating-expenses',
      page,
      competenceMonth,
      selectedCategory,
      selectedType,
      selectedStatus,
      debouncedSearch,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '25');
      if (competenceMonth) params.append('competenceMonth', competenceMonth);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedType) params.append('expenseType', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

      const res = await api.get(`/operating-expenses?${params.toString()}`);
      return res.data;
    },
  });

  const expenses = expensesData?.data || [];
  const meta = expensesData?.meta;

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/operating-expenses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['operating-expenses-summary'] });
    },
  });

  // Duplicate Next Month Mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/operating-expenses/${id}/duplicate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['operating-expenses-summary'] });
    },
  });

  const handleOpenCreateModal = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditModal = (item: OperatingExpenseItem) => {
    setExpenseToEdit(item);
    setIsExpenseModalOpen(true);
  };

  const handleOpenPayModal = (item: OperatingExpenseItem) => {
    setExpenseToPay(item);
    setIsPayModalOpen(true);
  };

  const handleDelete = (item: OperatingExpenseItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Despesa Operacional',
      description: `Tem certeza que deseja remover a despesa "${item.description}" (${formatCurrency(item.amount)})? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir Despesa',
      variant: 'danger',
      onConfirm: () => {
        deleteMutation.mutate(item.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDuplicate = (item: OperatingExpenseItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Replicar Despesa Recorrente',
      description: `Deseja gerar uma nova despesa idêntica para "${item.description}" com vencimento no mês seguinte?`,
      confirmText: 'Replicar para Próximo Mês',
      variant: 'primary',
      onConfirm: () => {
        duplicateMutation.mutate(item.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-850 dark:text-slate-100">
                Despesas Operacionais (OPEX)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Custos fixos e despesas estruturais não vinculados diretamente ao produto final
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Topo: Navegação Rápida de Competência e Botão Nova Despesa */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-2 py-1 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => handleNavigateMonth(-1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Mês:</span>
            <input
              type="month"
              aria-label="Mês de competência"
              value={competenceMonth}
              onChange={(e) => {
                setCompetenceMonth(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 outline-none text-xs cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleNavigateMonth(1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
              title="Próximo mês"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {competenceMonth !== currentMonthStr && (
              <button
                type="button"
                onClick={handleResetToCurrentMonth}
                className="ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Voltar para o mês atual"
              >
                Hoje
              </button>
            )}
          </div>

          <Button size="sm" onClick={handleOpenCreateModal} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Grid de KPIs do Período */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Previsto no Mês"
          value={formatCurrency(summary?.totalAmount || 0)}
          subtitle={`${summary?.totalCount || 0} contas no período (${formatCurrency(summary?.fixedTotal || 0)} fixas)`}
          icon={<DollarSign className="w-5 h-5 text-indigo-500" />}
        />

        <StatCard
          title="Despesas Pagas"
          value={formatCurrency(summary?.paidAmount || 0)}
          subtitle={`${summary?.paidCount || 0} quitadas (${summary?.totalAmount ? (((summary?.paidAmount || 0) / summary.totalAmount) * 100).toFixed(0) : 0}% liquidado)`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />

        <StatCard
          title="Contas a Vencer"
          value={formatCurrency(summary?.pendingAmount || 0)}
          subtitle={`${summary?.pendingCount || 0} pendentes dentro do prazo`}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />

        <StatCard
          title="Contas Vencidas"
          value={formatCurrency(summary?.overdueAmount || 0)}
          subtitle={`${summary?.overdueCount || 0} contas em atraso`}
          icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
        />
      </div>

      {/* Divisão Visual por Categoria (Breakdown de Gastos) */}
      {summary && summary.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4 border-b border-slate-200/80 dark:border-slate-800">
            <CardTitle className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Distribuição dos Gastos por Categoria ({competenceMonth})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {/* Barra de Progresso Proporcional Multi-Segmentada */}
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              {summary.categoryBreakdown.map((cat) => {
                const colorConfig = CATEGORY_COLORS[cat.category] || { bar: 'bg-slate-500', dot: 'bg-slate-500' };
                return (
                  <div
                    key={cat.category}
                    style={{ width: `${cat.percentage}%` }}
                    className={`${colorConfig.bar} transition-all duration-300 cursor-pointer hover:opacity-85`}
                    title={`${cat.label}: ${formatCurrency(cat.total)} (${cat.percentage}%) - Clique para filtrar`}
                    onClick={() => {
                      setSelectedCategory(selectedCategory === cat.category ? '' : cat.category);
                      setPage(1);
                    }}
                  />
                );
              })}
            </div>

            {/* Legenda com Valores e Cores Sincronizadas */}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
              {summary.categoryBreakdown.map((cat) => {
                const colorConfig = CATEGORY_COLORS[cat.category] || { bar: 'bg-slate-500', dot: 'bg-slate-500' };
                const isSelected = selectedCategory === cat.category;
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(isSelected ? '' : cat.category);
                      setPage(1);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all text-left text-xs',
                      isSelected
                        ? 'bg-slate-200/90 dark:bg-slate-800 ring-1 ring-slate-400/60 shadow-xs'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    )}
                    title={isSelected ? 'Remover filtro de categoria' : 'Filtrar por esta categoria'}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${colorConfig.dot} shrink-0`} />
                    <span className="text-slate-600 dark:text-slate-400">{cat.label}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(cat.total)}
                    </span>
                    <span className="text-[10px] text-slate-400">({cat.percentage}%)</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barra de Filtros e Busca */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Busca textual com Debounce e Limpeza Rápida */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Buscar despesa, credor, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro de Categoria */}
            <Select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todas as Categorias' },
                { value: ExpenseCategory.RENT_FACILITIES, label: 'Aluguel & Estrutura' },
                { value: ExpenseCategory.UTILITIES, label: 'Utilidades & Energia' },
                { value: ExpenseCategory.SOFTWARE_LICENSES, label: 'Softwares & Licenças' },
                { value: ExpenseCategory.OFFICE_ADMINISTRATIVE, label: 'Administrativo & Contábil' },
                { value: ExpenseCategory.COMMERCIAL_MARKETING, label: 'Comercial & Marketing' },
                { value: ExpenseCategory.MAINTENANCE_PREDIAL, label: 'Manutenção Predial' },
                { value: ExpenseCategory.FINANCIAL_TAXES, label: 'Tributos & Taxas' },
                { value: ExpenseCategory.OTHER, label: 'Outras Despesas' },
              ]}
              className="text-xs"
            />

            {/* Filtro de Tipo */}
            <Select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todos os Tipos' },
                { value: ExpenseType.FIXED, label: 'Despesas Fixas' },
                { value: ExpenseType.VARIABLE, label: 'Despesas Variáveis' },
              ]}
              className="text-xs"
            />

            {/* Filtro de Status */}
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'Todos os Status' },
                { value: PaymentStatus.PENDING, label: 'Pendentes' },
                { value: PaymentStatus.PAID, label: 'Pagas' },
                { value: PaymentStatus.OVERDUE, label: 'Vencidas' },
                { value: PaymentStatus.CANCELLED, label: 'Canceladas' },
              ]}
              className="text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Despesas Operacionais (Desktop e Mobile) */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Carregando despesas operacionais...
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhuma despesa encontrada
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não há lançamentos de despesas operacionais para o período selecionado ou para os filtros aplicados.
              </p>
              <Button size="sm" variant="outline" onClick={handleOpenCreateModal} className="mt-2">
                <Plus className="w-4 h-4 mr-1" />
                Cadastrar Primeira Despesa
              </Button>
            </div>
          ) : (
            <>
              {/* Visão Tabela (Desktop) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Favorecido / Fornecedor</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
                    {expenses.map((expense) => {
                      const catConfig = getExpenseCategoryConfig(expense.category);
                      const statusConfig = getPaymentStatusConfig(expense.status);
                      const isOverdue = expense.status === PaymentStatus.OVERDUE;

                      return (
                        <tr
                          key={expense.id}
                          className={cn(
                            'transition-colors',
                            isOverdue
                              ? 'bg-rose-500/[0.04] dark:bg-rose-500/[0.08] border-l-4 border-l-rose-500 hover:bg-rose-500/[0.08]'
                              : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                          )}
                        >
                          {/* Vencimento */}
                          <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            <span className={cn(isOverdue && 'text-rose-600 dark:text-rose-400 font-bold')}>
                              {formatDate(expense.dueDate)}
                            </span>
                          </td>

                          {/* Descrição e Recorrência */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                              <span>{expense.description}</span>
                              {expense.barcode && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyBarcode(expense.id, expense.barcode!)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[9px] transition-colors"
                                  title={`Copiar código de barras / PIX: ${expense.barcode}`}
                                >
                                  {copiedId === expense.id ? (
                                    <>
                                      <Check className="w-2.5 h-2.5 text-emerald-500" />
                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-2.5 h-2.5 text-slate-400" />
                                      <span>Copiar Código</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                              {expense.isRecurring && (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <Repeat className="w-2.5 h-2.5" />
                                  <span>Recorrente</span>
                                </span>
                              )}
                              {expense.recurrenceEndDate && (
                                <span>• Até {formatDate(expense.recurrenceEndDate)}</span>
                              )}
                              {expense.documentNumber && <span>• Doc: {expense.documentNumber}</span>}
                            </div>
                          </td>

                          {/* Categoria */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge variant={catConfig.variant} size="sm">
                              {catConfig.label}
                            </Badge>
                          </td>

                          {/* Tipo */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {expense.expenseType === ExpenseType.FIXED ? 'Fixa' : 'Variável'}
                            </span>
                          </td>

                          {/* Favorecido / Fornecedor */}
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {expense.supplier ? (
                              <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {expense.supplier.name}
                              </span>
                            ) : expense.beneficiaryName ? (
                              <span>{expense.beneficiaryName}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          {/* Valor */}
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-50 whitespace-nowrap">
                            {formatCurrency(expense.amount)}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <Badge variant={statusConfig.variant} size="sm">
                              {statusConfig.label}
                            </Badge>
                            {expense.paidAt && (
                              <div className="text-[9px] text-slate-400 mt-0.5">
                                Pago em {formatDate(expense.paidAt)}
                              </div>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {/* Botão de Liquidação Rápida */}
                              {expense.status !== PaymentStatus.PAID && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPayModal(expense)}
                                  className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                  title="Registrar pagamento / liquidar despesa"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              {/* Botão de Duplicação para Próximo Mês (Recorrência) */}
                              {expense.isRecurring && (
                                <button
                                  type="button"
                                  onClick={() => handleDuplicate(expense)}
                                  className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                  title="Replicar despesa para o próximo mês"
                                >
                                  <CalendarPlus className="w-4 h-4" />
                                </button>
                              )}

                              {/* Botão de Edição */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(expense)}
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Editar despesa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Botão de Exclusão */}
                              <button
                                type="button"
                                onClick={() => handleDelete(expense)}
                                className="p-1.5 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                title="Remover despesa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Visão Cards Mobile (Mobile-First) */}
              <div className="md:hidden divide-y divide-slate-200/80 dark:divide-slate-800">
                {expenses.map((expense) => {
                  const catConfig = getExpenseCategoryConfig(expense.category);
                  const statusConfig = getPaymentStatusConfig(expense.status);
                  const isOverdue = expense.status === PaymentStatus.OVERDUE;

                  return (
                    <div
                      key={expense.id}
                      className={cn(
                        'p-4 space-y-2.5 transition-colors',
                        isOverdue && 'border-l-4 border-l-rose-500 bg-rose-500/[0.03] dark:bg-rose-500/[0.06]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100">
                            {expense.description}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Vencimento:{' '}
                            <strong className={cn(isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-200')}>
                              {formatDate(expense.dueDate)}
                            </strong>
                          </p>
                        </div>
                        <Badge variant={statusConfig.variant} size="sm">
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <Badge variant={catConfig.variant} size="sm">
                          {catConfig.label}
                        </Badge>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {expense.expenseType === ExpenseType.FIXED ? 'Fixa' : 'Variável'}
                        </span>
                        {expense.isRecurring && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <Repeat className="w-3 h-3" />
                            <span>Recorrente</span>
                          </span>
                        )}
                      </div>

                      {(expense.beneficiaryName || expense.supplier) && (
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          Credor: <strong>{expense.supplier?.name || expense.beneficiaryName}</strong>
                        </div>
                      )}

                      {expense.barcode && (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleCopyBarcode(expense.id, expense.barcode!)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            {copiedId === expense.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Código copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copiar Código de Barras / PIX</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="text-base font-bold text-slate-900 dark:text-slate-50">
                          {formatCurrency(expense.amount)}
                        </div>

                        <div className="flex items-center gap-1">
                          {expense.status !== PaymentStatus.PAID && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPayModal(expense)}
                              className="text-xs py-1 h-8 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Pagar
                            </Button>
                          )}

                          {expense.isRecurring && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicate(expense)}
                              className="text-xs py-1 h-8 text-indigo-600 dark:text-indigo-400"
                              title="Replicar p/ próximo mês"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditModal(expense)}
                            className="text-xs py-1 h-8"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(expense)}
                            className="text-xs py-1 h-8 text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginação */}
              {meta && meta.totalPages > 1 && (
                <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Página {meta.page} de {meta.totalPages} ({meta.total} despesas)
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modais de Cadastro/Edição e Liquidação Rápida */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenseToEdit={expenseToEdit}
      />

      <PayExpenseModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        expense={expenseToPay}
      />

      {/* Modal de Confirmação Elegante */}
      <Modal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        maxWidth="sm"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmDialog.onConfirm}
              className={
                confirmDialog.variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }
            >
              {confirmDialog.confirmText}
            </Button>
          </div>
        }
      >
        <div className="py-2 text-xs text-slate-600 dark:text-slate-300">
          Por favor, confirme se deseja prosseguir com esta operação.
        </div>
      </Modal>
    </div>
  );
};
