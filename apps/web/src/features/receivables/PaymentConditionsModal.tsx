import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { PaymentConditionItem } from '@erp/shared-types';
import { formatCurrency } from '../../lib/utils';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Star,
  AlertCircle,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface PaymentConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCondition?: (condition: PaymentConditionItem) => void;
}

export const PaymentConditionsModal: React.FC<PaymentConditionsModalProps> = ({
  isOpen,
  onClose,
  onSelectCondition,
}) => {
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(0);
  const [intervalDays, setIntervalDays] = useState<number>(30);
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch conditions
  const { data: conditions = [], isLoading } = useQuery<PaymentConditionItem[]>({
    queryKey: ['payment-conditions'],
    queryFn: async () => {
      const res = await api.get('/payment-conditions?activeOnly=false');
      return res.data;
    },
    enabled: isOpen,
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setInstallmentsCount(3);
    setDownPaymentPercent(0);
    setIntervalDays(30);
    setIsDefault(false);
    setEditingId(null);
    setIsEditing(false);
    setFormError(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsEditing(true);
  };

  const handleStartEdit = (item: PaymentConditionItem) => {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description || '');
    setInstallmentsCount(item.installmentsCount);
    setDownPaymentPercent(Number(item.downPaymentPercent) || 0);
    setIntervalDays(item.intervalDays || 30);
    setIsDefault(item.isDefault);
    setIsEditing(true);
    setFormError(null);
  };

  // Create or Update mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Nome da condição é obrigatório.');
      if (installmentsCount < 1) throw new Error('Mínimo de 1 parcela.');

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        installmentsCount: Number(installmentsCount),
        downPaymentPercent: Number(downPaymentPercent) || 0,
        intervalDays: Number(intervalDays) || 30,
        isDefault: Boolean(isDefault),
      };

      if (editingId) {
        const res = await api.put(`/payment-conditions/${editingId}`, payload);
        return res.data;
      } else {
        const res = await api.post('/payment-conditions', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-conditions'] });
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || err.message || 'Erro ao salvar condição.');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/payment-conditions/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-conditions'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Erro ao excluir condição de pagamento.');
    },
  });

  // Toggle Default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (item: PaymentConditionItem) => {
      const res = await api.put(`/payment-conditions/${item.id}`, { isDefault: true });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-conditions'] });
    },
  });

  // Calculation simulation preview for R$ 1.000,00
  const simulationAmount = 1000;
  const simulationInstallments = React.useMemo(() => {
    const list: Array<{ number: number; label: string; amount: number; days: number }> = [];
    const count = Math.max(1, Number(installmentsCount) || 1);
    const downPercent = Math.min(100, Math.max(0, Number(downPaymentPercent) || 0));
    const interval = Math.max(1, Number(intervalDays) || 30);

    if (downPercent > 0) {
      const downAmount = Math.round((simulationAmount * (downPercent / 100)) * 100) / 100;
      list.push({
        number: 1,
        label: `Sinal / Entrada (${downPercent}%)`,
        amount: downAmount,
        days: 0,
      });

      const remainingInstallments = count - 1;
      if (remainingInstallments > 0) {
        const remainingTotal = simulationAmount - downAmount;
        const each = Math.round((remainingTotal / remainingInstallments) * 100) / 100;
        for (let i = 1; i <= remainingInstallments; i++) {
          const isLast = i === remainingInstallments;
          const currentAmount = isLast
            ? Math.round((remainingTotal - each * (remainingInstallments - 1)) * 100) / 100
            : each;
          list.push({
            number: i + 1,
            label: `Parcela ${i + 1}/${count}`,
            amount: currentAmount,
            days: i * interval,
          });
        }
      }
    } else {
      const each = Math.round((simulationAmount / count) * 100) / 100;
      for (let i = 1; i <= count; i++) {
        const isLast = i === count;
        const currentAmount = isLast
          ? Math.round((simulationAmount - each * (count - 1)) * 100) / 100
          : each;
        list.push({
          number: i,
          label: `Parcela ${i}/${count}`,
          amount: currentAmount,
          days: (i - 1) * interval,
        });
      }
    }
    return list;
  }, [installmentsCount, downPaymentPercent, intervalDays]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Condições de Pagamento e Parcelamento"
      description="Gerencie os padrões de parcelamento e faturamento de acesso rápido disponíveis na geração de orçamentos."
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Toggle Form / List Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {conditions.length} modelo(s) cadastrado(s)
            </span>
          </div>
          {!isEditing ? (
            <Button size="sm" onClick={handleStartCreate} className="text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nova Condição de Pagamento
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={resetForm} className="text-xs h-8">
              Cancelar Edição
            </Button>
          )}
        </div>

        {/* Inline Form */}
        {isEditing && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10 space-y-4 transition-all">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                {editingId ? 'Editar Condição de Pagamento' : 'Cadastrar Nova Condição'}
              </h3>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Nome da Condição *"
                  placeholder="Ex: Sinal 50% + 50% na Entrega, 4x Sem Juros (30/60/90/120d)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Descrição Comercial / Observação (Opcional)"
                  placeholder="Ex: Pagamento da entrada via PIX no pedido e restante faturado em boleto"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Número de Parcelas *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <span className="text-xs text-slate-500 font-semibold">vezes</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Entrada / Sinal (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <span className="text-xs text-slate-500 font-semibold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Intervalo entre Parcelas (Dias)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Math.max(1, Number(e.target.value)))}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <span className="text-xs text-slate-500 font-semibold">dias</span>
                </div>
              </div>

              <div className="flex items-center mt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Definir como Condição Padrão nos Orçamentos
                </label>
              </div>
            </div>

            {/* Simulation Preview */}
            <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Simulação Dinâmica para Pedido de R$ 1.000,00:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {simulationInstallments.map((inst) => (
                  <div
                    key={inst.number}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center"
                  >
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {inst.label}
                    </p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(inst.amount)}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {inst.days === 0 ? 'No Pedido (Hoje)' : `+${inst.days} dias`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={resetForm} className="text-xs">
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => saveMutation.mutate()}
                isLoading={saveMutation.isPending}
                className="text-xs"
              >
                {editingId ? 'Salvar Alterações' : 'Cadastrar Condição'}
              </Button>
            </div>
          </div>
        )}

        {/* Conditions List */}
        <div className="space-y-2.5">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Carregando condições de pagamento...
            </div>
          ) : conditions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Nenhuma condição de pagamento cadastrada. Clique em &ldquo;Nova Condição&rdquo; acima.
            </div>
          ) : (
            conditions.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.isDefault
                    ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {item.name}
                    </span>
                    {item.isDefault && (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Padrão
                      </Badge>
                    )}
                    <Badge variant="neutral" className="text-[10px] px-1.5 py-0.5">
                      {item.installmentsCount}x
                    </Badge>
                    {Number(item.downPaymentPercent) > 0 && (
                      <Badge variant="info" className="text-[10px] px-1.5 py-0.5">
                        Sinal: {item.downPaymentPercent}%
                      </Badge>
                    )}
                    {item.intervalDays > 0 && item.installmentsCount > 1 && (
                      <Badge variant="neutral" className="text-[10px] px-1.5 py-0.5">
                        A cada {item.intervalDays}d
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {onSelectCondition && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectCondition(item)}
                      className="text-xs h-7 px-2.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Selecionar
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}

                  {!item.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDefaultMutation.mutate(item)}
                      className="text-xs h-7 px-2 text-slate-500 hover:text-amber-500"
                      title="Definir como padrão nos novos orçamentos"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(item)}
                    className="text-xs h-7 px-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    title="Editar condição"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja excluir a condição "${item.name}"?`)) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="text-xs h-7 px-2 text-slate-500 hover:text-rose-600"
                    title="Excluir condição"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
