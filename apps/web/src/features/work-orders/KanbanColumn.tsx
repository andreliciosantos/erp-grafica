import React, { useState } from 'react';
import { WorkOrderItem } from '../../types';
import { KanbanCard } from './KanbanCard';
import { formatCurrency } from '../../lib/utils';
import { ArrowDownToLine } from 'lucide-react';

interface KanbanColumnProps {
  id: string;
  title: string;
  badgeBg: string;
  stepNumber?: number;
  icon?: React.ReactNode;
  description?: string;
  orders: WorkOrderItem[];
  draggedOrderId?: string | null;
  onDragStartOrder?: (order: WorkOrderItem) => void;
  onDragEndOrder?: () => void;
  onSelectOrder: (order: WorkOrderItem) => void;
  onAdvanceOrder: (order: WorkOrderItem) => void;
  onDropOrder: (orderId: string, targetStatus: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  badgeBg,
  stepNumber,
  icon,
  description,
  orders,
  draggedOrderId,
  onDragStartOrder,
  onDragEndOrder,
  onSelectOrder,
  onAdvanceOrder,
  onDropOrder,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = React.useRef(0);

  const totalValue = orders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);
    const orderId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text') || draggedOrderId;
    if (orderId) {
      onDropOrder(orderId, id);
    }
  };

  return (
    <div
      id={`kanban-col-${id}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-[86vw] sm:w-[320px] max-w-[350px] flex-shrink-0 flex flex-col rounded-2xl border transition-colors duration-150 max-h-full snap-start ${
        isDragOver
          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/50 shadow-xl'
          : 'bg-slate-100/70 dark:bg-slate-900/60 border-slate-200/90 dark:border-slate-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-200/90 dark:border-slate-800/80 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {stepNumber && (
              <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center border border-slate-200 dark:border-slate-700/60 flex-shrink-0 shadow-xs">
                {stepNumber}
              </span>
            )}
            {icon && <span className="text-slate-500 dark:text-slate-400 flex-shrink-0">{icon}</span>}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`w-2 h-2 rounded-full ${badgeBg} flex-shrink-0`} />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide truncate">{title}</h3>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 flex-shrink-0 shadow-xs">
            {orders.length}
          </span>
        </div>

        {/* Technical stage specification description */}
        {description && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Column total value */}
        <div className="flex items-center justify-between text-[10px] pt-1 text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-850/60">
          <span>Total na Etapa:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(totalValue)}</span>
        </div>
      </div>

      {/* Cards Container */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="p-3 space-y-2.5 overflow-y-auto flex-1 min-h-[350px]"
      >
        {/* Drop zone banner when dragging over */}
        {isDragOver && (
          <div className="p-3 rounded-xl border-2 border-dashed border-emerald-500/80 bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 pointer-events-none animate-pulse">
            <ArrowDownToLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Mover OS para {title}</span>
          </div>
        )}

        {orders.length === 0 && !isDragOver ? (
          <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-850 rounded-xl text-[11px] text-slate-400 dark:text-slate-600 p-3 text-center">
            <span>Nenhuma OS nesta etapa</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-700 mt-0.5">Arraste uma OS aqui para avançar</span>
          </div>
        ) : (
          orders.map((order) => (
            <KanbanCard
              key={order.id}
              order={order}
              onClick={() => onSelectOrder(order)}
              onAdvance={onAdvanceOrder}
              onDragStart={onDragStartOrder}
              onDragEnd={onDragEndOrder}
            />
          ))
        )}
      </div>
    </div>
  );
};
