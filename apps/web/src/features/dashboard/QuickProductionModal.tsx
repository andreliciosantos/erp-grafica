import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { NumberInput } from '../../components/common/NumberInput';
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
  SlidersHorizontal,
  Package,
} from 'lucide-react';
import { PaymentMethod, WorkOrderStatus, QuickServicePresetItem, RawMaterialItem, PaginatedResult } from '../../types';
import { QuickPresetsManagerModal } from './QuickPresetsManagerModal';

export interface QuickServiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  rawMaterialId?: string | null;
  materialQuantity?: number;
}

export const FALLBACK_PRESETS: {
  id: string;
  name: string;
  category: string;
  defaultPrice: number;
  materialConsumeQty?: number;
}[] = [
  { id: 'fb-1', name: 'Xerox P&B A4', category: 'Xerox', defaultPrice: 0.5, materialConsumeQty: 1 },
  { id: 'fb-2', name: 'Xerox Colorida A4', category: 'Xerox', defaultPrice: 2.0, materialConsumeQty: 1 },
  { id: 'fb-3', name: 'Impressão P&B A4', category: 'Impressão', defaultPrice: 1.0, materialConsumeQty: 1 },
  { id: 'fb-4', name: 'Impressão Colorida A4', category: 'Impressão', defaultPrice: 2.5, materialConsumeQty: 1 },
  { id: 'fb-5', name: 'Plastificação Polaseal A4', category: 'Acabamento', defaultPrice: 5.0, materialConsumeQty: 1 },
  { id: 'fb-6', name: 'Plastificação RG / Crachá', category: 'Acabamento', defaultPrice: 4.0, materialConsumeQty: 1 },
  { id: 'fb-7', name: 'Encadernação Espiral', category: 'Acabamento', defaultPrice: 8.0, materialConsumeQty: 1 },
  { id: 'fb-8', name: 'Foto 3x4 (Cartela c/ 6)', category: 'Foto & Scan', defaultPrice: 15.0, materialConsumeQty: 1 },
  { id: 'fb-9', name: 'Digitalização / Scan de Doc', category: 'Foto & Scan', defaultPrice: 1.0, materialConsumeQty: 0 },
];

function getPresetIcon(category: string, name = '') {
  const cat = category.toLowerCase();
  const n = name.toLowerCase();
  if (cat.includes('xerox')) return <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />;
  if (cat.includes('impress') || n.includes('impress')) return <Printer className="w-3.5 h-3.5 text-emerald-500" />;
  if (n.includes('plast')) return <Shield className="w-3.5 h-3.5 text-amber-500" />;
  if (n.includes('encadern')) return <BookOpen className="w-3.5 h-3.5 text-blue-500" />;
  if (n.includes('refil') || n.includes('corte')) return <Scissors className="w-3.5 h-3.5 text-rose-500" />;
  if (n.includes('foto')) return <Camera className="w-3.5 h-3.5 text-purple-500" />;
  if (n.includes('scan') || n.includes('digit')) return <Scan className="w-3.5 h-3.5 text-cyan-500" />;
  return <Zap className="w-3.5 h-3.5 text-indigo-500" />;
}

export interface DisplayPreset {
  id: string;
  name: string;
  category: string;
  defaultPrice: number;
  rawMaterialId?: string | null;
  materialConsumeQty?: number;
  rawMaterial?: {
    id: string;
    name: string;
    unitOfMeasure: string;
    currentStock: number;
  } | null;
}

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

  // Modal de gerenciamento de modelos prontos
  const [isPresetsManagerOpen, setIsPresetsManagerOpen] = useState(false);

  // Custom service line
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customPrice, setCustomPrice] = useState(5);
  const [customMaterialId, setCustomMaterialId] = useState('');
  const [customMaterialQty, setCustomMaterialQty] = useState(1);

  // Filter category for presets
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');

  // Buscar modelos do backend
  const { data: dbPresets = [] } = useQuery<QuickServicePresetItem[]>({
    queryKey: ['quick-service-presets', 'active'],
    queryFn: async () => {
      const res = await api.get('/quick-service-presets');
      return res.data;
    },
    enabled: isOpen,
  });

  // Buscar materiais cadastrados no estoque
  const { data: rawMaterialsData } = useQuery<PaginatedResult<RawMaterialItem>>({
    queryKey: ['raw-materials-select'],
    queryFn: async () => {
      const res = await api.get('/raw-materials?limit=200');
      return res.data;
    },
    enabled: isOpen,
  });

  const rawMaterials: RawMaterialItem[] = Array.isArray(rawMaterialsData?.data)
    ? rawMaterialsData.data
    : Array.isArray(rawMaterialsData)
    ? (rawMaterialsData as unknown as RawMaterialItem[])
    : [];

  const rawPresets = Array.isArray(dbPresets)
    ? dbPresets
    : Array.isArray((dbPresets as any)?.data)
    ? (dbPresets as any).data
    : [];

  const presetsList: DisplayPreset[] = (rawPresets.length > 0 ? rawPresets : FALLBACK_PRESETS) as DisplayPreset[];

  // Categorias disponíveis
  const availableCategories: string[] = [
    'TODOS',
    ...Array.from(new Set(presetsList.map((p) => String(p.category)))),
  ];

  // Adicionar ou incrementar preset
  const handleAddPreset = (preset: {
    id: string;
    name: string;
    category: string;
    defaultPrice: number;
    rawMaterialId?: string | null;
    materialConsumeQty?: number;
  }) => {
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
          unitPrice: Number(preset.defaultPrice),
          rawMaterialId: preset.rawMaterialId || null,
          materialQuantity: preset.materialConsumeQty ? Number(preset.materialConsumeQty) : 1,
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
        rawMaterialId: customMaterialId ? customMaterialId : null,
        materialQuantity: customMaterialId ? Math.max(1, Math.round(customMaterialQty)) : 1,
      },
    ]);
    setCustomName('');
    setCustomQty(1);
    setCustomPrice(5);
    setCustomMaterialId('');
    setCustomMaterialQty(1);
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

  // Alterar material consumido do item
  const handleUpdateItemMaterial = (id: string, rawMaterialId: string | null) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            rawMaterialId: rawMaterialId || null,
            materialQuantity: item.materialQuantity ?? 1,
          };
        }
        return item;
      })
    );
  };

  // Alterar quantidade de material por unidade
  const handleUpdateItemMaterialQty = (id: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const cleanQty = Math.max(1, Math.round(qty));
          return {
            ...item,
            materialQuantity: cleanQty,
          };
        }
        return item;
      })
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
          itemTotalAmount: Number((it.quantity * it.unitPrice).toFixed(2)),
          rawMaterialId: it.rawMaterialId || undefined,
          materialQuantity: it.rawMaterialId ? (it.materialQuantity ?? 1) : 0,
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
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow-summary'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials-select'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
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
      ? presetsList
      : presetsList.filter((p) => p.category === activeCategory);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleResetModal}
        title="Produção Rápida de Balcão"
        description="Lançamento expresso sem necessidade de cadastro de cliente e com baixa automática de estoque"
        maxWidth="3xl"
        footer={
          !successOrderNumber ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
              <div>
                <p className="text-[10px] text-slate-400 font-medium leading-none">Total a Cobrar</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">
                    {formatCurrency(totalAmount)}
                  </span>
                  <span className="text-xs text-slate-400 leading-none">({totalQuantity} unidades)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={handleResetModal}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => createQuickOrderMutation.mutate()}
                  isLoading={createQuickOrderMutation.isPending}
                  disabled={items.length === 0}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-950/20 px-4"
                >
                  <Zap className="w-4 h-4 mr-1.5" />
                  Concluir Produção Rápida
                </Button>
              </div>
            </div>
          ) : null
        }
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
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Insumos e materiais vinculados foram descontados do estoque com sucesso.
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
          <div className="space-y-3">

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Atalhos Rápidos (Presets) */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Modelos Prontos de Serviços
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPresetsManagerOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs"
                    title="Criar ou excluir modelos prontos de serviços rápidos"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    Gerenciar Modelos
                  </button>
                </div>

                {/* Categorias */}
                <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-1 max-w-full">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
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
                {filteredPresets.map((preset) => {
                  const hasStockWarning = Boolean(
                    preset.rawMaterial && Number(preset.rawMaterial.currentStock) <= 0
                  );

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all text-left group shadow-2xs"
                      title={
                        preset.rawMaterial
                          ? `Clique para adicionar. Consome ${Number(preset.materialConsumeQty || 1)} de ${preset.rawMaterial.name}`
                          : 'Clique para adicionar +1 à lista'
                      }
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 transition-colors">
                          {getPresetIcon(preset.category, preset.name)}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate leading-snug">
                            {preset.name}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {formatCurrency(Number(preset.defaultPrice))}
                            </span>
                            {hasStockWarning && (
                              <span className="text-[9px] text-rose-500 font-bold">Sem estoque</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-1 transition-colors" />
                    </button>
                  );
                })}
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
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-end gap-2">
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Material Consumido do Estoque (Opcional)
                        </label>
                        <select
                          value={customMaterialId}
                          onChange={(e) => setCustomMaterialId(e.target.value)}
                          className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-700 dark:text-slate-200"
                        >
                          <option value="">(Nenhum insumo / Somente mão de obra)</option>
                          {rawMaterials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} — Disp: {Number(m.currentStock).toLocaleString()} {m.unitOfMeasure}
                            </option>
                          ))}
                        </select>
                      </div>

                      {customMaterialId && (
                        <div>
                          <NumberInput
                            label="Consumo por unidade de serviço"
                            value={customMaterialQty}
                            min={1}
                            step={1}
                            onChangeValue={(val) => setCustomMaterialQty(Math.max(1, Math.round(val)))}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-1 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCustomInput(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm">
                        Adicionar
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Lista de Itens Lançados (Caixa do Serviço com Material Consumido) */}
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
                <div className="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 space-y-1">
                  <p className="text-xs font-medium">Nenhum serviço selecionado ainda.</p>
                  <p className="text-[11px]">
                    Clique nos modelos acima ou adicione um serviço avulso para iniciar o atendimento.
                  </p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {items.map((item) => {
                    const selectedMat = rawMaterials.find((m) => m.id === item.rawMaterialId);
                    const consumePerUnit = item.materialQuantity ?? 1;
                    const totalConsumed = selectedMat ? Math.ceil(item.quantity * consumePerUnit) : 0;
                    const isStockShortage = selectedMat && Number(selectedMat.currentStock) < totalConsumed;

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        {/* Linha Principal do Serviço */}
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs">
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

                        {/* Linha do Material Consumido na Mesma Caixa */}
                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-800/40 -mx-3 -mb-3 p-3 rounded-b-2xl space-y-2 text-[11px]">
                          {/* Cabeçalho da seção com identificação e status do estoque */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                              <Package className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>Material gasto:</span>
                            </div>

                            {item.rawMaterialId && selectedMat && (
                              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  Total: <strong className="text-slate-900 dark:text-slate-100">{totalConsumed} {selectedMat.unitOfMeasure}</strong>
                                </span>
                                {isStockShortage ? (
                                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900">
                                    ⚠️ Saldo insuficiente ({Number(selectedMat.currentStock).toLocaleString()} {selectedMat.unitOfMeasure})
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-medium border border-emerald-200/50 dark:border-emerald-800/50">
                                    ✓ Estoque: {Number(selectedMat.currentStock).toLocaleString()} {selectedMat.unitOfMeasure}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Controles: Seletor de Matéria-Prima e Quantidade por Unidade em Grid Sem Sobreposição */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <div className={item.rawMaterialId && selectedMat ? 'sm:col-span-8' : 'sm:col-span-12'}>
                              <select
                                value={item.rawMaterialId || ''}
                                onChange={(e) => handleUpdateItemMaterial(item.id, e.target.value || null)}
                                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                              >
                                <option value="">(Sem consumo de matéria-prima)</option>
                                {rawMaterials.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} — Estoque: {Number(m.currentStock).toLocaleString()} {m.unitOfMeasure}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {item.rawMaterialId && selectedMat && (
                              <div className="sm:col-span-4 flex items-center justify-between sm:justify-end gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 shadow-2xs">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                  Gasto/un:
                                </span>
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateItemMaterialQty(
                                          item.id,
                                          Math.max(1, (item.materialQuantity ?? 1) - 1)
                                        )
                                      }
                                      className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                      title="Diminuir gasto por unidade"
                                      aria-label="Diminuir gasto de material"
                                    >
                                      <Minus className="w-2.5 h-2.5" />
                                    </button>
                                    <input
                                      type="number"
                                      min={1}
                                      step={1}
                                      value={item.materialQuantity ?? 1}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        handleUpdateItemMaterialQty(item.id, isNaN(val) ? 1 : Math.max(1, val));
                                      }}
                                      onWheel={(e) => (e.target as HTMLElement).blur()}
                                      className="w-8 text-center text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent border-0 p-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      title="Quantidade de material gasta por unidade deste serviço"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateItemMaterialQty(
                                          item.id,
                                          (item.materialQuantity ?? 1) + 1
                                        )
                                      }
                                      className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                      title="Aumentar gasto por unidade"
                                      aria-label="Aumentar gasto de material"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                                    {selectedMat.unitOfMeasure}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 text-xs">
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
                      className={`py-1 px-1.5 rounded-xl font-medium border flex items-center justify-center gap-1 transition-all text-xs ${
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
                    className={`py-1.5 px-2 rounded-xl font-medium border flex items-center gap-1.5 transition-all ${
                      deliveryStatus === WorkOrderStatus.DELIVERED
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-[11px]">Entregue na Hora</p>
                      <p className="text-[9px] opacity-80">Retirada imediata</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryStatus(WorkOrderStatus.PENDING)}
                    className={`py-1.5 px-2 rounded-xl font-medium border flex items-center gap-1.5 transition-all ${
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
          </div>
        )}
      </Modal>

      {/* Modal de Gerenciamento de Modelos Prontos */}
      <QuickPresetsManagerModal
        isOpen={isPresetsManagerOpen}
        onClose={() => setIsPresetsManagerOpen(false)}
      />
    </>
  );
};
