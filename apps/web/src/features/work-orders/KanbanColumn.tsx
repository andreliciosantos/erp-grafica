import React from 'react';
import { WorkOrderItem } from '../../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  badgeBg: string;
  orders: WorkOrderItem[];
  onSelectOrder: (order: WorkOrderItem) => void;
  onAdvanceOrder: (order: WorkOrderItem) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  badgeBg,
  orders,
  onSelectOrder,
  onAdvanceOrder,
}) => {
  return (
    <div className="w-72 flex-shrink-0 flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 max-h-full">
      {/* Column Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${badgeBg}`} />
          <h3 className="text-xs font-bold text-slate-200 tracking-wide">{title}</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50">
          {orders.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-[350px]">
        {orders.length === 0 ? (
          <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-850 rounded-xl text-[11px] text-slate-600">
            Nenhuma OS nesta etapa
          </div>
        ) : (
          orders.map((order) => (
            <KanbanCard
              key={order.id}
              order={order}
              onClick={() => onSelectOrder(order)}
              onAdvance={onAdvanceOrder}
            />
          ))
        )}
      </div>
    </div>
  );
};
