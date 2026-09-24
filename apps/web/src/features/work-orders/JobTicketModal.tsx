import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { formatDate, formatDateTime, getPriorityConfig } from '../../lib/utils';
import { Printer } from 'lucide-react';
import { WorkOrderItem } from '../../types';

interface JobTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WorkOrderItem | null;
}

/**
 * Gerador de Código de Barras Code-128 B em SVG puro vetorial (offline, zero dependências).
 */
export const Code128Svg: React.FC<{ value: string; height?: number; className?: string }> = ({
  value,
  height = 50,
  className = '',
}) => {
  // Padrões de barras Code-128 (larguras 1-4 para 11 módulos por caractere)
  const codePatterns: Record<number, string> = {
    0: '212222', 1: '222122', 2: '222221', 3: '121223', 4: '121322',
    5: '131222', 6: '122213', 7: '122312', 8: '132212', 9: '221213',
    10: '221312', 11: '231212', 12: '112232', 13: '122132', 14: '122231',
    15: '113222', 16: '123122', 17: '123221', 18: '223211', 19: '221132',
    20: '221231', 21: '213212', 22: '223112', 23: '312131', 24: '311222',
    25: '321122', 26: '321221', 27: '312212', 28: '322112', 29: '322211',
    30: '212123', 31: '212321', 32: '232121', 33: '111323', 34: '131123',
    35: '131321', 36: '112313', 37: '132113', 38: '132311', 39: '211313',
    40: '231113', 41: '231311', 42: '112133', 43: '112331', 44: '132131',
    45: '113123', 46: '113321', 47: '133121', 48: '313121', 49: '211331',
    50: '231131', 51: '213113', 52: '213311', 53: '213131', 54: '311123',
    55: '311321', 56: '331121', 57: '312113', 58: '312311', 59: '332111',
    60: '314111', 61: '221411', 62: '431111', 63: '111224', 64: '111422',
    65: '121124', 66: '121421', 67: '141122', 68: '141221', 69: '112214',
    70: '112412', 71: '122114', 72: '122411', 73: '142112', 74: '142211',
    75: '241211', 76: '221114', 77: '413111', 78: '241112', 79: '134111',
    80: '111242', 81: '121142', 82: '121241', 83: '114212', 84: '124112',
    85: '124211', 86: '411212', 87: '421112', 88: '421211', 89: '212141',
    90: '214121', 91: '412121', 92: '111143', 93: '111341', 94: '131141',
    95: '114113', 96: '114311', 97: '411113', 98: '411311', 99: '113141',
    100: '114131', 101: '311141', 102: '411131', 103: '211412', 104: '211214',
    105: '211232', 106: '2331112' // Stop pattern
  };

  const safeVal = (value || 'OS-0000').toUpperCase();
  const startCodeB = 104;
  let checksum = startCodeB;
  const codes: number[] = [startCodeB];

  for (let i = 0; i < safeVal.length; i++) {
    const ascii = safeVal.charCodeAt(i);
    const code = ascii >= 32 && ascii <= 126 ? ascii - 32 : 0;
    codes.push(code);
    checksum += code * (i + 1);
  }

  const checkCode = checksum % 103;
  codes.push(checkCode);
  codes.push(106); // Stop

  let patternStr = '';
  codes.forEach((c) => {
    patternStr += codePatterns[c] || '212222';
  });

  // Convert pattern to bars (alternating black and space)
  const rects: React.ReactNode[] = [];
  let currentX = 10;
  let isBar = true;

  for (let i = 0; i < patternStr.length; i++) {
    const width = parseInt(patternStr[i], 10);
    if (isBar) {
      rects.push(
        <rect
          key={i}
          x={currentX}
          y={0}
          width={width * 2}
          height={height}
          fill="currentColor"
        />
      );
    }
    currentX += width * 2;
    isBar = !isBar;
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={currentX + 10}
        height={height}
        viewBox={`0 0 ${currentX + 10} ${height}`}
        className="w-full max-w-[280px] h-12 text-slate-900"
      >
        {rects}
      </svg>
      <span className="font-mono text-[11px] font-bold tracking-widest text-slate-800 dark:text-slate-200 mt-1">
        *{safeVal}*
      </span>
    </div>
  );
};

export const JobTicketModal: React.FC<JobTicketModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [printFormat, setPrintFormat] = useState<'A4' | 'THERMAL'>('A4');

  if (!order) return null;

  const priorityConfig = getPriorityConfig(order.priority);
  const items = order.quote?.items || [];
  const mainItem = items[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ficha Técnica de Produção (Job Ticket)"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Format Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-100 dark:bg-slate-800/60 p-2 sm:p-2.5 rounded-xl gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mr-1">
              Formato:
            </span>
            <button
              onClick={() => setPrintFormat('A4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                printFormat === 'A4'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              📄 A4 Industrial
            </button>
            <button
              onClick={() => setPrintFormat('THERMAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                printFormat === 'THERMAL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              🧾 Térmica 80mm
            </button>
          </div>

          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full sm:w-auto justify-center"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir Agora
          </Button>
        </div>

        {/* Printable Area with @media print CSS styling */}
        <div id="job-ticket-print-area" className="p-1">
          {printFormat === 'A4' ? (
            /* =========================================================================
             * FORMATO A4 INDUSTRIAL
             * ========================================================================= */
            <div className="bg-white text-slate-900 border-2 border-slate-900 rounded-xl p-6 space-y-5 font-sans shadow-md">
              {/* Top Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white font-black px-2 py-0.5 rounded text-sm tracking-wider">
                      ERP GRÁFICA
                    </span>
                    <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                      FICHA TÉCNICA INDUSTRIAL
                    </span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-2 font-mono">
                    {order.orderNumber}
                  </h1>
                  <p className="text-xs font-semibold text-slate-600">
                    Emitido em: {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-slate-500">Prioridade:</span>
                    <span className={`px-2.5 py-0.5 text-xs font-black uppercase rounded border ${priorityConfig.badge}`}>
                      {priorityConfig.label}
                    </span>
                  </div>

                  {/* Native Code-128 SVG */}
                  <Code128Svg value={order.barcode || order.orderNumber} height={42} />
                </div>
              </div>

              {/* Client & Promise Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs">
                <div>
                  <span className="text-slate-500 font-bold uppercase block text-[10px]">Cliente:</span>
                  <span className="text-sm font-black text-slate-900 block truncate">
                    {order.party?.name || 'Cliente Balcão'}
                  </span>
                  <span className="text-slate-600 font-medium">
                    Contato: {order.party?.phone || '-'}
                  </span>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-slate-500 font-bold uppercase block text-[10px]">Data Prometida de Entrega:</span>
                  <span className="text-sm font-black text-emerald-700 block">
                    {formatDate(order.deliveryDate)}
                  </span>
                  <span className="text-slate-600 font-medium">
                    Status Atual: <strong>{order.status}</strong>
                  </span>
                </div>
              </div>

              {/* Product Specifications */}
              <div className="border border-slate-900 rounded-lg overflow-hidden">
                <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-black uppercase tracking-wider flex items-center justify-between">
                  <span>Especificação do Produto Gráfico</span>
                  <span>Tiragem: {mainItem?.quantity ? `${mainItem.quantity.toLocaleString('pt-BR')} un` : '-'}</span>
                </div>

                <div className="p-3 text-xs space-y-2">
                  <div className="flex items-baseline justify-between font-bold text-sm">
                    <span>{mainItem?.productName || 'Material Gráfico'}</span>
                    <span className="font-mono text-xs text-slate-600">
                      Formato Aberto: {mainItem?.widthMm || '-'} x {mainItem?.heightMm || '-'} mm
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Substrato / Papel:</span>
                      <strong className="text-slate-900">
                        {mainItem?.rawMaterial?.name || 'Couchê 300g (Padrão)'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Cores / Escala:</span>
                      <strong className="text-slate-900">
                        {mainItem?.colorsFront || 4} x {mainItem?.colorsBack || 0} Cores
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">Folhas Necessárias:</span>
                      <strong className="text-emerald-700 font-bold">
                        {mainItem?.sheetsRequired || Math.ceil((mainItem?.quantity || 1000) / 10)} folhas pai
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Production Stages & Sign-off Checklist */}
              <div className="border border-slate-900 rounded-lg overflow-hidden">
                <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-black uppercase tracking-wider">
                  Roteiro de Produção & Visto dos Operadores
                </div>

                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase text-slate-600">
                    <tr>
                      <th className="py-2 px-3 w-8">OK</th>
                      <th className="py-2 px-3">Etapa Industrial</th>
                      <th className="py-2 px-3">Máquina / Operador</th>
                      <th className="py-2 px-3 text-center">Folhas Refugo</th>
                      <th className="py-2 px-3 text-right">Visto / Rubrica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(order.stages && order.stages.length > 0
                      ? order.stages
                      : [
                          { stepOrder: 1, name: 'Pré-impressão & CTP' },
                          { stepOrder: 2, name: 'Corte da Folha Pai' },
                          { stepOrder: 3, name: 'Impressão em Máquina' },
                          { stepOrder: 4, name: 'Acabamento & Refile' },
                          { stepOrder: 5, name: 'Controle de Qualidade' },
                          { stepOrder: 6, name: 'Embalagem & Expedição' },
                        ]
                    ).map((st: any, idx: number) => (
                      <tr key={idx} className="h-10">
                        <td className="py-2 px-3">
                          <div className="w-4 h-4 border-2 border-slate-800 rounded-xs" />
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {st.name}
                        </td>
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                          ____________________
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">
                          [ &nbsp; &nbsp; &nbsp; &nbsp; ] fls
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400 font-mono text-[11px]">
                          ____________________
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes Box */}
              <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-xs">
                <span className="font-bold text-slate-700 uppercase block text-[10px]">
                  Observações de Acabamento & Cuidados Especiais:
                </span>
                <p className="text-slate-600 mt-1 min-h-[30px]">
                  {order.quote?.notes || 'Verificar sentido da fibra e refile rente à sangria de 3mm. Embalar em papel craft com identificação da OS.'}
                </p>
              </div>
            </div>
          ) : (
            /* =========================================================================
             * FORMATO TÉRMICA 80MM (CUPOM COMPACTO DE FÁBRICA)
             * ========================================================================= */
            <div className="max-w-[340px] mx-auto bg-white text-slate-950 p-4 border border-dashed border-slate-400 font-mono text-xs space-y-3 shadow-md">
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <h3 className="font-black text-sm tracking-wider">ERP GRÁFICA</h3>
                <p className="text-[10px] uppercase font-bold text-slate-600">ORDEM DE PRODUÇÃO</p>
                <div className="my-2">
                  <span className="text-xl font-black block tracking-tight">
                    {order.orderNumber}
                  </span>
                </div>
                <Code128Svg value={order.barcode || order.orderNumber} height={36} />
              </div>

              <div className="border-b border-dashed border-slate-400 pb-2 space-y-1 text-[11px]">
                <div>
                  <span className="font-bold">CLIENTE:</span> {order.party?.name || 'Cliente Balcão'}
                </div>
                <div>
                  <span className="font-bold">ENTREGA:</span> {formatDate(order.deliveryDate)}
                </div>
                <div>
                  <span className="font-bold">PRIORIDADE:</span> {priorityConfig.label}
                </div>
              </div>

              <div className="border-b border-dashed border-slate-400 pb-2 space-y-1 text-[11px]">
                <div className="font-black text-xs">
                  {mainItem?.productName || 'Material Gráfico'}
                </div>
                <div>
                  <strong>TIRAGEM:</strong> {mainItem?.quantity ? `${mainItem.quantity.toLocaleString('pt-BR')} un` : '-'}
                </div>
                <div>
                  <strong>FORMATO:</strong> {mainItem?.widthMm || '-'} x {mainItem?.heightMm || '-'} mm
                </div>
                <div>
                  <strong>PAPEL:</strong> {mainItem?.rawMaterial?.name || 'Couchê 300g'}
                </div>
                <div>
                  <strong>CORES:</strong> {mainItem?.colorsFront || 4}x{mainItem?.colorsBack || 0}
                </div>
                <div>
                  <strong>FOLHAS PAI:</strong> {mainItem?.sheetsRequired || 100} fls
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <span className="font-bold block uppercase">Checklist Etapas:</span>
                <div>[ ] 1. CTP / Pré-impressão</div>
                <div>[ ] 2. Corte Folha Pai</div>
                <div>[ ] 3. Impressão</div>
                <div>[ ] 4. Acabamento</div>
                <div>[ ] 5. Embalagem & Expedição</div>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2 text-center text-[10px] text-slate-500">
                Emitido em {formatDateTime(order.createdAt)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
