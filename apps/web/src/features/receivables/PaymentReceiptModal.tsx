import React, { useRef, useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { ReceivableItem, PaymentMethod } from '@erp/shared-types';
import { toBlob } from 'html-to-image';
import {
  Printer,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Download,
  Share2,
  Phone,
  ExternalLink,
  AlertCircle,
  X,
} from 'lucide-react';

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

function cleanPhoneForWhatsApp(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

/**
 * Renderizador de emergência em HTML5 Canvas caso o ambiente não suporte foreignObject / html-to-image
 */
function drawReceiptOnCanvas(
  receivable: ReceivableItem,
  paymentMethodLabel: string,
  receiptDate: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Fundo branco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 700);

  // Borda arredondada do documento
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 580, 680);

  // Logo EG
  ctx.fillStyle = '#059669';
  ctx.fillRect(35, 35, 48, 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EG', 59, 59);

  // Cabeçalho da Empresa
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('ERP Gráfica & Comunicação Visual', 95, 50);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.fillText('Comprovante de Recebimento', 95, 72);

  // Número do Recibo
  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText('RECIBO Nº', 565, 48);
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`REC-${receivable.id.substring(0, 8).toUpperCase()}`, 565, 70);

  // Divisória
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(35, 98);
  ctx.lineTo(565, 98);
  ctx.stroke();

  // Banner Status
  ctx.fillStyle = '#ecfdf5';
  ctx.fillRect(35, 115, 530, 50);
  ctx.strokeStyle = '#a7f3d0';
  ctx.strokeRect(35, 115, 530, 50);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('✓  PAGAMENTO CONFIRMADO', 50, 145);

  ctx.textAlign = 'right';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(formatCurrency(receivable.amount), 550, 145);

  // Caixa de dados
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(35, 180, 530, 420);
  ctx.strokeStyle = '#f1f5f9';
  ctx.strokeRect(35, 180, 530, 420);

  const drawRow = (label: string, val: string, y: number, isAccent = false) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.fillText(label, 50, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = isAccent ? '#059669' : '#0f172a';
    ctx.font = isAccent ? 'bold 14px monospace' : '600 13px sans-serif';
    ctx.fillText(val, 550, y);

    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(50, y + 14);
    ctx.lineTo(550, y + 14);
    ctx.stroke();
  };

  let rowY = 215;
  drawRow('Cliente / Pagador:', receivable.party?.name || 'Cliente Avulso', rowY);
  rowY += 45;
  if (receivable.party?.document) {
    drawRow('CPF / CNPJ:', receivable.party.document, rowY);
    rowY += 45;
  }
  drawRow('Descrição:', receivable.description, rowY);
  rowY += 45;
  if (receivable.workOrder) {
    drawRow('Ordem de Serviço (OS):', receivable.workOrder.orderNumber, rowY, true);
    rowY += 45;
  }
  drawRow('Parcela:', `${receivable.installmentNumber} de ${receivable.totalInstallments}`, rowY);
  rowY += 45;
  drawRow('Forma de Pagamento:', paymentMethodLabel, rowY);
  rowY += 45;
  drawRow('Data do Recebimento:', receiptDate, rowY);

  // Rodapé
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText('Documento emitido para conferência e controle financeiro do cliente.', 300, 650);

  return canvas;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receivable,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receivable) return null;

  const paymentMethodLabel = receivable.paymentMethod
    ? PAYMENT_METHOD_LABELS[receivable.paymentMethod] || receivable.paymentMethod
    : 'Não especificado';

  const receiptDate = receivable.paidAt ? formatDate(receivable.paidAt) : formatDate(receivable.updatedAt);

  const handlePrint = () => {
    window.print();
  };

  const buildWhatsAppText = () => {
    return (
      `📄 *COMPROVANTE DE PAGAMENTO - ERP GRÁFICA*\n\n` +
      `*Cliente:* ${receivable.party?.name || 'Cliente Avulso'}\n` +
      `*Valor Pago:* ${formatCurrency(receivable.amount)}\n` +
      `*Descrição:* ${receivable.description}\n` +
      (receivable.workOrder ? `*Ordem de Serviço:* ${receivable.workOrder.orderNumber}\n` : '') +
      `*Parcela:* ${receivable.installmentNumber}/${receivable.totalInstallments}\n` +
      `*Forma de Pagamento:* ${paymentMethodLabel}\n` +
      `*Data:* ${receiptDate}\n\n` +
      `Agradecemos pela preferência!`
    );
  };

  const handleCopyWhatsAppText = () => {
    const text = buildWhatsAppText();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setShareFeedback({
      type: 'success',
      message: 'Texto do comprovante copiado com sucesso!',
    });
    setTimeout(() => {
      setCopiedText(false);
      setShareFeedback(null);
    }, 3500);
  };

  /**
   * Converte o cartão do recibo em Blob de imagem PNG de alta resolução
   */
  const generateReceiptBlob = async (): Promise<Blob> => {
    if (receiptRef.current) {
      try {
        const isDark = document.documentElement.classList.contains('dark');
        const blob = await toBlob(receiptRef.current, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
        });
        if (blob) return blob;
      } catch (err) {
        console.warn('html-to-image falhou, usando gerador canvas integrado:', err);
      }
    }

    // Fallback Canvas
    const canvas = drawReceiptOnCanvas(receivable, paymentMethodLabel, receiptDate);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Falha ao gerar blob do comprovante'));
      }, 'image/png');
    });
  };

  /**
   * Envia o comprovante como imagem para o cliente no WhatsApp
   * Suporta compartilhamento nativo de arquivo (Mobile/PWA) e fluxo integrado com área de transferência e download (Desktop)
   */
  const handleSendWhatsAppImage = async (customPhone?: string) => {
    setIsSharing(true);
    setShareFeedback(null);

    const shareText = buildWhatsAppText();
    const fileName = `comprovante-REC-${receivable.id.substring(0, 8).toUpperCase()}.png`;

    try {
      const blob = await generateReceiptBlob();
      const file = new File([blob], fileName, { type: 'image/png' });

      // 1. Tentar compartilhamento nativo de arquivo com WhatsApp se suportado pelo navegador/sistema
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Comprovante de Pagamento',
          text: shareText,
          files: [file],
        });
        setShareFeedback({
          type: 'success',
          message: 'Comprovante compartilhado com sucesso no WhatsApp!',
        });
        setTimeout(() => setShareFeedback(null), 4000);
        return;
      }

      // 2. Fluxo Desktop / WhatsApp Web:
      // a) Copia a imagem renderizada diretamente para a área de transferência do sistema (Ctrl+V)
      let imageCopiedToClipboard = false;
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          imageCopiedToClipboard = true;
        } catch (clipErr) {
          console.warn('Clipboard write image failed:', clipErr);
        }
      }

      // b) Dispara o download da imagem PNG para envio como anexo
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        try {
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
        } catch (dlErr) {
          console.warn('Download image failed:', dlErr);
        }
      }

      // c) Redireciona para o WhatsApp (específico do telefone ou aberto para escolher o cliente)
      const targetPhone = customPhone || '';
      const waUrl = targetPhone
        ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(shareText)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

      window.open(waUrl, '_blank', 'noopener,noreferrer');

      setShareFeedback({
        type: 'info',
        message: imageCopiedToClipboard
          ? 'WhatsApp aberto! A imagem do comprovante foi copiada para sua área de transferência (basta pressionar Ctrl+V na conversa) e o arquivo PNG foi baixado.'
          : 'WhatsApp aberto! O arquivo PNG do comprovante foi baixado para envio ao cliente escolhido.',
      });
      setTimeout(() => setShareFeedback(null), 8000);
    } catch (err) {
      console.error('Erro ao preparar comprovante para WhatsApp:', err);
      // Fallback gracioso com texto e abertura do WhatsApp
      navigator.clipboard?.writeText?.(shareText);
      const targetPhone = customPhone || '';
      const waUrl = targetPhone
        ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(shareText)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      setShareFeedback({
        type: 'info',
        message: 'WhatsApp aberto! O texto do comprovante foi copiado para a área de transferência.',
      });
      setTimeout(() => setShareFeedback(null), 5000);
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Baixa a imagem PNG diretamente
   */
  const handleDownloadImage = async () => {
    setIsDownloading(true);
    setShareFeedback(null);
    try {
      const blob = await generateReceiptBlob();
      const fileName = `comprovante-REC-${receivable.id.substring(0, 8).toUpperCase()}.png`;
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
      }

      setShareFeedback({
        type: 'success',
        message: 'Imagem PNG do comprovante baixada com sucesso!',
      });
      setTimeout(() => setShareFeedback(null), 3500);
    } catch (err) {
      console.error('Falha ao baixar imagem do comprovante:', err);
      setShareFeedback({
        type: 'error',
        message: 'Não foi possível gerar a imagem para download.',
      });
      setTimeout(() => setShareFeedback(null), 4000);
    } finally {
      setIsDownloading(false);
    }
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

        {/* Informação do Telefone do Cliente com Ação Direta Opcional */}
        {receivable.party?.phone && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs gap-1.5">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-slate-500 dark:text-slate-400">Telefone cadastrado:</span>
              <strong className="text-slate-800 dark:text-slate-200">{receivable.party.phone}</strong>
            </div>
            <button
              type="button"
              onClick={() => handleSendWhatsAppImage(cleanPhoneForWhatsApp(receivable.party?.phone))}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1 self-end sm:self-auto"
              title={`Enviar direto para o telefone cadastrado: ${receivable.party.phone}`}
            >
              <span>Enviar direto para este nº</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Notificação / Feedback de Envio */}
        {shareFeedback && (
          <div
            className={cn(
              'p-3 rounded-xl text-xs flex items-start gap-2.5 transition-all',
              shareFeedback.type === 'success' &&
                'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
              shareFeedback.type === 'info' &&
                'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
              shareFeedback.type === 'error' &&
                'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            )}
          >
            {shareFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : shareFeedback.type === 'info' ? (
              <Share2 className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            )}
            <div className="flex-1 leading-snug">
              <p className="font-semibold">{shareFeedback.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setShareFeedback(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleSendWhatsAppImage()}
            isLoading={isSharing}
            className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-700/20 border-none w-full sm:w-auto"
            title="Redirecionar para o WhatsApp e enviar o comprovante como imagem para o cliente escolhido"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Enviar Imagem no WhatsApp</span>
          </Button>

          <div className="flex items-center justify-end gap-1.5 flex-wrap w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              isLoading={isDownloading}
              className="text-xs text-slate-700 dark:text-slate-200"
              title="Baixar imagem do comprovante (PNG)"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Baixar Imagem</span>
              <span className="sm:hidden">Baixar</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyWhatsAppText}
              className="text-xs text-slate-700 dark:text-slate-200"
              title="Copiar texto do comprovante"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span className="hidden sm:inline">Texto Copiado!</span>
                  <span className="sm:hidden">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span className="hidden sm:inline">Copiar Texto</span>
                  <span className="sm:hidden">Copiar</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs text-slate-700 dark:text-slate-200"
              title="Imprimir comprovante"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
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
