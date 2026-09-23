import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NumberInput } from './NumberInput';

describe('NumberInput component', () => {
  it('should render with initial formatted integer and suffix', () => {
    render(<NumberInput label="Tiragem" suffix="un" value={50000} />);
    const input = screen.getByLabelText('Tiragem') as HTMLInputElement;
    expect(input.value).toBe('50.000');
    expect(screen.getByText('un')).toBeInTheDocument();
  });

  it('should trigger onChangeValue with clean number on typing', () => {
    const handleChangeValue = vi.fn();
    render(<NumberInput label="Largura" suffix="mm" onChangeValue={handleChangeValue} />);
    const input = screen.getByLabelText('Largura') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '660' } });
    expect(input.value).toBe('660');
    expect(handleChangeValue).toHaveBeenCalledWith(660);
  });

  it('should support decimals when decimals prop is provided', () => {
    const handleChangeValue = vi.fn();
    render(<NumberInput label="Markup" suffix="%" decimals={1} onChangeValue={handleChangeValue} />);
    const input = screen.getByLabelText('Markup') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '35,5' } });
    expect(input.value).toBe('35,5');
    expect(handleChangeValue).toHaveBeenCalledWith(35.5);
  });
});
