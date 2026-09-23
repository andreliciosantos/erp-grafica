import React, { useState, useEffect, forwardRef } from 'react';
import { Input, InputProps } from './Input';
import { maskCpfCnpj, maskPhone } from '../../lib/formatters';

export type MaskType = 'cpf' | 'cnpj' | 'cpfCnpj' | 'phone';

export interface MaskedInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  value?: string;
  onChangeValue?: (val: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maskType: MaskType;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ value = '', onChangeValue, onChange, maskType, ...props }, ref) => {
    const applyMask = (val: string): string => {
      if (!val) return '';
      switch (maskType) {
        case 'cpf':
        case 'cnpj':
        case 'cpfCnpj':
          return maskCpfCnpj(val);
        case 'phone':
          return maskPhone(val);
        default:
          return val;
      }
    };

    const [displayValue, setDisplayValue] = useState<string>(() => applyMask(value));

    useEffect(() => {
      setDisplayValue(applyMask(value));
    }, [value, maskType]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const masked = applyMask(raw);
      setDisplayValue(masked);
      onChangeValue?.(masked);
      onChange?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={maskType === 'phone' ? 'tel' : 'numeric'}
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = 'MaskedInput';
