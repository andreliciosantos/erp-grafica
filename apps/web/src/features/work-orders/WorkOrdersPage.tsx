import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { KanbanColumn } from './KanbanColumn';
import { OrderDetailsModal } from './OrderDetailsModal';
import { StageActionModal } from './StageActionModal';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { formatCurrency, formatDate, getStatusConfig, getPriorityConfig } from '../../lib/utils';
import {
  KanbanSquare,
  List,
  Search,
  Eye,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  Layers,
  Printer,
  Scissors,
  ShieldCheck,
  PackageCheck,
  Award,
} from 'lucide-react';
import { WorkOrderItem, PaginatedResult } from '../../types';
import { CreateOrderModal } from './CreateOrderModal';
import { Modal } from '../../components/common/Modal';

export const WorkOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrderItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<WorkOrderItem | null>(null);

  // Stage Action Modal State
  const [stageModalData, setStageModalData] = useState<{
    isOpen: boolean;
    stageId: string | null;
    stageName: string | null;
    orderNumber: string | null;
  }>({
    isOpen: false,
    stageId: null,
    stageName: null,
    orderNumber: null,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.delete(`/work-orders/${orderId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      setOrderToDelete(null);
      setSelectedOrder(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Falha ao excluir ordem de serviço.');
    },
  });

  // Fetch Work Orders
  const { data, isLoading } = useQuery<PaginatedResult<WorkOrderItem>>({
    queryKey: ['work-orders'],
    queryFn: async () => {
      const res = await api.get('/work-orders?limit=100');
      return res.data;
    },
  });

  // WebSocket Live Sync
  useEffect(() => {
    const socket = getSocket();

    const handleStatusChange = () => {
      // Invalidate query to refresh orders across all columns in real-time
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    };

    socket.on('work_order_status_changed', handleStatusChange);

    return () => {
      socket.off('work_order_status_changed', handleStatusChange);
    };
  }, [queryClient]);

  // Mutation to advance status
  const advanceMutation = useMutation({
    mutationFn: async ({ orderId, nextStatus }: { orderId: string; nextStatus: string }) => {
      const res = await api.patch(`/work-orders/${orderId}/status`, { status: nextStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Transição de etapa não permitida.');
    },
  });

  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
      case 'PENDING':
        return 'PRE_PRESS';
      case 'PRE_PRESS':
        return 'PRINTING';
      case 'PRINTING':
        return 'FINISHING';
      case 'FINISHING':
        return 'QUALITY_CONTROL';
      case 'QUALITY_CONTROL':
        return 'READY_FOR_PICKUP';
      case 'READY_FOR_PICKUP':
        return 'DELIVERED';
      default:
        return null;
    }
  };

  const handleAdvance = (order: WorkOrderItem) => {
    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) return;

    if (nextStatus === 'PRINTING') {
      const confirmPrint = window.confirm(
        `Avançar para IMPRESSÃO baixará automaticamente os insumos do estoque previstos nesta OS. Deseja prosseguir?`
      );
      if (!confirmPrint) return;
    }

    advanceMutation.mutate({ orderId: order.id, nextStatus });
  };

  const orders = data?.data || [];

  const handleDropOrder = (orderId: string, targetStatus: string) => {
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder || currentOrder.status === targetStatus) return;

    if (targetStatus === 'PRINTING' && currentOrder.status === 'PRE_PRESS') {
      const confirmPrint = window.confirm(
        `Mover a OS ${currentOrder.orderNumber} para IMPRESSÃO baixará automaticamente os insumos do estoque. Deseja prosseguir?`
      );
      if (!confirmPrint) return;
    }

    advanceMutation.mutate({ orderId, nextStatus: targetStatus });
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(term) ||
      o.party?.name?.toLowerCase().includes(term) ||
      o.barcode?.toLowerCase().includes(term)
    );
  });

  const kanbanColumns = [
    {
      id: 'PENDING',
      stepNumber: 1,
      title: 'Aguardando Liberação',
      badgeBg: 'bg-amber-400',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
      description: 'Análise comercial, validação financeira e liberação técnica para fila do PCP.',
    },
    {
      id: 'PRE_PRESS',
      stepNumber: 2,
      title: 'Pré-Impressão (CTP)',
      badgeBg: 'bg-blue-400',
      icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
      description: 'Fechamento de arquivo, imposição, sangrias, trapping e gravação de chapas offset.',
    },
    {
      id: 'PRINTING',
      stepNumber: 3,
      title: 'Impressão',
      badgeBg: 'bg-indigo-400',
      icon: <Printer className="w-3.5 h-3.5 text-indigo-400" />,
      description: 'Tiragem em máquina offset/digital. Acerto de registro, carga de tinta e acerto de papel.',
    },
    {
      id: 'FINISHING',
      stepNumber: 4,
      title: 'Acabamento Gráfico',
      badgeBg: 'bg-purple-400',
      icon: <Scissors className="w-3.5 h-3.5 text-purple-400" />,
      description: 'Refile em guilhotina, laminação BOPP, verniz UV, dobra, vinco e encadernação.',
    },
    {
      id: 'QUALITY_CONTROL',
      stepNumber: 5,
      title: 'Controle de Qualidade',
      badgeBg: 'bg-cyan-400',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />,
      description: 'Inspeção dimensional, contagem, conferência densitométrica e aprovação de lote.',
    },
    {
      id: 'READY_FOR_PICKUP',
      stepNumber: 6,
      title: 'Pronto p/ Retirada',
      badgeBg: 'bg-emerald-400',
      icon: <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />,
      description: 'Embalado e etiquetado com código de barras, aguardando expedição ou cliente.',
    },
    {
      id: 'DELIVERED',
      stepNumber: 7,
      title: 'Entregue / Concluído',
      badgeBg: 'bg-green-500',
      icon: <Award className="w-3.5 h-3.5 text-green-400" />,
      description: 'Material entregue ao cliente e processo de produção concluído com sucesso.',
    },
  ];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <KanbanSquare className="w-5 h-5 text-emerald-400" />
            Chão de Fábrica & Gestão de Produção (PCP)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Máquina de estados industrial e apontamento de produção com sincronização em tempo real
          </p>
        </div>

        {/* Action Button & View Switcher & Search */}
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido / OS</span>
          </Button>

          <div className="w-56 hidden sm:block">
            <Input
              placeholder="Buscar OS, cliente, código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('KANBAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'KANBAN'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tabela
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'KANBAN' ? (
        <div className="flex-1 overflow-x-auto pb-2 flex gap-4 min-h-0">
          {kanbanColumns.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id);
            return (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                badgeBg={col.badgeBg}
                stepNumber={col.stepNumber}
                icon={col.icon}
                description={col.description}
                orders={colOrders}
                onSelectOrder={(order) => setSelectedOrder(order)}
                onAdvanceOrder={handleAdvance}
                onDropOrder={handleDropOrder}
              />
            );
          })}
        </div>
      ) : (
        <Card className="flex-1 overflow-y-auto">
          <CardHeader>
            <CardTitle>Ordens de Serviço ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Carregando ordens de serviço...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Nenhuma ordem de serviço cadastrada.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-medium">
                      <th className="pb-3 font-medium">Número OS</th>
                      <th className="pb-3 font-medium">Cliente</th>
                      <th className="pb-3 font-medium">Prioridade</th>
                      <th className="pb-3 font-medium">Status Atual</th>
                      <th className="pb-3 font-medium">Previsão de Entrega</th>
                      <th className="pb-3 font-medium">Valor Total</th>
                      <th className="pb-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      const priorityConfig = getPriorityConfig(order.priority);
                      return (
                        <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 font-mono font-bold text-emerald-400">
                            {order.orderNumber}
                          </td>
                          <td className="py-3.5 text-slate-200 font-medium">
                            {order.party?.name || 'Cliente'}
                          </td>
                          <td className="py-3.5">
                            <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${priorityConfig.badge}`}>
                              {priorityConfig.label}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <Badge variant={statusConfig.variant} size="sm">
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="py-3.5 text-slate-400">
                            {formatDate(order.deliveryDate)}
                          </td>
                          <td className="py-3.5 font-bold text-slate-100">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="py-3.5 text-right space-x-1.5">
                            <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                              <Eye className="w-3.5 h-3.5" />
                              Ver Detalhes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setOrderToDelete(order)}
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/30"
                              title="Excluir Ordem de Serviço"
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
      )}

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onOpenStageAction={(order, stageId, stageName) => {
          setStageModalData({
            isOpen: true,
            stageId,
            stageName,
            orderNumber: order.orderNumber,
          });
        }}
        onDeleteOrder={(order) => {
          setOrderToDelete(order);
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(orderToDelete)}
        onClose={() => setOrderToDelete(null)}
        title="Confirmar Exclusão de Ordem de Serviço"
        description="Esta ação removerá a OS e seu histórico de etapas."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setOrderToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (orderToDelete) deleteMutation.mutate(orderToDelete.id);
              }}
              isLoading={deleteMutation.isPending}
            >
              Excluir Definitivamente
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-200">
              Tem certeza que deseja excluir a OS {orderToDelete?.orderNumber}?
            </p>
            <p className="mt-1 text-slate-300">
              Cliente: <strong className="text-white">{orderToDelete?.party?.name || 'Cliente'}</strong>
              <br />
              Valor: <strong className="text-white">{orderToDelete ? formatCurrency(orderToDelete.totalAmount) : ''}</strong>
            </p>
          </div>
        </div>
      </Modal>

      {/* Stage Action Modal */}
      <StageActionModal
        isOpen={stageModalData.isOpen}
        onClose={() => setStageModalData({ isOpen: false, stageId: null, stageName: null, orderNumber: null })}
        stageId={stageModalData.stageId}
        stageName={stageModalData.stageName}
        orderNumber={stageModalData.orderNumber}
      />
    </div>
  );
};

