import { describe, it, expect } from 'vitest';
import {
  parseCurrency,
  formatCurrencyInput,
  formatInteger,
  parseInteger,
  formatDecimal,
  parseDecimal,
  maskCpfCnpj,
  maskPhone,
} from './formatters';

describe('formatters.ts', () => {
  describe('parseCurrency', () => {
    it('should parse formatted BRL strings into numbers', () => {
      expect(parseCurrency('1.250,50')).toBe(1250.5);
      expect(parseCurrency('R$ 1.250,50')).toBe(1250.5);
      expect(parseCurrency('0,85')).toBe(0.85);
      expect(parseCurrency('1500')).toBe(1500);
      expect(parseCurrency('1500.50')).toBe(1500.5);
    });

    it('should handle numbers, empty and falsy values', () => {
      expect(parseCurrency(1250.5)).toBe(1250.5);
      expect(parseCurrency(0)).toBe(0);
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency(null)).toBe(0);
      expect(parseCurrency(undefined)).toBe(0);
    });
  });

  describe('formatCurrencyInput', () => {
    it('should format numbers with 2 decimal places and thousands separator', () => {
      expect(formatCurrencyInput(1500)).toBe('1.500,00');
      expect(formatCurrencyInput(0.85)).toBe('0,85');
      expect(formatCurrencyInput(12.5)).toBe('12,50');
    });

    it('should format typing strings dynamically', () => {
      expect(formatCurrencyInput('1500')).toBe('1.500');
      expect(formatCurrencyInput('1500,')).toBe('1.500,');
      expect(formatCurrencyInput('1500,5')).toBe('1.500,5');
      expect(formatCurrencyInput('1500,50')).toBe('1.500,50');
    });

    it('should format to 2 decimal places on blur', () => {
      expect(formatCurrencyInput('1500', true)).toBe('1.500,00');
      expect(formatCurrencyInput('1500,5', true)).toBe('1.500,50');
      expect(formatCurrencyInput('0,8', true)).toBe('0,80');
    });

    it('should return empty string for empty input', () => {
      expect(formatCurrencyInput('')).toBe('');
      expect(formatCurrencyInput(null)).toBe('');
      expect(formatCurrencyInput(undefined)).toBe('');
    });
  });

  describe('formatInteger and parseInteger', () => {
    it('should format integer with thousands separator', () => {
      expect(formatInteger(10000)).toBe('10.000');
      expect(formatInteger('5000000')).toBe('5.000.000');
      expect(formatInteger('')).toBe('');
    });

    it('should parse integer cleanly', () => {
      expect(parseInteger('10.000')).toBe(10000);
      expect(parseInteger('500')).toBe(500);
      expect(parseInteger(42)).toBe(42);
      expect(parseInteger('')).toBe(0);
    });
  });

  describe('formatDecimal and parseDecimal', () => {
    it('should format and parse decimals with comma', () => {
      expect(formatDecimal(210.5, 1, true)).toBe('210,5');
      expect(parseDecimal('210,5')).toBe(210.5);
      expect(parseDecimal('1.250,75')).toBe(1250.75);
    });
  });

  describe('maskCpfCnpj', () => {
    it('should format CPF for up to 11 digits', () => {
      expect(maskCpfCnpj('12345678901')).toBe('123.456.789-01');
      expect(maskCpfCnpj('123456789')).toBe('123.456.789');
    });

    it('should format CNPJ for up to 14 digits', () => {
      expect(maskCpfCnpj('12345678000199')).toBe('12.345.678/0001-99');
    });

    it('should handle empty input', () => {
      expect(maskCpfCnpj('')).toBe('');
      expect(maskCpfCnpj(null)).toBe('');
    });
  });

  describe('maskPhone', () => {
    it('should format landline phone (10 digits)', () => {
      expect(maskPhone('1133334444')).toBe('(11) 3333-4444');
    });

    it('should format mobile phone with 9th digit (11 digits)', () => {
      expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
    });

    it('should handle empty input', () => {
      expect(maskPhone('')).toBe('');
    });
  });
});
