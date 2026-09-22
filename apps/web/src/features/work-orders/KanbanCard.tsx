import React from 'react';
import { WorkOrderItem } from '../../types';
import { formatCurrency, formatDate, getPriorityConfig } from '../../lib/utils';
import { Calendar, User, Barcode, ChevronRight } from 'lucide-react';

interface KanbanCardProps {
  order: WorkOrderItem;
  onClick: () => void;
  onAdvance?: (order: WorkOrderItem) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ order, onClick, onAdvance }) => {
  const priority = getPriorityConfig(order.priority);

  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-sm hover:border-slate-700 hover:shadow-md transition-all cursor-pointer space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
          {order.orderNumber}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${priority.badge}`}>
          {priority.label}
        </span>
      </div>

      {/* Customer */}
      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium truncate">
        <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        <span className="truncate">{order.party?.name || 'Cliente'}</span>
      </div>

      {/* Delivery Date & Total */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>{formatDate(order.deliveryDate)}</span>
        </div>
        <span className="font-semibold text-slate-200">{formatCurrency(order.totalAmount)}</span>
      </div>

      {/* Barcode representation & quick advance button */}
      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
        <div className="flex items-center gap-1 font-mono">
          <Barcode className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate max-w-[90px]">{order.barcode || order.orderNumber}</span>
        </div>

        {onAdvance && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdvance(order);
            }}
            className="flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300 font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
            title="Avançar para próxima etapa"
          >
            <span>Avançar</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
