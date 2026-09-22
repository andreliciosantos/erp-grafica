import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '../../test/test-utils';
import { Input } from './Input';

describe('Input component', () => {
  it('should render input with placeholder', () => {
    render(<Input placeholder="Digite seu email..." />);
    expect(screen.getByPlaceholderText('Digite seu email...')).toBeInTheDocument();
  });

  it('should render label associated with input', () => {
    render(<Input label="Nome Completo" placeholder="Ex: João Silva" />);
    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
  });

  it('should display error message when error prop is provided', () => {
    render(<Input label="CPF" error="CPF inválido" />);
    expect(screen.getByText('CPF inválido')).toBeInTheDocument();
  });

  it('should display helper text when provided and no error', () => {
    render(<Input label="Senha" helperText="Mínimo 8 caracteres" />);
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument();
  });

  it('should update value on user typing', async () => {
    render(<Input label="Quantidade" placeholder="1000" />);
    const input = screen.getByLabelText(/quantidade/i);

    await userEvent.type(input, '5000');
    expect(input).toHaveValue('5000');
  });
});
