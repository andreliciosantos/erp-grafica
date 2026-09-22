import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { StatCard } from './StatCard';
import { TrendingUp } from 'lucide-react';

describe('StatCard component', () => {
  it('should render title, value, and subtitle', () => {
    render(
      <StatCard
        title="Volume Cotado"
        value="R$ 48.950,00"
        subtitle="14 orçamentos gerados"
      />
    );

    expect(screen.getByText('Volume Cotado')).toBeInTheDocument();
    expect(screen.getByText('R$ 48.950,00')).toBeInTheDocument();
    expect(screen.getByText('14 orçamentos gerados')).toBeInTheDocument();
  });

  it('should render positive trend indicator', () => {
    render(
      <StatCard
        title="Faturamento"
        value="R$ 120.000,00"
        trend={{ value: '18% este mês', positive: true }}
      />
    );

    const trend = screen.getByText(/\+?\s*18% este mês/);
    expect(trend).toBeInTheDocument();
    expect(trend.className).toContain('text-emerald-400');
  });

  it('should render negative trend indicator', () => {
    render(
      <StatCard
        title="Perdas de Papel"
        value="4.5%"
        trend={{ value: '2.1% a mais', positive: false }}
      />
    );

    const trend = screen.getByText('2.1% a mais');
    expect(trend).toBeInTheDocument();
    expect(trend.className).toContain('text-rose-400');
  });

  it('should render custom icon container', () => {
    render(
      <StatCard
        title="Produção Ativa"
        value="8 OS"
        icon={<TrendingUp data-testid="trending-icon" />}
      />
    );

    expect(screen.getByTestId('trending-icon')).toBeInTheDocument();
  });
});
