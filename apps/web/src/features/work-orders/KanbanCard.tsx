import React, { useState } from 'react';
import { WorkOrderItem } from '../../types';
import { formatCurrency, formatDate, getPriorityConfig } from '../../lib/utils';
import { Calendar, User, Barcode, ChevronRight, GripVertical, CheckCircle2 } from 'lucide-react';

interface KanbanCardProps {
  order: WorkOrderItem;
  onClick: () => void;
  onAdvance?: (order: WorkOrderItem) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ order, onClick, onAdvance }) => {
  const [isDragging, setIsDragging] = useState(false);
  const priority = getPriorityConfig(order.priority);

  const completedStages = order.stages?.filter((s) => s.status === 'COMPLETED').length || 0;
  const totalStages = order.stages?.length || 5;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', order.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ id: order.id, status: order.status }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`group relative rounded-xl border bg-slate-900/90 p-3.5 shadow-sm transition-all cursor-grab active:cursor-grabbing space-y-2.5 ${
        isDragging
          ? 'opacity-40 scale-95 border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-2xl bg-emerald-950/30'
          : 'border-slate-800 hover:border-slate-700 hover:shadow-md'
      }`}
    >
      {/* Header with Drag Handle, OS Number and Priority */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
          <span className="font-mono text-xs font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors truncate">
            {order.orderNumber}
          </span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${priority.badge}`}>
          {priority.label}
        </span>
      </div>

      {/* Customer */}
      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium truncate">
        <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        <span className="truncate">{order.party?.name || 'Cliente'}</span>
      </div>

      {/* Industrial Stage Progress Bar */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            Progresso Fabril
          </span>
          <span className="font-mono font-medium text-slate-300">
            {completedStages}/{totalStages} etapas
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
          {Array.from({ length: totalStages }).map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 border-r border-slate-900 transition-colors ${
                idx < completedStages
                  ? 'bg-emerald-500'
                  : idx === completedStages
                  ? 'bg-emerald-400/50 animate-pulse'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Delivery Date & Total Amount */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>{formatDate(order.deliveryDate)}</span>
        </div>
        <span className="font-semibold text-slate-200">{formatCurrency(order.totalAmount)}</span>
      </div>

      {/* Barcode & Quick Advance */}
      <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-500">
        <div className="flex items-center gap-1 font-mono">
          <Barcode className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate max-w-[85px]">{order.barcode || order.orderNumber}</span>
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

