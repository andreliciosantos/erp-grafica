import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { NumberInput } from '../../components/common/NumberInput';
import { PaginatedResult, PartyItem, WorkOrderItem } from '../../types';
import { AlertCircle, PlusCircle, Edit3 } from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: WorkOrderItem | null;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  orderToEdit,
}) => {
  const queryClient = useQueryClient();

  const [partyId, setPartyId] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number>(1000);
  const [priority, setPriority] = useState<number>(2);
  const [deliveryDays, setDeliveryDays] = useState<number>(5);
  const [totalAmount, setTotalAmount] = useState<number>(150);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch clients
  const { data: partiesData } = useQuery<PaginatedResult<PartyItem>>({
    queryKey: ['parties-select'],
    queryFn: async () => {
      const res = await api.get('/parties?limit=100');
      return res.data;
    },
    enabled: isOpen,
  });

  const parties = partiesData?.data || [];

  // Populate data when editing
  useEffect(() => {
    if (orderToEdit && isOpen) {
      setPartyId(orderToEdit.partyId || (orderToEdit.party?.id ?? ''));
      setPriority(orderToEdit.priority || 2);
      setTotalAmount(Number(orderToEdit.totalAmount) || 150);
      const days = orderToEdit.deliveryDate
        ? Math.max(1, Math.round((new Date(orderToEdit.deliveryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 5;
      setDeliveryDays(days);

      api.get(`/work-orders/${orderToEdit.id}`)
        .then((res) => {
          const full = res.data;
          const firstItem = full?.quote?.items?.[0];
          if (firstItem?.productName) {
            setProductName(firstItem.productName);
          }
          if (firstItem?.quantity) {
            setQuantity(firstItem.quantity);
          }
          if (full?.quote?.notes) {
            setNotes(full.quote.notes);
          }
          if (full?.partyId) {
            setPartyId(full.partyId);
          }
          if (full?.priority) {
            setPriority(full.priority);
          }
          if (full?.totalAmount) {
            setTotalAmount(Number(full.totalAmount));
          }
        })
        .catch(() => {});
    } else if (!orderToEdit && isOpen) {
      setPartyId('');
      setProductName('');
      setQuantity(1000);
      setPriority(2);
      setDeliveryDays(5);
      setTotalAmount(150);
      setNotes('');
    }
    setErrorMsg(null);
  }, [orderToEdit, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!partyId) throw new Error('Selecione um cliente.');
      if (!productName.trim()) throw new Error('Informe o nome/descrição do produto.');
      if (quantity <= 0) throw new Error('Quantidade deve ser maior que 0.');

      const payload = {
        partyId,
        productName: productName.trim(),
        quantity: Number(quantity),
        priority: Number(priority),
        deliveryDays: Number(deliveryDays),
        totalAmount: Number(totalAmount),
        notes: notes.trim() || undefined,
      };

      if (orderToEdit) {
        const res = await api.put(`/work-orders/${orderToEdit.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/work-orders', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      onClose();
      setPartyId('');
      setProductName('');
      setQuantity(1000);
      setPriority(2);
      setDeliveryDays(5);
      setTotalAmount(150);
      setNotes('');
      setErrorMsg(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const message = error.response?.data?.message || error.message || 'Erro ao salvar pedido.';
      setErrorMsg(Array.isArray(message) ? message.join(' ') : message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    saveMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={orderToEdit ? `Editar Ordem de Serviço: ${orderToEdit.orderNumber}` : "Novo Pedido / Ordem de Serviço"}
      description={orderToEdit ? "Altere as especificações comerciais e técnicas da ordem de produção" : "Cadastre uma ordem de produção diretamente no Chão de Fábrica"}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={saveMutation.isPending}
            type="button"
          >
            {orderToEdit ? (
              <>
                <Edit3 className="w-4 h-4 mr-1.5" />
                Atualizar Ordem de Serviço
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Criar Ordem de Serviço
              </>
            )}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
            Cliente <span className="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <select
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
            required
          >
            <option value="">Selecione um cliente...</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.tradeName ? `(${p.tradeName})` : ''} - {p.document}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
            Descrição do Produto / Serviço <span className="text-rose-500 dark:text-rose-400">*</span>
          </label>
          <Input
            placeholder="Ex: Panfleto 10x15cm 4x0 couchê 90g, Cartão de Visita, Banner 2x1m"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="Quantidade"
            suffix="un"
            min={1}
            value={quantity}
            onChangeValue={setQuantity}
            required
          />

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
              Prioridade da Produção
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
            >
              <option value={1}>1 - Baixa</option>
              <option value={2}>2 - Normal</option>
              <option value={3}>3 - Alta</option>
              <option value={4}>4 - Urgente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label="Prazo de Entrega"
            suffix="dias"
            min={1}
            value={deliveryDays}
            onChangeValue={setDeliveryDays}
            required
          />

          <CurrencyInput
            label="Valor Total"
            value={totalAmount}
            onChangeValue={setTotalAmount}
            required
          />
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
            Observações Técnicas / Acabamentos
          </label>
          <textarea
            rows={2}
            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
            placeholder="Ex: Laminação fosca frente, refilar no formato final, embalar em pacotes de 100un."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
