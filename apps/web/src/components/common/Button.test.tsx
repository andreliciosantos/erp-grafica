import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/test-utils';
import { Button } from './Button';

describe('Button component', () => {
  it('should render children content correctly', () => {
    render(<Button>Gravar Pedido</Button>);
    expect(screen.getByRole('button', { name: /gravar pedido/i })).toBeInTheDocument();
  });

  it('should trigger onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Avançar</Button>);

    await userEvent.click(screen.getByRole('button', { name: /avançar/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled and not trigger onClick when disabled prop is true', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Desabilitado</Button>);

    const button = screen.getByRole('button', { name: /desabilitado/i });
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should show loading indicator and be disabled when isLoading is true', async () => {
    const handleClick = vi.fn();
    render(<Button isLoading onClick={handleClick}>Processando</Button>);

    const button = screen.getByRole('button', { name: /processando/i });
    expect(button).toBeDisabled();

    // Check presence of spinner svg
    const svg = button.querySelector('svg.animate-spin');
    expect(svg).toBeInTheDocument();

    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply primary variant classes by default', () => {
    render(<Button>Primário</Button>);
    const button = screen.getByRole('button', { name: /primário/i });
    expect(button.className).toContain('bg-emerald-500');
  });

  it('should apply danger variant classes when specified', () => {
    render(<Button variant="danger">Excluir</Button>);
    const button = screen.getByRole('button', { name: /excluir/i });
    expect(button.className).toContain('bg-rose-600');
  });
});
