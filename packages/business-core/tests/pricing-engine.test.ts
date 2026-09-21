import { describe, it, expect } from 'vitest';
import { calculateQuotePricing } from '../src/pricing-engine';
import Decimal from 'decimal.js';

describe('Motor de Formação de Preço (calculateQuotePricing)', () => {
  it('deve calcular corretamente os custos e preço de venda com markup de 40%', () => {
    const result = calculateQuotePricing({
      sheetsRequired: 100,
      costPerSheet: 0.85,
      machineHourlyRate: 100,
      machineSetupMinutes: 30, // 0.5h
      machineMaxSheetsHour: 1000, // 100 / 1000 = 0.1h -> Total 0.6h
      finishingCostTotal: 25.0,
      markupApplied: 0.40,
      itemQuantity: 1000,
    });

    // Custo Papel: 100 * 0.85 = 85.00
    expect(result.paperCost.toNumber()).toBe(85.00);
    // Tempo Máquina: 0.5 + 0.1 = 0.6000h
    expect(result.machineHours.toNumber()).toBe(0.6);
    // Custo Máquina: 0.6 * 100 = 60.00
    expect(result.machineCost.toNumber()).toBe(60.00);
    // Acabamento: 25.00
    expect(result.finishingCost.toNumber()).toBe(25.00);
    // Custo Total: 85 + 60 + 25 = 170.00
    expect(result.totalCost.toNumber()).toBe(170.00);
    // Preço Venda: 170 / (1 - 0.40) = 170 / 0.60 = 283.33
    expect(result.totalAmount.toNumber()).toBe(283.33);
    // Preço Unitário: 283.33 / 1000 = 0.2833
    expect(result.unitPrice.toNumber()).toBe(0.2833);
  });

  it('deve funcionar com markup zero (preço de venda = custo total)', () => {
    const result = calculateQuotePricing({
      sheetsRequired: 50,
      costPerSheet: 1.0,
      machineHourlyRate: 50,
      machineSetupMinutes: 0,
      machineMaxSheetsHour: 100,
      finishingCostTotal: 10,
      markupApplied: 0,
      itemQuantity: 500,
    });

    // Custo Papel: 50
    // Tempo Máquina: 0.5h * 50 = 25
    // Acabamento: 10
    // Total Cost: 85.00
    expect(result.totalCost.toNumber()).toBe(85.00);
    expect(result.totalAmount.toNumber()).toBe(85.00);
    expect(result.unitPrice.toNumber()).toBe(0.17);
  });

  it('deve rejeitar markups inválidos (>= 1 ou < 0)', () => {
    expect(() =>
      calculateQuotePricing({
        sheetsRequired: 10,
        costPerSheet: 1,
        machineHourlyRate: 10,
        markupApplied: 1.0,
        itemQuantity: 10,
      })
    ).toThrowError(/markup/);

    expect(() =>
      calculateQuotePricing({
        sheetsRequired: 10,
        costPerSheet: 1,
        machineHourlyRate: 10,
        markupApplied: -0.1,
        itemQuantity: 10,
      })
    ).toThrowError(/markup/);
  });

  it('deve manter precisão decimal sem dízimas estranhas de ponto flutuante', () => {
    const result = calculateQuotePricing({
      sheetsRequired: 33,
      costPerSheet: '0.3333',
      machineHourlyRate: '77.77',
      machineSetupMinutes: 13,
      machineMaxSheetsHour: 1500,
      finishingCostTotal: '12.34',
      markupApplied: '0.35',
      itemQuantity: 250,
    });

    expect(result.totalCost instanceof Decimal).toBe(true);
    expect(result.totalAmount instanceof Decimal).toBe(true);
    expect(result.totalCost.decimalPlaces()).toBeLessThanOrEqual(2);
    expect(result.totalAmount.decimalPlaces()).toBeLessThanOrEqual(2);
    expect(result.unitPrice.decimalPlaces()).toBeLessThanOrEqual(4);
  });
});
