import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CurrencyInput } from './CurrencyInput';

describe('CurrencyInput component', () => {
  it('should render with initial formatted BRL value and R$ prefix', () => {
    render(<CurrencyInput label="Custo Unitário" value={1500.5} />);
    const input = screen.getByLabelText('Custo Unitário') as HTMLInputElement;
    expect(input.value).toBe('1.500,50');
    expect(screen.getByText('R$')).toBeInTheDocument();
  });

  it('should format while typing and trigger onChangeValue with number', () => {
    const handleChangeValue = vi.fn();
    render(<CurrencyInput label="Preço" onChangeValue={handleChangeValue} />);
    const input = screen.getByLabelText('Preço') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '2500' } });
    expect(input.value).toBe('2.500');
    expect(handleChangeValue).toHaveBeenCalledWith(2500);

    fireEvent.change(input, { target: { value: '2500,75' } });
    expect(input.value).toBe('2.500,75');
    expect(handleChangeValue).toHaveBeenCalledWith(2500.75);
  });

  it('should format to 2 decimal places on blur', () => {
    render(<CurrencyInput label="Total" />);
    const input = screen.getByLabelText('Total') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '350' } });
    fireEvent.blur(input);
    expect(input.value).toBe('350,00');
  });

  it('should render optional suffix when provided', () => {
    render(<CurrencyInput label="Hora" suffix="/hora" />);
    expect(screen.getByText('/hora')).toBeInTheDocument();
  });
});
