import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import {
  ReceivableItem,
  PaymentMethod,
  PartyItem,
  PaginatedResult,
} from '../../types';
import { AlertCircle, Plus, Edit2, Calendar, User, FileText, Barcode } from 'lucide-react';

interface ReceivableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivableToEdit?: ReceivableItem | null;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { value: '', label: 'Não Definido (A definir no recebimento)' },
  { value: PaymentMethod.PIX, label: 'PIX Instantâneo' },
  { value: PaymentMethod.BOLETO, label: 'Boleto Bancário' },
  { value: PaymentMethod.CREDIT_CARD, label: 'Cartão de Crédito' },
  { value: PaymentMethod.DEBIT_CARD, label: 'Cartão de Débito' },
  { value: PaymentMethod.BANK_TRANSFER, label: 'Transferência / TED' },
  { value: PaymentMethod.CASH, label: 'Dinheiro em Espécie' },
];

export const ReceivableFormModal: React.FC<ReceivableFormModalProps> = ({
  isOpen,
  onClose,
  receivableToEdit,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [partyId, setPartyId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [installmentNumber, setInstallmentNumber] = useState<number>(1);
  const [totalInstallments, setTotalInstallments] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch registered parties (clients)
  const { data: partiesData } = useQuery<PaginatedResult<PartyItem>>({
    queryKey: ['parties-list-all'],
    queryFn: async () => {
      const res = await api.get('/parties?limit=100');
      return res.data;
    },
    enabled: isOpen,
  });

  const clientsList = (partiesData?.data || []).map((p) => ({
    value: p.id,
    label: `${p.name}${p.document ? ` (${p.document})` : ''}`,
  }));

  useEffect(() => {
    if (receivableToEdit) {
      setPartyId(receivableToEdit.partyId || '');
      setDescription(receivableToEdit.description || '');
      setAmount(Number(receivableToEdit.amount) || 0);
      setDueDate(receivableToEdit.dueDate ? receivableToEdit.dueDate.split('T')[0] : '');
      setInstallmentNumber(receivableToEdit.installmentNumber || 1);
      setTotalInstallments(receivableToEdit.totalInstallments || 1);
      setPaymentMethod(receivableToEdit.paymentMethod || '');
      setDocumentNumber(receivableToEdit.documentNumber || '');
      setBarcode(receivableToEdit.barcode || '');
      setNotes(receivableToEdit.notes || '');
    } else {
      setPartyId('');
      setDescription('');
      setAmount(0);
      setDueDate(new Date().toISOString().split('T')[0]);
      setInstallmentNumber(1);
      setTotalInstallments(1);
      setPaymentMethod('');
      setDocumentNumber('');
      setBarcode('');
      setNotes('');
    }
    setErrorMessage(null);
  }, [receivableToEdit, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!partyId) {
        throw new Error('Por favor, selecione o cliente sacado.');
      }
      if (!description.trim()) {
        throw new Error('A descrição do título é obrigatória.');
      }
      if (!amount || amount <= 0) {
        throw new Error('O valor do título deve ser maior que zero.');
      }
      if (!dueDate) {
        throw new Error('A data de vencimento é obrigatória.');
      }

      const payload = {
        partyId,
        description: description.trim(),
        amount: Number(amount.toFixed(2)),
        dueDate: new Date(`${dueDate}T12:00:00.000Z`).toISOString(),
        installmentNumber: Number(installmentNumber) || 1,
        totalInstallments: Number(totalInstallments) || 1,
        paymentMethod: paymentMethod ? (paymentMethod as PaymentMethod) : undefined,
        documentNumber: documentNumber.trim() || undefined,
        barcode: barcode.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (receivableToEdit) {
        const res = await api.put(`/receivables/${receivableToEdit.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/receivables', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['receivables-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-dre'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Falha ao salvar recebível.';
      setErrorMessage(msg);
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={receivableToEdit ? 'Editar Conta a Receber' : 'Nova Conta a Receber (Avulsa)'}
      description={
        receivableToEdit
          ? 'Atualize os dados e vencimento do título a receber'
          : 'Cadastre um recebimento de balcão, serviço avulso ou lançamento a prazo'
      }
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={saveMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="receivable-form"
            size="sm"
            isLoading={saveMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {receivableToEdit ? (
              <>
                <Edit2 className="w-4 h-4 mr-1.5" />
                Salvar Alterações
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1.5" />
                Cadastrar Recebível
              </>
            )}
          </Button>
        </div>
      }
    >
      <form
        id="receivable-form"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="space-y-3"
      >
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          {/* Cliente */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Cliente Sacado *
            </label>
            <Select
              options={[{ value: '', label: 'Selecione um cliente...' }, ...clientsList]}
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Descrição do Recebível *
            </label>
            <Input
              placeholder="Ex: Venda Balcão 1.000 Panfletos, Sinal Adesivos, Frete..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Valor e Vencimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Nominal (R$) *
              </label>
              <CurrencyInput
                value={amount}
                onChangeValue={(val) => setAmount(val)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data de Vencimento *
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Parcelas e Meio de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parcela Nº
              </label>
              <Input
                type="number"
                min={1}
                max={totalInstallments}
                value={installmentNumber}
                onChange={(e) => setInstallmentNumber(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total de Parcelas
              </label>
              <Input
                type="number"
                min={1}
                max={48}
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Meio Preferencial
              </label>
              <Select
                options={PAYMENT_METHODS}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </div>
          </div>

          {/* Documento e Código de Barras / Chave PIX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nº Documento / NF / Pedido
              </label>
              <Input
                placeholder="Ex: NF-e 1204 / Pedido 45"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-slate-400" />
                Linha Digitável ou PIX Copia-e-Cola
              </label>
              <Input
                placeholder="Código de barras ou chave PIX"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Instruções
            </label>
            <Input
              placeholder="Instruções de cobrança, dados bancários ou observações internas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
