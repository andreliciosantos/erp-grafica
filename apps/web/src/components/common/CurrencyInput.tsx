import React, { useState, useEffect, forwardRef } from 'react';
import { Input, InputProps } from './Input';
import { formatCurrencyInput, parseCurrency } from '../../lib/formatters';

export interface CurrencyInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  value?: number | string;
  onChangeValue?: (val: number) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChangeValue, onChange, onBlur, onFocus, suffix, leftIcon, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>(() => {
      if (value === undefined || value === null || value === '') return '';
      return formatCurrencyInput(value, true);
    });

    // Sincroniza com alterações externas de value (por exemplo, ao abrir modal de edição)
    useEffect(() => {
      if (value === undefined || value === null || value === '') {
        setDisplayValue('');
        return;
      }
      // Se o valor numérico atual parseado for diferente do que está no display, atualiza
      const currentParsed = parseCurrency(displayValue);
      const incomingNumber = typeof value === 'number' ? value : parseCurrency(value);
      if (currentParsed !== incomingNumber || displayValue === '') {
        setDisplayValue(formatCurrencyInput(value, true));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      // Permite limpar o campo
      if (!rawInput.trim()) {
        setDisplayValue('');
        onChangeValue?.(0);
        onChange?.(e);
        return;
      }

      // Aplica formatação durante a digitação
      const formatted = formatCurrencyInput(rawInput, false);
      setDisplayValue(formatted);
      const numericValue = parseCurrency(formatted);
      onChangeValue?.(numericValue);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (displayValue) {
        const formattedOnBlur = formatCurrencyInput(displayValue, true);
        setDisplayValue(formattedOnBlur);
      }
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={onFocus}
        leftIcon={
          leftIcon || (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
              R$
            </span>
          )
        }
        rightIcon={
          suffix ? (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 select-none">
              {suffix}
            </span>
          ) : undefined
        }
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
