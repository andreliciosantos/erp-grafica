import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { formatCurrency } from '../../lib/utils';
import { OperatingExpenseItem, PaymentMethod } from '../../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PayExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: OperatingExpenseItem | null;
  onSuccess?: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.PIX, label: 'PIX Instantâneo' },
  { value: PaymentMethod.BOLETO, label: 'Boleto Bancário' },
  { value: PaymentMethod.BANK_TRANSFER, label: 'Transferência / TED / DOC' },
  { value: PaymentMethod.CREDIT_CARD, label: 'Cartão de Crédito' },
  { value: PaymentMethod.DEBIT_CARD, label: 'Cartão de Débito' },
  { value: PaymentMethod.AUTO_DEBIT, label: 'Débito Automático em Conta' },
  { value: PaymentMethod.CASH, label: 'Dinheiro em Espécie' },
];

export const PayExpenseModal: React.FC<PayExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [paidAt, setPaidAt] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (expense) {
      const today = new Date().toISOString().split('T')[0];
      setPaidAt(today);
      setPaidAmount(expense.amount);
      setPaymentMethod(expense.paymentMethod || PaymentMethod.PIX);
      setNotes('');
      setErrorMessage(null);
    }
  }, [expense]);

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!expense) return;
      const res = await api.patch(`/operating-expenses/${expense.id}/pay`, {
        paidAt: new Date(`${paidAt}T12:00:00.000Z`).toISOString(),
        paidAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['operating-expenses-summary'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Falha ao registrar liquidação da despesa.';
      setErrorMessage(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  if (!expense) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Liquidar Despesa Operacional"
      description={`Confirmação de pagamento para: ${expense.description}`}
      maxWidth="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          payMutation.mutate();
        }}
        className="space-y-4"
      >
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Valor Original:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{formatCurrency(expense.amount)}</span>
          </div>
          {expense.beneficiaryName && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Favorecido / Credor:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{expense.beneficiaryName}</span>
            </div>
          )}
          {expense.supplier && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Fornecedor Vinculado:</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{expense.supplier.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CurrencyInput
            label="Valor Efetivamente Pago"
            value={paidAmount}
            onChangeValue={setPaidAmount}
            required
          />

          <Input
            label="Data do Pagamento"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            required
          />
        </div>

        {Math.abs(paidAmount - expense.amount) > 0.005 && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
              paidAmount < expense.amount
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
            }`}
          >
            <span className="font-medium">
              {paidAmount < expense.amount ? 'Economia / Desconto obtido:' : 'Acréscimo de Juros / Multa:'}
            </span>
            <span className="font-bold">
              {paidAmount < expense.amount
                ? `- ${formatCurrency(expense.amount - paidAmount)}`
                : `+ ${formatCurrency(paidAmount - expense.amount)}`}
            </span>
          </div>
        )}

        <Select
          label="Forma de Pagamento"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          options={PAYMENT_METHODS}
          required
        />

        <Input
          label="Observações / Comprovante (Opcional)"
          placeholder="Ex: Pago via terminal Santander, autenticação nº 9841..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={payMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            {payMutation.isPending ? 'Liquidando...' : 'Confirmar Pagamento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
