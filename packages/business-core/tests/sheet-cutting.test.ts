import { describe, it, expect } from 'vitest';
import { calculateSheetCutting } from '../src/sheet-cutting';

describe('Algoritmo de Corte e Aproveitamento de Folha (calculateSheetCutting)', () => {
  it('deve calcular o aproveitamento correto para Cartão de Visita 90x50mm na folha 660x960mm', () => {
    // Folha pai: 660 x 960 mm
    // Item aberto: 90 x 50 mm
    // Sangria padrão: 3 mm -> Item útil: 96 x 56 mm
    // Pinça padrão: 10 mm -> Folha útil: 660 x 940 mm
    // Direto: floor(660/96) * floor(940/56) = 6 * 16 = 96
    // Girado: floor(660/56) * floor(940/96) = 11 * 9 = 99
    // Melhor: Girado (99 peças)
    const result = calculateSheetCutting({
      parentSheetWidthMm: 660,
      parentSheetHeightMm: 960,
      itemWidthMm: 90,
      itemHeightMm: 50,
      runQuantity: 1000,
    });

    expect(result.usefulItemWidthMm).toBe(96);
    expect(result.usefulItemHeightMm).toBe(56);
    expect(result.usefulSheetWidthMm).toBe(660);
    expect(result.usefulSheetHeightMm).toBe(940);
    expect(result.itemsDirect).toBe(96);
    expect(result.itemsRotated).toBe(99);
    expect(result.itemsPerSheet).toBe(99);
    expect(result.bestOrientation).toBe('ROTATED');

    // Tiragem efetiva com 10% de perda: 1000 * 1.10 = 1100
    expect(result.effectiveRunQuantity).toBe(1100);
    // Folhas necessárias: ceil(1100 / 99) = 12 folhas
    expect(result.sheetsRequired).toBe(12);
  });

  it('deve aproveitar corretamente formato que SÓ cabe girado a 90°', () => {
    // Folha pai: 250 x 1000 mm, pinça 10mm -> Folha útil: 250 x 980 mm
    // Item: 240 x 150 mm, sangria 3mm -> Item útil: 246 x 156 mm
    // Direto: floor(250/246) * floor(980/156) = 1 * 6 = 6
    // Se aumentarmos o item para 246mm de largura, em um sheet de 240mm de largura:
    // Folha pai: 200 x 500 mm -> Folha útil: 200 x 480 mm
    // Item aberto: 210 x 80 mm, sangria 2mm -> Item útil: 214 x 84 mm
    // Direto: floor(200 / 214) = 0 (NÃO cabe direto!)
    // Girado: floor(200 / 84) * floor(480 / 214) = 2 * 2 = 4 peças!
    const result = calculateSheetCutting({
      parentSheetWidthMm: 200,
      parentSheetHeightMm: 500,
      itemWidthMm: 210,
      itemHeightMm: 80,
      bleedMm: 2,
      gripperMarginMm: 10,
      runQuantity: 500,
      wasteRate: 0.10,
    });

    expect(result.itemsDirect).toBe(0);
    expect(result.itemsRotated).toBe(4);
    expect(result.itemsPerSheet).toBe(4);
    expect(result.bestOrientation).toBe('ROTATED');
    expect(result.effectiveRunQuantity).toBe(550);
    expect(result.sheetsRequired).toBe(138); // ceil(550 / 4) = 138
  });

  it('deve lançar erro quando o formato do item com sangria for maior que a folha útil', () => {
    expect(() =>
      calculateSheetCutting({
        parentSheetWidthMm: 200,
        parentSheetHeightMm: 200,
        itemWidthMm: 300,
        itemHeightMm: 300,
        runQuantity: 100,
      })
    ).toThrowError(/não cabe na folha útil/);
  });

  it('deve lançar erro para dimensões inválidas ou tiragem zerada', () => {
    expect(() =>
      calculateSheetCutting({
        parentSheetWidthMm: 0,
        parentSheetHeightMm: 960,
        itemWidthMm: 90,
        itemHeightMm: 50,
        runQuantity: 100,
      })
    ).toThrowError(/maiores que zero/);

    expect(() =>
      calculateSheetCutting({
        parentSheetWidthMm: 660,
        parentSheetHeightMm: 960,
        itemWidthMm: 90,
        itemHeightMm: 50,
        runQuantity: 0,
      })
    ).toThrowError(/tiragem deve ser maior que zero/);
  });
});
