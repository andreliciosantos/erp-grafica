import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { formatCurrency } from '../../lib/utils';
import { PaymentMethod, ReceivableItem } from '@erp/shared-types';
import { CheckCircle2, DollarSign, Calendar, AlertCircle, Percent, PlusCircle } from 'lucide-react';

interface PayReceivableModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivable: ReceivableItem | null;
  onSuccess?: (paidItem?: ReceivableItem) => void;
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
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [surchargeAmount, setSurchargeAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (receivable) {
      setPaidAt(new Date().toISOString().split('T')[0]);
      setPaymentMethod(
        receivable.paymentMethod ? (receivable.paymentMethod as PaymentMethod) : PaymentMethod.PIX
      );
      setDiscountAmount(0);
      setSurchargeAmount(0);
      setNotes('');
      setErrorMessage(null);
    }
  }, [receivable, isOpen]);

  const nominalAmount = Number(receivable?.amount || 0);
  const finalAmount = Math.max(0, nominalAmount - discountAmount + surchargeAmount);

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!receivable) return;
      const res = await api.patch(`/receivables/${receivable.id}/pay`, {
        paidAt: new Date(`${paidAt}T12:00:00.000Z`).toISOString(),
        paymentMethod,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        surchargeAmount: surchargeAmount > 0 ? surchargeAmount : undefined,
        paidAmount: finalAmount,
        notes: notes.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: (data: ReceivableItem) => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['receivables-summary'] });
      queryClient.invalidateQueries({ queryKey: ['order-receivables'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dre'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      if (onSuccess) onSuccess(data);
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Falha ao registrar recebimento.';
      setErrorMessage(msg);
    },
  });

  if (!receivable) return null;

  const paymentOptions = [
    { value: PaymentMethod.PIX, label: 'PIX Instantâneo' },
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
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={payMutation.isPending}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => payMutation.mutate()}
            isLoading={payMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Confirmar Recebimento
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Info Banner */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg text-emerald-700 dark:text-emerald-400 mt-0.5">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 truncate">
              {receivable.description}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              <span>Cliente: <strong>{receivable.party?.name || 'Cliente Avulso'}</strong></span>
              <span>•</span>
              <span>Valor Nominal: <strong className="text-sm">{formatCurrency(nominalAmount)}</strong></span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
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
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Meio de Pagamento *
            </label>
            <Select
              options={paymentOptions}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            />
          </div>
        </div>

        {/* Descontos e Acréscimos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-amber-500" />
              Desconto Concedido (R$)
            </label>
            <CurrencyInput
              value={discountAmount}
              onChangeValue={(val) => setDiscountAmount(val)}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
              Juros / Acréscimo (R$)
            </label>
            <CurrencyInput
              value={surchargeAmount}
              onChangeValue={(val) => setSurchargeAmount(val)}
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Liquid Amount Highlight */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            Total Efetivamente Liquidado:
          </span>
          <span className="text-base font-bold text-emerald-900 dark:text-emerald-100">
            {formatCurrency(finalAmount)}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Observações do Recebimento (Opcional)
          </label>
          <Input
            placeholder="Ex: Recebido no balcão via PIX chave CNPJ, comprovante impresso..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
};

