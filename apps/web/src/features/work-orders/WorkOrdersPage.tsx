import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { formatCurrency, formatDate, getStatusConfig, getPriorityConfig, getWorkOrderProductName } from '../../lib/utils';
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
  Edit2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { WorkOrderItem, PaginatedResult } from '../../types';
import { CreateOrderModal } from './CreateOrderModal';
import { Modal } from '../../components/common/Modal';
import { JobTicketModal } from './JobTicketModal';

export const WorkOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrderItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<WorkOrderItem | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<WorkOrderItem | null>(null);
  const [ticketOrder, setTicketOrder] = useState<WorkOrderItem | null>(null);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

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

  const [confirmDeductionModal, setConfirmDeductionModal] = useState<{
    isOpen: boolean;
    order: WorkOrderItem | null;
    targetStatus: string;
  }>({
    isOpen: false,
    order: null,
    targetStatus: 'PRINTING',
  });

  const [feedbackNotification, setFeedbackNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

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
      setFeedbackNotification({
        type: 'success',
        message: 'Ordem de serviço excluída com sucesso.',
      });
      setTimeout(() => setFeedbackNotification(null), 3500);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      setFeedbackNotification({
        type: 'error',
        message: error.response?.data?.message || 'Falha ao excluir ordem de serviço.',
      });
      setTimeout(() => setFeedbackNotification(null), 4000);
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

  // Mutation to advance status with optimistic UI update
  const advanceMutation = useMutation({
    mutationFn: async ({ orderId, nextStatus }: { orderId: string; nextStatus: string }) => {
      const res = await api.patch(`/work-orders/${orderId}/status`, { status: nextStatus });
      return res.data;
    },
    onMutate: async ({ orderId, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['work-orders'] });
      const previousData = queryClient.getQueryData<PaginatedResult<WorkOrderItem>>(['work-orders']);

      if (previousData) {
        queryClient.setQueryData<PaginatedResult<WorkOrderItem>>(['work-orders'], {
          ...previousData,
          data: previousData.data.map((order) =>
            order.id === orderId ? { ...order, status: nextStatus } : order
          ),
        });
      }

      return { previousData };
    },
    onError: (err: unknown, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['work-orders'], context.previousData);
      }
      const error = err as { response?: { data?: { message?: string } } };
      setFeedbackNotification({
        type: 'error',
        message: error.response?.data?.message || 'Transição de etapa não permitida.',
      });
      setTimeout(() => setFeedbackNotification(null), 4000);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
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
      setConfirmDeductionModal({
        isOpen: true,
        order,
        targetStatus: 'PRINTING',
      });
      return;
    }

    advanceMutation.mutate({ orderId: order.id, nextStatus });
  };

  const orders = data?.data || [];

  const handleDropOrder = (orderId: string, targetStatus: string) => {
    setDraggedOrderId(null);
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder || currentOrder.status === targetStatus) return;

    if (targetStatus === 'PRINTING' && currentOrder.status === 'PRE_PRESS') {
      setConfirmDeductionModal({
        isOpen: true,
        order: currentOrder,
        targetStatus: 'PRINTING',
      });
      return;
    }

    advanceMutation.mutate({ orderId, nextStatus: targetStatus });
  };

  const handleConfirmDeduction = () => {
    if (confirmDeductionModal.order) {
      advanceMutation.mutate({
        orderId: confirmDeductionModal.order.id,
        nextStatus: confirmDeductionModal.targetStatus,
      });
    }
    setConfirmDeductionModal({ isOpen: false, order: null, targetStatus: 'PRINTING' });
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const prodName = getWorkOrderProductName(o).toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(term) ||
      prodName.includes(term) ||
      o.party?.name?.toLowerCase().includes(term) ||
      o.barcode?.toLowerCase().includes(term)
    );
  });

  const kanbanColumns = [
    {
      id: 'PENDING',
      stepNumber: 1,
      title: 'Aguardando Liberação',
      shortTitle: 'Liberação',
      badgeBg: 'bg-amber-400',
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
      description: 'Análise comercial, validação financeira e liberação técnica para fila do PCP.',
    },
    {
      id: 'PRE_PRESS',
      stepNumber: 2,
      title: 'Pré-Impressão (CTP)',
      shortTitle: 'CTP / Pré',
      badgeBg: 'bg-blue-400',
      icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
      description: 'Fechamento de arquivo, imposição, sangrias, trapping e gravação de chapas offset.',
    },
    {
      id: 'PRINTING',
      stepNumber: 3,
      title: 'Impressão',
      shortTitle: 'Impressão',
      badgeBg: 'bg-indigo-400',
      icon: <Printer className="w-3.5 h-3.5 text-indigo-400" />,
      description: 'Tiragem em máquina offset/digital. Acerto de registro, carga de tinta e acerto de papel.',
    },
    {
      id: 'FINISHING',
      stepNumber: 4,
      title: 'Acabamento Gráfico',
      shortTitle: 'Acabamento',
      badgeBg: 'bg-purple-400',
      icon: <Scissors className="w-3.5 h-3.5 text-purple-400" />,
      description: 'Refile em guilhotina, laminação BOPP, verniz UV, dobra, vinco e encadernação.',
    },
    {
      id: 'QUALITY_CONTROL',
      stepNumber: 5,
      title: 'Controle de Qualidade',
      shortTitle: 'Qualidade',
      badgeBg: 'bg-cyan-400',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />,
      description: 'Inspeção dimensional, contagem, conferência densitométrica e aprovação de lote.',
    },
    {
      id: 'READY_FOR_PICKUP',
      stepNumber: 6,
      title: 'Pronto p/ Retirada',
      shortTitle: 'Retirada',
      badgeBg: 'bg-emerald-400',
      icon: <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />,
      description: 'Embalado e etiquetado com código de barras, aguardando expedição ou cliente.',
    },
    {
      id: 'DELIVERED',
      stepNumber: 7,
      title: 'Entregue / Concluído',
      shortTitle: 'Entregue',
      badgeBg: 'bg-green-500',
      icon: <Award className="w-3.5 h-3.5 text-green-400" />,
      description: 'Material entregue ao cliente e processo de produção concluído com sucesso.',
    },
  ];

  const scrollToColumn = (stageId: string) => {
    const colElement = document.getElementById(`kanban-col-${stageId}`);
    if (colElement) {
      colElement.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6 flex flex-col h-[calc(100vh-5.5rem)] sm:h-[calc(100vh-6.5rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <KanbanSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Chão de Fábrica & PCP</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
            Máquina de estados industrial e apontamento de produção com sincronização em tempo real
          </p>
        </div>

        {/* Action Button & View Switcher & Search */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/quotes/new')}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Pedido / Orçamento</span>
            <span className="sm:hidden">Novo Orçamento</span>
          </Button>

          <div className="flex-1 sm:flex-initial min-w-[130px] sm:w-56">
            <Input
              placeholder="Buscar OS, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('KANBAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'KANBAN'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabela</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Stage Carousel Pills Bar */}
      {viewMode === 'KANBAN' && (
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1.5 -mt-1 scrollbar-none shrink-0 touch-pan-x">
          {kanbanColumns.map((col) => {
            const count = filteredOrders.filter((o) => o.status === col.id).length;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => scrollToColumn(col.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 active:bg-emerald-50 dark:active:bg-slate-800 transition-all shadow-xs shrink-0"
              >
                <span className={`w-2 h-2 rounded-full ${col.badgeBg} shrink-0`} />
                <span>{col.shortTitle}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main View Area */}
      {viewMode === 'KANBAN' ? (
        <div className="flex-1 overflow-x-auto pb-4 flex gap-3 sm:gap-4 min-h-0 snap-x sm:snap-none snap-mandatory sm:snap-normal scroll-smooth">
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
                draggedOrderId={draggedOrderId}
                onDragStartOrder={(order) => setDraggedOrderId(order.id)}
                onDragEndOrder={() => setDraggedOrderId(null)}
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
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                Carregando ordens de serviço...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                Nenhuma ordem de serviço cadastrada.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                      <th className="pb-3 font-medium">Número OS</th>
                      <th className="pb-3 font-medium">Produto / Descrição</th>
                      <th className="pb-3 font-medium">Cliente</th>
                      <th className="pb-3 font-medium">Prioridade</th>
                      <th className="pb-3 font-medium">Status Atual</th>
                      <th className="pb-3 font-medium">Previsão de Entrega</th>
                      <th className="pb-3 font-medium">Valor Total</th>
                      <th className="pb-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                    {filteredOrders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      const priorityConfig = getPriorityConfig(order.priority);
                      const productName = getWorkOrderProductName(order);
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {order.orderNumber}
                          </td>
                          <td className="py-3.5 font-semibold text-slate-900 dark:text-slate-100 max-w-[240px] truncate" title={productName}>
                            {productName}
                          </td>
                          <td className="py-3.5 text-slate-800 dark:text-slate-200 font-medium">
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
                          <td className="py-3.5 text-slate-500 dark:text-slate-400">
                            {formatDate(order.deliveryDate)}
                          </td>
                          <td className="py-3.5 font-bold text-slate-800 dark:text-slate-100">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="py-3.5 text-right space-x-1.5">
                            <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ver Detalhes</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setTicketOrder(order)}
                              className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              title="Imprimir Ficha Técnica de Produção"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ficha</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setOrderToEdit(order);
                                setIsCreateModalOpen(true);
                              }}
                              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700"
                              title="Editar Ordem de Serviço"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setOrderToDelete(order)}
                              className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
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

      {/* Create / Edit Order Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setOrderToEdit(null);
        }}
        orderToEdit={orderToEdit}
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
        onEditOrder={(order) => {
          setOrderToEdit(order);
          setIsCreateModalOpen(true);
        }}
        onPrintJobTicket={(order) => {
          setTicketOrder(order);
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

      {/* Job Ticket Modal */}
      <JobTicketModal
        isOpen={Boolean(ticketOrder)}
        onClose={() => setTicketOrder(null)}
        order={ticketOrder}
      />

      {/* Modal Personalizado de Confirmação de Baixa de Insumos no Chão de Fábrica */}
      <Modal
        isOpen={confirmDeductionModal.isOpen}
        onClose={() => setConfirmDeductionModal({ isOpen: false, order: null, targetStatus: 'PRINTING' })}
        title="Confirmar Baixa de Insumos & Impressão"
        description="Movimentação para etapa de impressão no Chão de Fábrica"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="secondary"
              onClick={() => setConfirmDeductionModal({ isOpen: false, order: null, targetStatus: 'PRINTING' })}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
              onClick={handleConfirmDeduction}
              isLoading={advanceMutation.isPending}
            >
              <Printer className="w-4 h-4" />
              Confirmar e Baixar Insumos
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5">
          <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-800 dark:text-amber-300 text-xs">
            <Layers className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                Avançar OS {confirmDeductionModal.order?.orderNumber} para Impressão?
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Esta ação consumirá automaticamente do estoque as folhas de papel e insumos calculados para este pedido.
              </p>
            </div>
          </div>

          {confirmDeductionModal.order && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Cliente:</span>
                <strong className="text-slate-800 dark:text-slate-200">{confirmDeductionModal.order.party?.name || 'Cliente'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Valor da Ordem:</span>
                <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(confirmDeductionModal.order.totalAmount)}</strong>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Floating In-App Toast Notification */}
      {feedbackNotification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100">
          {feedbackNotification.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span className="flex-1">{feedbackNotification.message}</span>
          <button
            type="button"
            onClick={() => setFeedbackNotification(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

