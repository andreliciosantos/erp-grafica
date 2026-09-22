import React from 'react';
import { Layers, RotateCcw } from 'lucide-react';

export interface SheetCuttingCanvasProps {
  sheetWidthMm: number;
  sheetHeightMm: number;
  productWidthMm: number;
  productHeightMm: number;
  bleedMm?: number;
  gripMm?: number;
  itemsPerSheet: number;
  sheetsRequired: number;
  totalQuantity: number;
  isRotated?: boolean;
}

export const SheetCuttingCanvas: React.FC<SheetCuttingCanvasProps> = ({
  sheetWidthMm,
  sheetHeightMm,
  productWidthMm,
  productHeightMm,
  bleedMm = 3,
  gripMm = 10,
  itemsPerSheet,
  sheetsRequired,
  totalQuantity,
  isRotated = false,
}) => {
  // SVG Canvas scale and bounds
  const canvasWidth = 460;
  const canvasHeight = 310;
  const padding = 20;

  // Scale calculations to fit sheet inside SVG
  const availableWidth = canvasWidth - padding * 2;
  const availableHeight = canvasHeight - padding * 2;

  const scale = Math.min(
    availableWidth / (sheetWidthMm || 660),
    availableHeight / (sheetHeightMm || 960)
  );

  const drawSheetW = (sheetWidthMm || 660) * scale;
  const drawSheetH = (sheetHeightMm || 960) * scale;

  const startX = (canvasWidth - drawSheetW) / 2;
  const startY = (canvasHeight - drawSheetH) / 2;

  // Useful product dimensions with bleed
  const itemW = (productWidthMm + bleedMm * 2) * scale;
  const itemH = (productHeightMm + bleedMm * 2) * scale;
  const gripH = gripMm * scale;

  // Calculate rows and cols for layout
  const cols = itemW > 0 ? Math.floor(drawSheetW / itemW) : 0;
  const rows = itemH > 0 ? Math.floor((drawSheetH - gripH * 2) / itemH) : 0;

  const items = [];
  if (cols > 0 && rows > 0) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push({
          x: startX + c * itemW,
          y: startY + gripH + r * itemH,
          w: itemW,
          h: itemH,
          id: `${r}-${c}`,
        });
      }
    }
  }

  // Calculate efficiency
  const usefulItemArea = (productWidthMm * productHeightMm) * itemsPerSheet;
  const totalSheetArea = sheetWidthMm * sheetHeightMm;
  const efficiency = totalSheetArea > 0 ? ((usefulItemArea / totalSheetArea) * 100).toFixed(1) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-slate-900/90 border border-slate-800 p-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Simulador de Imposição & Aproveitamento
          </h4>
        </div>
        {isRotated && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <RotateCcw className="w-3 h-3" />
            Giro 90° Otimizado
          </span>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative flex justify-center items-center bg-slate-950/70 rounded-lg p-2 border border-slate-850 overflow-hidden">
        <svg
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="w-full max-h-56 drop-shadow-md select-none"
        >
          {/* Background Sheet */}
          <rect
            x={startX}
            y={startY}
            width={drawSheetW}
            height={drawSheetH}
            rx={4}
            className="fill-slate-800 stroke-slate-600"
            strokeWidth={1.5}
          />

          {/* Top Grip Margin (Pinça) */}
          <rect
            x={startX}
            y={startY}
            width={drawSheetW}
            height={gripH}
            className="fill-rose-500/20 stroke-rose-500/30"
            strokeDasharray="2,2"
          />

          {/* Bottom Grip Margin */}
          <rect
            x={startX}
            y={startY + drawSheetH - gripH}
            width={drawSheetW}
            height={gripH}
            className="fill-rose-500/20 stroke-rose-500/30"
            strokeDasharray="2,2"
          />

          {/* Items / Product Grid */}
          {items.map((item) => (
            <g key={item.id}>
              <rect
                x={item.x + 1}
                y={item.y + 1}
                width={Math.max(item.w - 2, 2)}
                height={Math.max(item.h - 2, 2)}
                rx={1.5}
                className="fill-emerald-500/25 stroke-emerald-400/80 transition-all hover:fill-emerald-500/40"
                strokeWidth={1}
              />
            </g>
          ))}
        </svg>

        <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
          Folha: {sheetWidthMm}x{sheetHeightMm} mm
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-750 text-center">
          <p className="text-[10px] text-slate-400 font-medium">Por Folha</p>
          <p className="text-base font-bold text-emerald-400">{itemsPerSheet || 0} un</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-750 text-center">
          <p className="text-[10px] text-slate-400 font-medium">Folhas Pai</p>
          <p className="text-base font-bold text-indigo-400">{sheetsRequired || 0} fl</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-750 text-center">
          <p className="text-[10px] text-slate-400 font-medium">Tiragem Total</p>
          <p className="text-base font-bold text-slate-100">{totalQuantity || 0}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-750 text-center">
          <p className="text-[10px] text-slate-400 font-medium">Aproveitamento</p>
          <p className="text-base font-bold text-amber-400">{efficiency}%</p>
        </div>
      </div>
    </div>
  );
};
