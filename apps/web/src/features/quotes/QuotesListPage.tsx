import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { formatCurrency, formatDate, getStatusConfig } from '../../lib/utils';
import { Plus, Search, CheckCircle, Calculator, Eye } from 'lucide-react';
import { QuoteResponseDto, PaginatedResult } from '../../types';

export const QuotesListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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
      alert('Orçamento aprovado com sucesso! Ordem de Serviço gerada.');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Erro ao aprovar orçamento.');
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
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            Orçamentos Gráficos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cálculos técnicos de aproveitamento de papel, margens e aprovação de produção
          </p>
        </div>
        <Link to="/quotes/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Novo Orçamento Técnico
          </Button>
        </Link>
      </div>

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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
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
            <div className="py-12 text-center text-slate-400 text-xs">
              Carregando orçamentos...
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhum orçamento encontrado para os critérios selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
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
                <tbody className="divide-y divide-slate-800/60">
                  {filteredQuotes.map((quote) => {
                    const statusConfig = getStatusConfig(quote.status);
                    const firstItem = quote.items?.[0];
                    return (
                      <tr key={quote.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 font-mono font-semibold text-emerald-400">
                          #{quote.code || quote.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-slate-200">
                            {firstItem?.productName || 'Material Gráfico'}
                          </p>
                          {quote.notes && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">
                              {quote.notes}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-300 font-medium">
                          {firstItem?.quantity?.toLocaleString('pt-BR') || '-'} un
                        </td>
                        <td className="py-3.5 text-slate-300">
                          {firstItem ? (
                            <span className="text-[11px] text-slate-300">
                              <strong className="text-emerald-400">{firstItem.itemsPerSheet}</strong>/fl ({firstItem.sheetsRequired} folhas)
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-3.5 font-bold text-slate-100">
                          {formatCurrency(quote.totalAmount)}
                        </td>
                        <td className="py-3.5 text-slate-400">
                          {formatDate(quote.validUntil)}
                        </td>
                        <td className="py-3.5">
                          <Badge variant={statusConfig.variant} size="sm">
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-right space-x-2">
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
                          <Link to={`/quotes`}>
                            <Button size="sm" variant="ghost">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
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
