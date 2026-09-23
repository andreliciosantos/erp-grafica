import React, { useState, useEffect, forwardRef } from 'react';
import { Input, InputProps } from './Input';
import { formatInteger, parseInteger, formatDecimal, parseDecimal } from '../../lib/formatters';

export interface NumberInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  value?: number | string;
  onChangeValue?: (val: number) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: string;
  decimals?: number;
  min?: number;
  max?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChangeValue, onChange, onBlur, suffix, decimals = 0, min, max, ...props }, ref) => {
    const isDecimal = decimals > 0;

    const [displayValue, setDisplayValue] = useState<string>(() => {
      if (value === undefined || value === null || value === '') return '';
      return isDecimal
        ? formatDecimal(value, decimals, true)
        : formatInteger(value);
    });

    useEffect(() => {
      if (value === undefined || value === null || value === '') {
        setDisplayValue('');
        return;
      }
      const currentParsed = isDecimal ? parseDecimal(displayValue) : parseInteger(displayValue);
      const incomingNumber = typeof value === 'number'
        ? value
        : (isDecimal ? parseDecimal(value) : parseInteger(value));

      if (currentParsed !== incomingNumber || displayValue === '') {
        setDisplayValue(isDecimal ? formatDecimal(value, decimals, true) : formatInteger(value));
      }
    }, [value, decimals, isDecimal]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;

      if (!rawInput.trim()) {
        setDisplayValue('');
        onChangeValue?.(min !== undefined && min > 0 ? min : 0);
        onChange?.(e);
        return;
      }

      if (isDecimal) {
        // Decimal mode: permite números e uma vírgula/ponto
        let sanitized = rawInput.replace(/[^\d,.]/g, '');
        const firstSep = sanitized.search(/[,.]/);
        if (firstSep !== -1) {
          const intPart = sanitized.slice(0, firstSep).replace(/\D/g, '');
          const decPart = sanitized.slice(firstSep + 1).replace(/\D/g, '').slice(0, decimals);
          sanitized = `${intPart},${decPart}`;
        } else {
          sanitized = sanitized.replace(/\D/g, '');
        }

        let num = parseDecimal(sanitized);
        if (max !== undefined && num > max) num = max;
        if (min !== undefined && num < min && sanitized.length > 2) num = min;

        setDisplayValue(sanitized);
        onChangeValue?.(num);
      } else {
        // Integer mode: apenas inteiros com formatação de milhar
        const parsed = parseInteger(rawInput);
        let clamped = parsed;
        if (max !== undefined && clamped > max) clamped = max;

        const formatted = formatInteger(clamped);
        setDisplayValue(formatted);
        onChangeValue?.(clamped);
      }

      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (displayValue) {
        if (isDecimal) {
          let num = parseDecimal(displayValue);
          if (min !== undefined && num < min) num = min;
          if (max !== undefined && num > max) num = max;
          setDisplayValue(formatDecimal(num, decimals, true));
          onChangeValue?.(num);
        } else {
          let num = parseInteger(displayValue);
          if (min !== undefined && num < min) num = min;
          if (max !== undefined && num > max) num = max;
          setDisplayValue(formatInteger(num));
          onChangeValue?.(num);
        }
      }
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={isDecimal ? 'decimal' : 'numeric'}
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        rightIcon={
          suffix ? (
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 select-none">
              {suffix}
            </span>
          ) : undefined
        }
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';
