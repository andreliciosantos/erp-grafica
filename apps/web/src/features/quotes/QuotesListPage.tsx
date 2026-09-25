import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { formatCurrency, formatDate, getStatusConfig } from '../../lib/utils';
import { Plus, Search, CheckCircle, Calculator, Trash2, AlertTriangle, KanbanSquare, Bookmark } from 'lucide-react';
import { QuoteResponseDto, PaginatedResult } from '../../types';
import { Modal } from '../../components/common/Modal';
import { QuickQuotesTemplatesModal } from './QuickQuotesTemplatesModal';

export const QuotesListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [quoteToDelete, setQuoteToDelete] = useState<QuoteResponseDto | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading } = useQuery<PaginatedResult<QuoteResponseDto>>({
    queryKey: ['quotes-list', statusFilter],
    queryFn: async () => {
      const statusParam = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
      const res = await api.get(`/quotes?limit=50${statusParam}`);
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await api.post(`/quotes/${quoteId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes-list'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: () => {
      // Invalidation handles state; modal or toast can display error if needed
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const res = await api.delete(`/quotes/${quoteId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes-list'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setQuoteToDelete(null);
      setErrorMessage(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMessage(error.response?.data?.message || 'Erro ao excluir orçamento.');
    },
  });

  const quotes = data?.data || [];

  const filteredQuotes = quotes.filter((q) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      q.code?.toString().includes(term) ||
      q.items?.some((i) => i.productName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Orçamentos Gráficos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cálculos técnicos de aproveitamento de papel, margens e aprovação de produção
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTemplatesModalOpen(true)}
            className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Modelos Rápidos Pré-definidos
          </Button>
          <Link to="/quotes/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Novo Orçamento Técnico
            </Button>
          </Link>
        </div>
      </div>

      {/* In-app Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 text-xs font-semibold px-2 py-0.5"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filters Card */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Buscar por código ou nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'DRAFT', 'APPROVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/50'
                }`}
              >
                {status === 'ALL' ? 'Todos' : getStatusConfig(status).label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Orçamentos ({filteredQuotes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              Carregando orçamentos...
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              Nenhum orçamento encontrado para os critérios selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    <th className="pb-3 font-medium">Código</th>
                    <th className="pb-3 font-medium">Produto / Detalhes</th>
                    <th className="pb-3 font-medium">Tiragem</th>
                    <th className="pb-3 font-medium">Aproveitamento</th>
                    <th className="pb-3 font-medium">Valor Total</th>
                    <th className="pb-3 font-medium">Validade</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                  {filteredQuotes.map((quote) => {
                    const statusConfig = getStatusConfig(quote.status);
                    const firstItem = quote.items?.[0];
                    return (
                      <tr key={quote.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          #{quote.code || quote.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {firstItem?.productName || 'Material Gráfico'}
                          </p>
                          {quote.notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {quote.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                          {firstItem?.quantity?.toLocaleString('pt-BR') || '-'} un
                        </td>
                        <td className="py-3.5 text-slate-700 dark:text-slate-300">
                          {firstItem ? (
                            <span className="text-[11px] text-slate-700 dark:text-slate-300">
                              <strong className="text-emerald-700 dark:text-emerald-400">{firstItem.itemsPerSheet}</strong>/fl ({firstItem.sheetsRequired} folhas)
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-3.5 font-bold text-slate-850 dark:text-slate-100">
                          {formatCurrency(quote.totalAmount)}
                        </td>
                        <td className="py-3.5 text-slate-500 dark:text-slate-400">
                          {formatDate(quote.validUntil)}
                        </td>
                        <td className="py-3.5">
                          <Badge variant={statusConfig.variant} size="sm">
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          {quote.status === 'APPROVED' && (
                            <Link to="/work-orders">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="Ver Ordem de Serviço no Chão de Fábrica"
                              >
                                <KanbanSquare className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Ver no PCP</span>
                              </Button>
                            </Link>
                          )}
                          {quote.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => approveMutation.mutate(quote.id)}
                              isLoading={approveMutation.isPending}
                              title="Aprovar e Gerar Ordem de Serviço"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Aprovar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setQuoteToDelete(quote)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/30"
                            title="Excluir Orçamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(quoteToDelete)}
        onClose={() => setQuoteToDelete(null)}
        title="Confirmar Exclusão de Orçamento"
        description="Esta ação removerá permanentemente o orçamento e registros vinculados."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setQuoteToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (quoteToDelete) deleteMutation.mutate(quoteToDelete.id);
              }}
              isLoading={deleteMutation.isPending}
            >
              Confirmar Exclusão
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-200">
              Tem certeza que deseja excluir o orçamento #{quoteToDelete?.code}?
            </p>
            <p className="mt-1 text-slate-300">
              Item:{' '}
              <strong className="text-white">
                {quoteToDelete?.items?.[0]?.productName || 'Material Gráfico'}
              </strong>
              <br />
              Valor:{' '}
              <strong className="text-white">
                {quoteToDelete ? formatCurrency(quoteToDelete.totalAmount) : ''}
              </strong>
            </p>
          </div>
        </div>
      </Modal>

      {/* Quick Quotes Templates Management Modal */}
      <QuickQuotesTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
      />
    </div>
  );
};
