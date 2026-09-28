import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { NumberInput } from '../../components/common/NumberInput';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../lib/utils';
import {
  Zap,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  FileText,
  Printer,
  Shield,
  BookOpen,
  Scissors,
  Camera,
  Scan,
  CreditCard,
  DollarSign,
  QrCode,
  Clock,
  Check,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { PaymentMethod, WorkOrderStatus } from '@erp/shared-types';

export interface QuickServiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface QuickPresetService {
  id: string;
  name: string;
  category: 'Xerox' | 'Impressão' | 'Acabamento' | 'Foto & Scan';
  defaultPrice: number;
  icon: React.ReactNode;
}

export const QUICK_SERVICE_PRESETS: QuickPresetService[] = [
  {
    id: 'xerox-pb-a4',
    name: 'Xerox P&B A4',
    category: 'Xerox',
    defaultPrice: 0.5,
    icon: <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />,
  },
  {
    id: 'xerox-col-a4',
    name: 'Xerox Colorida A4',
    category: 'Xerox',
    defaultPrice: 2.0,
    icon: <FileText className="w-3.5 h-3.5 text-indigo-500" />,
  },
  {
    id: 'imp-pb-a4',
    name: 'Impressão P&B A4',
    category: 'Impressão',
    defaultPrice: 1.0,
    icon: <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />,
  },
  {
    id: 'imp-col-a4',
    name: 'Impressão Colorida A4',
    category: 'Impressão',
    defaultPrice: 2.5,
    icon: <Printer className="w-3.5 h-3.5 text-emerald-500" />,
  },
  {
    id: 'imp-laser-a3',
    name: 'Impressão Laser A3 Color',
    category: 'Impressão',
    defaultPrice: 6.0,
    icon: <Printer className="w-3.5 h-3.5 text-teal-500" />,
  },
  {
    id: 'plast-polaseal-a4',
    name: 'Plastificação Polaseal A4',
    category: 'Acabamento',
    defaultPrice: 5.0,
    icon: <Shield className="w-3.5 h-3.5 text-amber-500" />,
  },
  {
    id: 'plast-polaseal-rg',
    name: 'Plastificação RG / Crachá',
    category: 'Acabamento',
    defaultPrice: 3.5,
    icon: <Shield className="w-3.5 h-3.5 text-amber-600" />,
  },
  {
    id: 'encadernacao-espiral',
    name: 'Encadernação Espiral',
    category: 'Acabamento',
    defaultPrice: 8.0,
    icon: <BookOpen className="w-3.5 h-3.5 text-blue-500" />,
  },
  {
    id: 'refile-corte',
    name: 'Refile / Corte Avulso',
    category: 'Acabamento',
    defaultPrice: 3.0,
    icon: <Scissors className="w-3.5 h-3.5 text-rose-500" />,
  },
  {
    id: 'foto-3x4',
    name: 'Foto 3x4 (Cartela c/ 6)',
    category: 'Foto & Scan',
    defaultPrice: 15.0,
    icon: <Camera className="w-3.5 h-3.5 text-purple-500" />,
  },
  {
    id: 'scan-doc',
    name: 'Digitalização / Scan de Doc',
    category: 'Foto & Scan',
    defaultPrice: 2.0,
    icon: <Scan className="w-3.5 h-3.5 text-cyan-500" />,
  },
];

interface QuickProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickProductionModal: React.FC<QuickProductionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const [items, setItems] = useState<QuickServiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'PENDING'>(PaymentMethod.PIX);
  const [deliveryStatus, setDeliveryStatus] = useState<WorkOrderStatus>(WorkOrderStatus.DELIVERED);
  const [clientNotes, setClientNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);

  // Custom service line
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customPrice, setCustomPrice] = useState(5);

  // Filter category for presets
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');

  // Adicionar ou incrementar preset
  const handleAddPreset = (preset: QuickPresetService) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.name === preset.name);
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: preset.name,
          quantity: 1,
          unitPrice: preset.defaultPrice,
        },
      ];
    });
    setErrorMessage(null);
  };

  // Adicionar serviço personalizado
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setErrorMessage('Informe a descrição do serviço personalizado.');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: customName.trim(),
        quantity: Math.max(1, customQty),
        unitPrice: Math.max(0, customPrice),
      },
    ]);
    setCustomName('');
    setCustomQty(1);
    setCustomPrice(5);
    setShowCustomInput(false);
    setErrorMessage(null);
  };

  // Alterar quantidade
  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as QuickServiceItem[]
    );
  };

  // Alterar preço unitário
  const handleUpdateUnitPrice = (id: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unitPrice: Math.max(0, newPrice) } : item))
    );
  };

  // Remover item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Limpar lista
  const handleClear = () => {
    setItems([]);
    setErrorMessage(null);
  };

  // Cálculos de totais
  const totalAmount = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const totalQuantity = items.reduce((acc, it) => acc + it.quantity, 0);

  // Mutação para salvar pedido rápido
  const createQuickOrderMutation = useMutation({
    mutationFn: async () => {
      if (items.length === 0) {
        throw new Error('Adicione ao menos um serviço para lançar a produção rápida.');
      }

      const payload = {
        items: items.map((it) => ({
          productName: it.name,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          itemTotalAmount: it.quantity * it.unitPrice,
        })),
        totalAmount: Number(totalAmount.toFixed(2)),
        status: deliveryStatus,
        paymentStatus: paymentMethod === 'PENDING' ? 'PENDING' : 'PAID',
        paymentMethod: paymentMethod === 'PENDING' ? undefined : paymentMethod,
        notes: clientNotes.trim() ? `[Produção Rápida] ${clientNotes.trim()}` : '[Produção Rápida de Balcão]',
      };

      const res = await api.post('/work-orders', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setSuccessOrderNumber(data.orderNumber || 'OS-BALCAO');
      queryClient.invalidateQueries({ queryKey: ['work-orders-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dre'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Falha ao lançar produção rápida.';
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleResetModal = () => {
    setItems([]);
    setSuccessOrderNumber(null);
    setErrorMessage(null);
    setClientNotes('');
    setPaymentMethod(PaymentMethod.PIX);
    setDeliveryStatus(WorkOrderStatus.DELIVERED);
    setShowCustomInput(false);
    onClose();
  };

  const filteredPresets =
    activeCategory === 'TODOS'
      ? QUICK_SERVICE_PRESETS
      : QUICK_SERVICE_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetModal}
      title="Produção Rápida de Balcão"
      description="Lançamento expresso sem necessidade de cadastro prévio de cliente"
      maxWidth="3xl"
    >
      {successOrderNumber ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Produção Rápida Concluída!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ordem de Serviço gerada:{' '}
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {successOrderNumber}
              </span>
            </p>
            <p className="text-xs text-slate-400">
              Valor Total: <strong>{formatCurrency(totalAmount)}</strong> ({totalQuantity} itens) •{' '}
              {paymentMethod === 'PENDING' ? 'A Pagar' : `Pago via ${paymentMethod}`}
            </p>
          </div>
          <div className="pt-4 flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setItems([]);
                setSuccessOrderNumber(null);
              }}
            >
              Novo Atendimento Rápido
            </Button>
            <Button size="sm" onClick={handleResetModal}>
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header informativo */}
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl text-xs text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Modo Balcão Ativo:</strong> Sem burocracia de cliente. Ideal para cópias,
                plastificações e impressões na hora.
              </span>
            </div>
            <Badge variant="warning" size="sm">
              Consumidor Avulso
            </Badge>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Atalhos Rápidos (Presets) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Adicionar Serviços Rápidos
              </span>
              {/* Categorias */}
              <div className="flex items-center gap-1 text-[11px]">
                {['TODOS', 'Xerox', 'Impressão', 'Acabamento', 'Foto & Scan'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                      activeCategory === cat
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Botões Rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all text-left group shadow-2xs"
                  title="Clique para adicionar +1 à lista"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 transition-colors">
                      {preset.icon}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate leading-snug">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatCurrency(preset.defaultPrice)}
                      </p>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-1 transition-colors" />
                </button>
              ))}
            </div>

            {/* Linha para adicionar serviço avulso customizado */}
            <div className="pt-1">
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Adicionar outro serviço personalizado (avulso)
                </button>
              ) : (
                <form
                  onSubmit={handleAddCustom}
                  className="flex items-end gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex-1">
                    <Input
                      label="Descrição do Serviço"
                      placeholder="Ex: Impressão Plotter A1 vegetal"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-24">
                    <NumberInput
                      label="Qtd"
                      min={1}
                      value={customQty}
                      onChangeValue={(val) => setCustomQty(val)}
                    />
                  </div>
                  <div className="w-28">
                    <CurrencyInput
                      label="Valor Unit."
                      value={customPrice}
                      onChangeValue={(val) => setCustomPrice(val)}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button type="submit" size="sm">
                      Adicionar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomInput(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Lista de Itens Lançados */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                Serviços no Atendimento ({items.length})
              </span>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Limpar lista
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 space-y-1">
                <p className="text-xs font-medium">Nenhum serviço selecionado ainda.</p>
                <p className="text-[11px]">
                  Clique nos botões de atalho acima para lançar cópias, impressões e serviços.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatCurrency(item.unitPrice)} un.
                        </p>
                      </div>

                      {/* Controle de Quantidade */}
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          title="Diminuir quantidade"
                          aria-label={`Diminuir ${item.name}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-slate-800 dark:text-slate-100 text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          title="Aumentar quantidade"
                          aria-label={`Aumentar ${item.name}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Preço Unitário Editável */}
                      <div className="w-24">
                        <CurrencyInput
                          value={item.unitPrice}
                          onChangeValue={(val) => handleUpdateUnitPrice(item.id, val)}
                          className="text-right py-1 h-8 text-xs"
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="w-20 text-right font-bold text-slate-800 dark:text-slate-100 text-xs">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>

                      {/* Remover */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Remover serviço"
                        aria-label={`Remover ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Opções Rápidas de Finalização */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Forma de Pagamento */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {[
                  { key: PaymentMethod.PIX, label: 'PIX', icon: <QrCode className="w-3 h-3" /> },
                  { key: PaymentMethod.CASH, label: 'Dinheiro', icon: <DollarSign className="w-3 h-3" /> },
                  { key: PaymentMethod.DEBIT_CARD, label: 'Débito', icon: <CreditCard className="w-3 h-3" /> },
                  { key: PaymentMethod.CREDIT_CARD, label: 'Crédito', icon: <CreditCard className="w-3 h-3" /> },
                  { key: 'PENDING', label: 'Pendente', icon: <Clock className="w-3 h-3" /> },
                ].map((pm) => (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => setPaymentMethod(pm.key as any)}
                    className={`py-1.5 px-2 rounded-xl font-medium border flex items-center justify-center gap-1 transition-all ${
                      paymentMethod === pm.key
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pm.icon}
                    <span className="truncate">{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Situação da Entrega */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Situação da Entrega
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDeliveryStatus(WorkOrderStatus.DELIVERED)}
                  className={`py-2 px-2.5 rounded-xl font-medium border flex items-center gap-1.5 transition-all ${
                    deliveryStatus === WorkOrderStatus.DELIVERED
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold text-[11px]">Entregue na Hora</p>
                    <p className="text-[9px] opacity-80">Retirada imediata balcão</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryStatus(WorkOrderStatus.PENDING)}
                  className={`py-2 px-2.5 rounded-xl font-medium border flex items-center gap-1.5 transition-all ${
                    deliveryStatus === WorkOrderStatus.PENDING
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold text-[11px]">Fila de Produção</p>
                    <p className="text-[9px] opacity-80">Aguardando fabricação</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Observação / Nome avulso */}
          <div>
            <Input
              label="Nome do Solicitante ou Obs (Opcional)"
              placeholder="Ex: João da Silva / Retira às 17h"
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
            />
          </div>

          {/* Footer de Ação com Totalizador */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Total a Cobrar</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(totalAmount)}
                </span>
                <span className="text-xs text-slate-400">({totalQuantity} unidades)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={handleResetModal}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => createQuickOrderMutation.mutate()}
                isLoading={createQuickOrderMutation.isPending}
                disabled={items.length === 0}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-950/20 px-5"
              >
                <Zap className="w-4 h-4 mr-1.5" />
                Concluir Produção Rápida
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
