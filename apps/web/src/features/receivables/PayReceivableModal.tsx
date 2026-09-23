import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { formatCurrency } from '../../lib/utils';
import { PaymentMethod, ReceivableItem } from '@erp/shared-types';
import { CheckCircle2, DollarSign, Calendar, AlertCircle } from 'lucide-react';

interface PayReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivable: ReceivableItem | null;
  onSuccess?: () => void;
}

export const PayReceivableModal: React.FC<PayReceivableModalProps> = ({
  isOpen,
  onClose,
  receivable,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [paidAt, setPaidAt] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!receivable) return;
      const res = await api.patch(`/receivables/${receivable.id}/pay`, {
        paidAt: new Date(`${paidAt}T12:00:00.000Z`).toISOString(),
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['receivables-summary'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dre'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Falha ao registrar recebimento.';
      setErrorMessage(msg);
    },
  });

  if (!receivable) return null;

  const paymentOptions = [
    { value: PaymentMethod.PIX, label: 'PIX' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Cartão de Crédito' },
    { value: PaymentMethod.DEBIT_CARD, label: 'Cartão de Débito' },
    { value: PaymentMethod.CASH, label: 'Dinheiro em Espécie' },
    { value: PaymentMethod.BOLETO, label: 'Boleto Bancário' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Transferência / TED' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Recebimento"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Info Banner */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg text-emerald-700 dark:text-emerald-400 mt-0.5">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 truncate">
              {receivable.description}
            </h4>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-emerald-700 dark:text-emerald-400">
              <span>Cliente: <strong>{receivable.party?.name || 'Cliente Avulso'}</strong></span>
              <span>•</span>
              <span>Valor: <strong className="text-sm">{formatCurrency(receivable.amount)}</strong></span>
              {receivable.totalInstallments > 1 && (
                <>
                  <span>•</span>
                  <span>Parcela: <strong>{receivable.installmentNumber}/{receivable.totalInstallments}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Data do Recebimento *
            </label>
            <Input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Meio de Pagamento *
            </label>
            <Select
              options={paymentOptions}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Observações do Recebimento (Opcional)
          </label>
          <Input
            placeholder="Ex: Recebido via PIX chave CNPJ, comprovante no WhatsApp..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose} disabled={payMutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => payMutation.mutate()}
            isLoading={payMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Confirmar Recebimento
          </Button>
        </div>
      </div>
    </Modal>
  );
};
