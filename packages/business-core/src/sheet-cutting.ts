export interface SheetCuttingInput {
  parentSheetWidthMm: number;    // L_pai (ex: 660 mm)
  parentSheetHeightMm: number;   // A_pai (ex: 960 mm)
  itemWidthMm: number;          // l_item (formato aberto)
  itemHeightMm: number;         // a_item (formato aberto)
  bleedMm?: number;             // Sangria s (padrão: 3 mm)
  gripperMarginMm?: number;     // Margem de pinça p (padrão: 10 mm no topo e na base)
  runQuantity: number;          // Tiragem desejada
  wasteRate?: number;           // Perda operacional padrão (padrão: 0.10 para 10%)
}

export interface SheetCuttingResult {
  usefulItemWidthMm: number;
  usefulItemHeightMm: number;
  usefulSheetWidthMm: number;
  usefulSheetHeightMm: number;
  itemsDirect: number;          // Arranjo retrato
  itemsRotated: number;         // Arranjo paisagem (90°)
  itemsPerSheet: number;        // max(N_direto, N_girado)
  bestOrientation: 'DIRECT' | 'ROTATED';
  effectiveRunQuantity: number; // Tiragem com acréscimo de perda operacional
  sheetsRequired: number;       // Folhas pai necessárias
}

/**
 * Calcula o aproveitamento de folha pai e quantidade de folhas necessárias
 * baseado nas regras da Seção 4.1.
 */
export function calculateSheetCutting(input: SheetCuttingInput): SheetCuttingResult {
  const {
    parentSheetWidthMm,
    parentSheetHeightMm,
    itemWidthMm,
    itemHeightMm,
    bleedMm = 3,
    gripperMarginMm = 10,
    runQuantity,
    wasteRate = 0.10,
  } = input;

  if (parentSheetWidthMm <= 0 || parentSheetHeightMm <= 0) {
    throw new Error('As dimensões da folha pai devem ser maiores que zero.');
  }

  if (itemWidthMm <= 0 || itemHeightMm <= 0) {
    throw new Error('As dimensões do item devem ser maiores que zero.');
  }

  if (runQuantity <= 0) {
    throw new Error('A tiragem deve ser maior que zero.');
  }

  // 1. Dimensões úteis do item (com sangria em todos os lados)
  const usefulItemWidthMm = itemWidthMm + (2 * bleedMm);
  const usefulItemHeightMm = itemHeightMm + (2 * bleedMm);

  // 2. Dimensões úteis da folha pai (descontando margem de pinça no topo e na base)
  const usefulSheetWidthMm = parentSheetWidthMm;
  const usefulSheetHeightMm = parentSheetHeightMm - (2 * gripperMarginMm);

  if (usefulSheetHeightMm <= 0) {
    throw new Error('Margem de pinça excede a altura da folha pai.');
  }

  // 3. Arranjo Direto (Retrato)
  const itemsDirectCols = Math.floor(usefulSheetWidthMm / usefulItemWidthMm);
  const itemsDirectRows = Math.floor(usefulSheetHeightMm / usefulItemHeightMm);
  const itemsDirect = Math.max(0, itemsDirectCols * itemsDirectRows);

  // 4. Arranjo Girado (Paisagem / 90°)
  const itemsRotatedCols = Math.floor(usefulSheetWidthMm / usefulItemHeightMm);
  const itemsRotatedRows = Math.floor(usefulSheetHeightMm / usefulItemWidthMm);
  const itemsRotated = Math.max(0, itemsRotatedCols * itemsRotatedRows);

  // 5. Melhor arranjo
  const itemsPerSheet = Math.max(itemsDirect, itemsRotated);
  const bestOrientation: 'DIRECT' | 'ROTATED' =
    itemsRotated > itemsDirect ? 'ROTATED' : 'DIRECT';

  if (itemsPerSheet <= 0) {
    throw new Error(
      `O formato do item (${itemWidthMm}x${itemHeightMm}mm com ${bleedMm}mm de sangria) não cabe na folha útil (${usefulSheetWidthMm}x${usefulSheetHeightMm}mm).`
    );
  }

  // 6. Tiragem efetiva com setup e perdas operacionais
  const effectiveRunQuantity = Math.ceil(runQuantity * (1 + wasteRate));

  // 7. Folhas pai necessárias
  const sheetsRequired = Math.ceil(effectiveRunQuantity / itemsPerSheet);

  return {
    usefulItemWidthMm,
    usefulItemHeightMm,
    usefulSheetWidthMm,
    usefulSheetHeightMm,
    itemsDirect,
    itemsRotated,
    itemsPerSheet,
    bestOrientation,
    effectiveRunQuantity,
    sheetsRequired,
  };
}
