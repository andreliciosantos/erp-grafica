import Decimal from 'decimal.js';

export interface PricingInput {
  sheetsRequired: number;
  costPerSheet: number | string | Decimal;
  machineHourlyRate: number | string | Decimal;
  machineSetupMinutes?: number;       // minutos de setup (ex: 15 ou 30 min)
  machineMaxSheetsHour?: number;      // velocidade nominal por hora (ex: 5000)
  finishingCostTotal?: number | string | Decimal; // acabamentos (laminação, verniz, corte/vinco)
  markupApplied: number | string | Decimal;       // markup (ex: 0.40 para 40%)
  itemQuantity: number;               // tiragem / quantidade do item
}

export interface PricingResult {
  paperCost: Decimal;
  machineHours: Decimal;
  machineCost: Decimal;
  finishingCost: Decimal;
  totalCost: Decimal;
  totalAmount: Decimal;  // Preço de venda final ao cliente
  unitPrice: Decimal;    // Preço unitário por peça
}

/**
 * Calcula a formação de preço técnico do orçamento conforme Seção 4.2.
 */
export function calculateQuotePricing(input: PricingInput): PricingResult {
  const {
    sheetsRequired,
    costPerSheet,
    machineHourlyRate,
    machineSetupMinutes = 15,
    machineMaxSheetsHour = 3000,
    finishingCostTotal = 0,
    markupApplied,
    itemQuantity,
  } = input;

  if (itemQuantity <= 0) {
    throw new Error('A quantidade de itens deve ser maior que zero.');
  }

  const dMarkup = new Decimal(markupApplied);
  if (dMarkup.gte(1) || dMarkup.lt(0)) {
    throw new Error('O markup deve ser maior ou igual a 0 e estritamente menor que 1 (ex: 0.40 para 40%).');
  }

  const dSheetsRequired = new Decimal(sheetsRequired);
  const dCostPerSheet = new Decimal(costPerSheet);
  const dMachineHourlyRate = new Decimal(machineHourlyRate);
  const dFinishingCost = new Decimal(finishingCostTotal);

  // 1. Custo do Papel = Folhas_Necessárias * CustoUnitário_Folha
  const paperCost = dSheetsRequired.mul(dCostPerSheet).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 2. Tempo de Máquina em horas = (SetupMinutos / 60) + (Folhas_Necessárias / VelocidadeNominalHora)
  const setupHours = new Decimal(machineSetupMinutes).div(60);
  const runHours = machineMaxSheetsHour > 0
    ? dSheetsRequired.div(machineMaxSheetsHour)
    : new Decimal(0);
  const machineHours = setupHours.add(runHours);

  // 3. Custo de Impressão = Tempo_Máquina * TaxaHoraMáquina
  const machineCost = machineHours.mul(dMachineHourlyRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 4. Custo Total de Insumos = Custo_Papel + Custo_Impressão + Custo_Acabamentos
  const totalCost = paperCost
    .add(machineCost)
    .add(dFinishingCost)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 5. Preço de Venda Final = CustoTotalInsumos / (1 - Markup)
  const divisor = new Decimal(1).sub(dMarkup);
  const totalAmount = totalCost.div(divisor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // 6. Preço Unitário = PreçoVendaFinal / Quantidade
  const unitPrice = totalAmount.div(itemQuantity).toDecimalPlaces(4, Decimal.ROUND_HALF_UP);

  return {
    paperCost,
    machineHours: machineHours.toDecimalPlaces(4, Decimal.ROUND_HALF_UP),
    machineCost,
    finishingCost: dFinishingCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    totalCost,
    totalAmount,
    unitPrice,
  };
}
