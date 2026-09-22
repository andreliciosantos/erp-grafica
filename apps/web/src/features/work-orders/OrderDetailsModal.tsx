import React from 'react';
import { WorkOrderItem } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatDate, getStatusConfig, getPriorityConfig } from '../../lib/utils';
import { User, Calendar, Barcode, Layers, PlayCircle, Clock, Trash2 } from 'lucide-react';

interface OrderDetailsModalProps {
  order: WorkOrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenStageAction: (order: WorkOrderItem, stageId: string, stageName: string) => void;
  onDeleteOrder?: (order: WorkOrderItem) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenStageAction,
  onDeleteOrder,
}) => {
  if (!order) return null;

  const statusConfig = getStatusConfig(order.status);
  const priorityConfig = getPriorityConfig(order.priority);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes da Ordem de Serviço: ${order.orderNumber}`}
      description="Acompanhamento do histórico de produção e apontamentos de máquina"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          {onDeleteOrder ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteOrder(order)}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/30"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Excluir Ordem de Serviço
            </Button>
          ) : (
            <div />
          )}
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-xs">
        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 font-medium block">Status</span>
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
            <span className="text-slate-500 font-medium block">Data de Entrega</span>
            <span className="text-slate-200 font-semibold mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formatDate(order.deliveryDate)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Valor Total</span>
            <span className="text-emerald-400 font-bold mt-1 text-sm block">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Customer & Barcode */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-slate-200 font-semibold">{order.party?.name || 'Cliente Cadastrado'}</p>
              <p className="text-[11px] text-slate-400">{order.party?.document || 'Documento'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
            <Barcode className="w-4 h-4 text-emerald-400" />
            <span>{order.barcode}</span>
          </div>
        </div>

        {/* Stages Timeline */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            Etapas Industriais do Chão de Fábrica
          </h4>

          <div className="space-y-2">
            {(order.stages || []).map((stage, idx) => {
              const stageStatus = getStatusConfig(stage.status);
              const isActionable = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';

              return (
                <div
                  key={stage.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[11px]">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{stage.name}</p>
                      <Badge variant={stageStatus.variant} size="sm" className="mt-0.5">
                        {stageStatus.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {stage.logs && stage.logs.length > 0 && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded">
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
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
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
