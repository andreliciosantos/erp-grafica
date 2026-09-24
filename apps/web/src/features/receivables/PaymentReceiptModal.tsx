import React, { useRef } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ReceivableItem, PaymentMethod } from '@erp/shared-types';
import { Printer, Copy, Check, CheckCircle2, Calendar } from 'lucide-react';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receivable: ReceivableItem | null;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
  [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
  [PaymentMethod.CASH]: 'Dinheiro em Espécie',
  [PaymentMethod.BOLETO]: 'Boleto Bancário',
  [PaymentMethod.BANK_TRANSFER]: 'Transferência / TED',
  [PaymentMethod.AUTO_DEBIT]: 'Débito Automático',
};

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receivable,
}) => {
  const [copied, setCopied] = React.useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receivable) return null;

  const paymentMethodLabel = receivable.paymentMethod
    ? PAYMENT_METHOD_LABELS[receivable.paymentMethod] || receivable.paymentMethod
    : 'Não especificado';

  const receiptDate = receivable.paidAt ? formatDate(receivable.paidAt) : formatDate(receivable.updatedAt);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsApp = () => {
    const text = `📄 *COMPROVANTE DE PAGAMENTO - ERP GRÁFICA*\n\n` +
      `*Cliente:* ${receivable.party?.name || 'Cliente Avulso'}\n` +
      `*Documento:* ${receivable.party?.document || '-'}\n` +
      `*Descrição:* ${receivable.description}\n` +
      (receivable.workOrder ? `*Ordem de Serviço:* ${receivable.workOrder.orderNumber}\n` : '') +
      `*Parcela:* ${receivable.installmentNumber}/${receivable.totalInstallments}\n` +
      `*Valor Pago:* ${formatCurrency(receivable.amount)}\n` +
      `*Forma de Pagamento:* ${paymentMethodLabel}\n` +
      `*Data:* ${receiptDate}\n\n` +
      `Agradecemos pela preferência!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recibo de Pagamento"
      description="Comprovante de quitação emitido para o cliente"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Printable Receipt Box */}
        <div
          ref={receiptRef}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs text-xs space-y-4 font-sans print:border-none print:shadow-none print:p-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                EG
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  ERP Gráfica & Comunicação Visual
                </h3>
                <p className="text-[11px] text-slate-500">Comprovante de Recebimento</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Recibo Nº
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                REC-{receivable.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Status Badge Banner */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold text-xs">PAGAMENTO CONFIRMADO</span>
            </div>
            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              {formatCurrency(receivable.amount)}
            </span>
          </div>

          {/* Details Grid */}
          <div className="space-y-2.5 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500">Cliente / Pagador:</span>
              <strong className="text-slate-800 dark:text-slate-200 text-right">
                {receivable.party?.name || 'Cliente Avulso'}
              </strong>
            </div>

            {receivable.party?.document && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500">CPF / CNPJ:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {receivable.party.document}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500">Descrição:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                {receivable.description}
              </span>
            </div>

            {receivable.workOrder && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500">Ordem de Serviço (OS):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {receivable.workOrder.orderNumber}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500">Parcela:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {receivable.installmentNumber} de {receivable.totalInstallments}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500">Forma de Pagamento:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {paymentMethodLabel}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Data do Recebimento:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {receiptDate}
              </span>
            </div>
          </div>

          {receivable.notes && (
            <div className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
              Observações: {receivable.notes}
            </div>
          )}

          <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-slate-200/60 dark:border-slate-800">
            Documento emitido para conferência e controle financeiro do cliente.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyWhatsApp}
            className="text-xs text-slate-700 dark:text-slate-200"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Copiado p/ WhatsApp!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Copiar p/ WhatsApp
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs text-slate-700 dark:text-slate-200"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Imprimir
            </Button>
            <Button type="button" size="sm" onClick={onClose} className="text-xs">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
