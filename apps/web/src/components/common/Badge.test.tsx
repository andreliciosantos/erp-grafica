import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { Badge } from './Badge';

describe('Badge component', () => {
  it('should render label text properly', () => {
    render(<Badge>Em Produção</Badge>);
    expect(screen.getByText('Em Produção')).toBeInTheDocument();
  });

  it('should apply success variant styling', () => {
    render(<Badge variant="success">Aprovado</Badge>);
    const badge = screen.getByText('Aprovado');
    expect(badge.className).toContain('text-emerald-400');
    expect(badge.className).toContain('bg-emerald-500/15');
  });

  it('should apply warning variant styling', () => {
    render(<Badge variant="warning">Aguardando</Badge>);
    const badge = screen.getByText('Aguardando');
    expect(badge.className).toContain('text-amber-400');
    expect(badge.className).toContain('bg-amber-500/15');
  });

  it('should apply danger variant styling', () => {
    render(<Badge variant="danger">Cancelado</Badge>);
    const badge = screen.getByText('Cancelado');
    expect(badge.className).toContain('text-rose-400');
    expect(badge.className).toContain('bg-rose-500/15');
  });

  it('should apply blue and info variants styling', () => {
    render(<Badge variant="blue">Despachado</Badge>);
    const badge = screen.getByText('Despachado');
    expect(badge.className).toContain('text-blue-400');
  });

  it('should apply small size classes when size="sm"', () => {
    render(<Badge size="sm">Pequeno</Badge>);
    const badge = screen.getByText('Pequeno');
    expect(badge.className).toContain('text-[10px]');
  });
});
