import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { WorkOrderItem } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  formatCurrency,
  formatDate,
  getStatusConfig,
  getPriorityConfig,
  getPaymentStatusConfig,
} from '../../lib/utils';
import {
  User,
  Calendar,
  Barcode,
  Layers,
  PlayCircle,
  Clock,
  Trash2,
  Edit2,
  Printer,
  Coins,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { ReceivableItem } from '@erp/shared-types';
import { PaginatedResult } from '../../types';

interface OrderDetailsModalProps {
  order: WorkOrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStageAction: (order: WorkOrderItem, stageId: string, stageName: string) => void;
  onDeleteOrder?: (order: WorkOrderItem) => void;
  onEditOrder?: (order: WorkOrderItem) => void;
  onPrintJobTicket?: (order: WorkOrderItem) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenStageAction,
  onDeleteOrder,
  onEditOrder,
  onPrintJobTicket,
}) => {
  const queryClient = useQueryClient();

  // Fetch receivables for this work order
  const { data: receivablesData } = useQuery<PaginatedResult<ReceivableItem>>({
    queryKey: ['order-receivables', order?.id],
    queryFn: async () => {
      if (!order?.id) return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      const res = await api.get(`/receivables?workOrderId=${order.id}&limit=20`);
      return res.data;
    },
    enabled: isOpen && Boolean(order?.id),
  });

  const generateInstallmentsMutation = useMutation({
    mutationFn: async (plan: 'FULL_ADVANCE' | 'HALF_DOWN_HALF_PICKUP' | 'CUSTOM_INSTALLMENTS') => {
      if (!order?.id) return;
      const res = await api.post('/receivables/generate-for-order', {
        workOrderId: order.id,
        plan,
        downPaymentPercent: 50,
        installmentsCount: plan === 'CUSTOM_INSTALLMENTS' ? 3 : undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-receivables', order?.id] });
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['receivables-summary'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Erro ao gerar parcelas de recebimento.');
    },
  });

  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);
  const priorityConfig = getPriorityConfig(order.priority);
  const paymentStatusConfig = getPaymentStatusConfig(order.paymentStatus || 'PENDING');
  const receivables: ReceivableItem[] = receivablesData?.data || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes da Ordem de Serviço: ${order.orderNumber}`}
      description="Acompanhamento do histórico de produção e apontamentos de máquina"
      maxWidth="3xl"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {onPrintJobTicket && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onPrintJobTicket(order);
                }}
                className="bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Ficha Técnica (A4 / 80mm)
              </Button>
            )}
            {onEditOrder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEditOrder(order);
                }}
                className="text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-slate-700"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Editar OS
              </Button>
            )}
            {onDeleteOrder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteOrder(order)}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Excluir
              </Button>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-xs">
        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-500 font-medium block">Status Fabril</span>
            <Badge variant={statusConfig.variant} size="sm" className="mt-1">
              {statusConfig.label}
            </Badge>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Prioridade</span>
            <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded border font-medium ${priorityConfig.badge}`}>
              {priorityConfig.label}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-medium block">Data de Entrega</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              {formatDate(order.deliveryDate)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-medium block">Valor Total</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 text-sm block">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Customer & Barcode */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-slate-800 dark:text-slate-200 font-semibold">{order.party?.name || 'Cliente Cadastrado'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{order.party?.document || 'Documento'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={paymentStatusConfig.variant} className={paymentStatusConfig.bg}>
              Pagamento: {paymentStatusConfig.label}
            </Badge>
            <div className="flex items-center gap-1.5 font-mono text-xs bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
              <Barcode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{order.barcode}</span>
            </div>
          </div>
        </div>

        {/* Financial / Receivables Section */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Contas a Receber / Parcelamento da OS
            </h4>
            <span className="text-[11px] text-slate-500">
              {receivables.length} parcela(s) registrada(s)
            </span>
          </div>

          {receivables.length > 0 ? (
            <div className="space-y-1.5">
              {receivables.map((rec) => {
                const recStatus = getPaymentStatusConfig(rec.status);
                return (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {rec.description}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-2">
                        Vencimento: {formatDate(rec.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(rec.amount)}
                      </span>
                      <Badge variant={recStatus.variant} size="sm" className={recStatus.bg}>
                        {recStatus.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Nenhum cronograma de parcelas gerado para esta OS ainda.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateInstallmentsMutation.mutate('HALF_DOWN_HALF_PICKUP')}
                  isLoading={generateInstallmentsMutation.isPending}
                  className="text-xs h-7"
                >
                  <Coins className="w-3 h-3 mr-1 text-emerald-600" />
                  Sinal 50% + 50% Retirada
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateInstallmentsMutation.mutate('FULL_ADVANCE')}
                  isLoading={generateInstallmentsMutation.isPending}
                  className="text-xs h-7"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1 text-teal-600" />
                  À Vista (100%)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateInstallmentsMutation.mutate('CUSTOM_INSTALLMENTS')}
                  isLoading={generateInstallmentsMutation.isPending}
                  className="text-xs h-7"
                >
                  <CreditCard className="w-3 h-3 mr-1 text-indigo-600" />
                  3x a Prazo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Stages Timeline */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Etapas Industriais do Chão de Fábrica
          </h4>

          <div className="space-y-2">
            {(order.stages || []).map((stage, idx) => {
              const stageStatus = getStatusConfig(stage.status);
              const isActionable = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';

              return (
                <div
                  key={stage.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[11px]">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{stage.name}</p>
                      <Badge variant={stageStatus.variant} size="sm" className="mt-0.5">
                        {stageStatus.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {stage.logs && stage.logs.length > 0 && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" />
                        {stage.logs.length} apontamento(s)
                      </span>
                    )}

                    {isActionable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenStageAction(order, stage.id, stage.name)}
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Apontar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
