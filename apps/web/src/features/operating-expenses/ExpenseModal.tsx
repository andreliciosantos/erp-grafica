import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import {
  OperatingExpenseItem,
  ExpenseCategory,
  ExpenseType,
  PaymentMethod,
  PartyItem,
  PaginatedResult,
} from '../../types';
import { AlertCircle, Plus, Edit2, Repeat } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: OperatingExpenseItem | null;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS = [
  { value: ExpenseCategory.RENT_FACILITIES, label: 'Aluguel & Estrutura (Galpão, IPTU)' },
  { value: ExpenseCategory.UTILITIES, label: 'Utilidades & Energia (Luz, Água, Internet)' },
  { value: ExpenseCategory.SOFTWARE_LICENSES, label: 'Softwares & Licenças (Adobe CC, RIPs, ERP)' },
  { value: ExpenseCategory.OFFICE_ADMINISTRATIVE, label: 'Administrativo & Contábil (Contabilidade, Copa)' },
  { value: ExpenseCategory.COMMERCIAL_MARKETING, label: 'Comercial & Marketing (Anúncios, Mostruários)' },
  { value: ExpenseCategory.MAINTENANCE_PREDIAL, label: 'Manutenção Predial (Elétrica, Compressores)' },
  { value: ExpenseCategory.FINANCIAL_TAXES, label: 'Tributos, Taxas & Bancos (Tarifas, AVCB)' },
  { value: ExpenseCategory.OTHER, label: 'Outras Despesas Operacionais' },
];

const TYPE_OPTIONS = [
  { value: ExpenseType.FIXED, label: 'Despesa Fixa (Estrutura mensal)' },
  { value: ExpenseType.VARIABLE, label: 'Despesa Variável (Consumo/Oscilante)' },
];

const PAYMENT_METHODS = [
  { value: PaymentMethod.BOLETO, label: 'Boleto Bancário' },
  { value: PaymentMethod.PIX, label: 'PIX Instantâneo' },
  { value: PaymentMethod.BANK_TRANSFER, label: 'Transferência / TED' },
  { value: PaymentMethod.CREDIT_CARD, label: 'Cartão de Crédito' },
  { value: PaymentMethod.DEBIT_CARD, label: 'Cartão de Débito' },
  { value: PaymentMethod.AUTO_DEBIT, label: 'Débito Automático' },
  { value: PaymentMethod.CASH, label: 'Dinheiro em Espécie' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.RENT_FACILITIES);
  const [expenseType, setExpenseType] = useState<ExpenseType>(ExpenseType.FIXED);
  const [amount, setAmount] = useState<number>(0);
  const [competenceDate, setCompetenceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState('MONTHLY');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.BOLETO);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch registered suppliers for optional dropdown linking
  const { data: suppliersData } = useQuery<PaginatedResult<PartyItem>>({
    queryKey: ['parties-suppliers'],
    queryFn: async () => {
      const res = await api.get('/parties?limit=100');
      return res.data;
    },
    enabled: isOpen,
  });

  const suppliersList = (suppliersData?.data || []).map((s) => ({
    value: s.id,
    label: `${s.name}${s.tradeName ? ` (${s.tradeName})` : ''}`,
  }));

  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      setCategory(expenseToEdit.category);
      setExpenseType(expenseToEdit.expenseType);
      setAmount(expenseToEdit.amount);
      setCompetenceDate(expenseToEdit.competenceDate ? expenseToEdit.competenceDate.split('T')[0] : '');
      setDueDate(expenseToEdit.dueDate ? expenseToEdit.dueDate.split('T')[0] : '');
      setSupplierId(expenseToEdit.supplierId || '');
      setBeneficiaryName(expenseToEdit.beneficiaryName || '');
      setBarcode(expenseToEdit.barcode || '');
      setDocumentNumber(expenseToEdit.documentNumber || '');
      setIsRecurring(Boolean(expenseToEdit.isRecurring));
      setRecurrenceInterval(expenseToEdit.recurrenceInterval || 'MONTHLY');
      setRecurrenceEndDate(expenseToEdit.recurrenceEndDate ? expenseToEdit.recurrenceEndDate.split('T')[0] : '');
      setPaymentMethod(expenseToEdit.paymentMethod || PaymentMethod.BOLETO);
      setNotes(expenseToEdit.notes || '');
      setErrorMessage(null);
    } else {
      // Default to today and current month
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

      setDescription('');
      setCategory(ExpenseCategory.RENT_FACILITIES);
      setExpenseType(ExpenseType.FIXED);
      setAmount(0);
      setCompetenceDate(firstDayOfMonth);
      setDueDate(todayStr);
      setSupplierId('');
      setBeneficiaryName('');
      setBarcode('');
      setDocumentNumber('');
      setIsRecurring(false);
      setRecurrenceInterval('MONTHLY');
      setRecurrenceEndDate('');
      setPaymentMethod(PaymentMethod.BOLETO);
      setNotes('');
      setErrorMessage(null);
    }
  }, [expenseToEdit, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        description: description.trim(),
        category,
        expenseType,
        amount,
        competenceDate: new Date(`${competenceDate}T12:00:00.000Z`).toISOString(),
        dueDate: new Date(`${dueDate}T12:00:00.000Z`).toISOString(),
        supplierId: supplierId || undefined,
        beneficiaryName: beneficiaryName.trim() || undefined,
        barcode: barcode.trim() || undefined,
        documentNumber: documentNumber.trim() || undefined,
        isRecurring,
        recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
        recurrenceEndDate: isRecurring && recurrenceEndDate ? new Date(`${recurrenceEndDate}T12:00:00.000Z`).toISOString() : undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      if (expenseToEdit) {
        const res = await api.put(`/operating-expenses/${expenseToEdit.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/operating-expenses', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operating-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['operating-expenses-summary'] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Falha ao salvar despesa operacional.';
      setErrorMessage(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Por favor, informe a descrição da despesa.');
      return;
    }
    if (amount <= 0) {
      setErrorMessage('O valor da despesa deve ser maior que R$ 0,00.');
      return;
    }
    if (!dueDate) {
      setErrorMessage('Por favor, defina a data de vencimento.');
      return;
    }
    if (!competenceDate) {
      setErrorMessage('Por favor, defina a data de competência.');
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Editar Despesa Operacional' : 'Cadastrar Nova Despesa Operacional'}
      description="Gerencie os gastos fixos e variáveis de infraestrutura que não entram diretamente no custo da mercadoria final"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Descrição e Valor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Descrição da Despesa"
              placeholder="Ex: Aluguel Galpão Industrial, Assinatura Adobe CC, CEMIG..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <CurrencyInput
            label="Valor Total (R$)"
            value={amount}
            onChangeValue={setAmount}
            required
          />
        </div>

        {/* Categoria e Tipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Categoria Operacional"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            options={CATEGORY_OPTIONS}
            required
          />
          <Select
            label="Tipo de Despesa"
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
            options={TYPE_OPTIONS}
            required
          />
        </div>

        {/* Competência e Vencimento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Data de Competência (Mês/Ano)"
            type="date"
            value={competenceDate}
            onChange={(e) => setCompetenceDate(e.target.value)}
            required
          />
          <Input
            label="Data de Vencimento"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>

        {/* Credor Avulso e Fornecedor Cadastrado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div>
            <Input
              label="Credor Avulso / Favorecido"
              placeholder="Ex: CEMIG, Imobiliária Souza, Adobe Systems..."
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Útil para prestadores rápidos, contas de consumo ou concessionárias.
            </p>
          </div>

          <div>
            <Select
              label="Ou Fornecedor Cadastrado (Opcional)"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              options={[{ value: '', label: 'Nenhum / Credor Avulso' }, ...suppliersList]}
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Vincula o registro a um fornecedor da lista de parceiros.
            </p>
          </div>
        </div>

        {/* Linha Digitável e Documento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Nº da Fatura / Recibo / NF"
            placeholder="Ex: FAT-2026-09"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
          />
          <Select
            label="Forma de Pagamento Prevista"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={PAYMENT_METHODS}
          />
        </div>

        <Input
          label="Linha Digitável / Código de Barras / Chave PIX (Opcional)"
          placeholder="Cole aqui o código do boleto ou chave PIX para facilitar o pagamento"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
        />

        {/* Bloco de Recorrência */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurringCheckbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="isRecurringCheckbox" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Conta Recorrente (Repete mensalmente)</span>
            </label>
          </div>

          {isRecurring && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <Select
                label="Periodicidade"
                value={recurrenceInterval}
                onChange={(e) => setRecurrenceInterval(e.target.value)}
                options={[
                  { value: 'MONTHLY', label: 'Mensal (Todo mês)' },
                  { value: 'YEARLY', label: 'Anual (Renovação anual)' },
                ]}
              />

              <div>
                <Input
                  label="Data Limite / Fim da Recorrência ou Renovação"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Ex: Vencimento do contrato de aluguel ou fim do ano fiscal.
                </p>
              </div>
            </div>
          )}
        </div>

        <Input
          label="Observações Adicionais (Opcional)"
          placeholder="Instruções de rateio, dados contratuais, detalhes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saveMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {expenseToEdit ? (
              <>
                <Edit2 className="w-4 h-4 mr-1.5" />
                {saveMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1.5" />
                {saveMutation.isPending ? 'Cadastrando...' : 'Cadastrar Despesa'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
