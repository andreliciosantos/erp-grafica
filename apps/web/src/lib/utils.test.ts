import { describe, it, expect } from 'vitest';
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusConfig,
  getPriorityConfig,
} from './utils';

describe('utils.ts', () => {
  describe('cn (class merging)', () => {
    it('should merge classes correctly and handle conditional classes', () => {
      expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
      expect(cn('px-2', false && 'hidden', 'text-white')).toBe('px-2 text-white');
      expect(cn('px-2', undefined, null, 'bg-red-500')).toBe('px-2 bg-red-500');
    });

    it('should resolve tailwind conflict overrides properly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('formatCurrency', () => {
    it('should format numbers to Brazilian Real currency format', () => {
      const formatted = formatCurrency(1250.5);
      // Standard pt-BR format: "R$ 1.250,50" (or with non-breaking space)
      expect(formatted).toMatch(/R\$\s*1\.250,50/);
    });

    it('should handle numeric string inputs', () => {
      const formatted = formatCurrency('45.90');
      expect(formatted).toMatch(/R\$\s*45,90/);
    });

    it('should return R$ 0,00 for null, undefined, or NaN inputs', () => {
      expect(formatCurrency(undefined)).toBe('R$ 0,00');
      expect(formatCurrency(null)).toBe('R$ 0,00');
      expect(formatCurrency('invalid-number')).toBe('R$ 0,00');
    });
  });

  describe('formatDate', () => {
    it('should format ISO date strings to pt-BR format DD/MM/YYYY', () => {
      const formatted = formatDate('2026-09-22T12:00:00.000Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should return hyphen for null or undefined', () => {
      expect(formatDate(undefined)).toBe('-');
      expect(formatDate(null)).toBe('-');
      expect(formatDate('')).toBe('-');
    });
  });

  describe('formatDateTime', () => {
    it('should format ISO date strings with hour and minutes', () => {
      const formatted = formatDateTime('2026-09-22T14:30:00.000Z');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });

    it('should return hyphen for null or undefined', () => {
      expect(formatDateTime(undefined)).toBe('-');
      expect(formatDateTime(null)).toBe('-');
      expect(formatDateTime('')).toBe('-');
    });
  });

  describe('getStatusConfig', () => {
    it('should return correct config for industrial stages', () => {
      expect(getStatusConfig('PENDING').label).toBe('Aguardando');
      expect(getStatusConfig('PRE_PRESS').label).toBe('Pré-Impressão (CTP)');
      expect(getStatusConfig('PRINTING').label).toBe('Em Impressão');
      expect(getStatusConfig('FINISHING').label).toBe('Acabamento');
      expect(getStatusConfig('QUALITY_CONTROL').label).toBe('Controle de Qualidade');
      expect(getStatusConfig('READY_FOR_PICKUP').label).toBe('Pronto p/ Retirada');
    });

    it('should return correct config for quotes and orders statuses', () => {
      expect(getStatusConfig('APPROVED').variant).toBe('success');
      expect(getStatusConfig('REJECTED').variant).toBe('danger');
      expect(getStatusConfig('DRAFT').variant).toBe('neutral');
      expect(getStatusConfig('CANCELLED').variant).toBe('danger');
      expect(getStatusConfig('DISPATCHED').variant).toBe('blue');
      expect(getStatusConfig('DELIVERED').variant).toBe('success');
    });

    it('should fallback to neutral with raw status label for unknown statuses', () => {
      const config = getStatusConfig('CUSTOM_STAGE');
      expect(config.label).toBe('CUSTOM_STAGE');
      expect(config.variant).toBe('neutral');
    });
  });

  describe('getPriorityConfig', () => {
    it('should return Urgente for priority 4', () => {
      const p4 = getPriorityConfig(4);
      expect(p4.label).toBe('Urgente');
      expect(p4.badge).toContain('rose');
    });

    it('should return Alta for priority 3', () => {
      const p3 = getPriorityConfig(3);
      expect(p3.label).toBe('Alta');
      expect(p3.badge).toContain('amber');
    });

    it('should return Normal for priority 2', () => {
      const p2 = getPriorityConfig(2);
      expect(p2.label).toBe('Normal');
      expect(p2.badge).toContain('blue');
    });

    it('should return Baixa for priority 1 or lower', () => {
      const p1 = getPriorityConfig(1);
      expect(p1.label).toBe('Baixa');
      expect(p1.badge).toContain('slate');
    });
  });
});
