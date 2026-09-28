import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpenseDateFilter, DateFilterValue } from './ExpenseDateFilter';

describe('ExpenseDateFilter', () => {
  const initialValue: DateFilterValue = {
    mode: 'month',
    competenceMonth: '2026-09',
    startDate: '',
    endDate: '',
    dateField: 'competenceDate',
  };

  it('should render trigger button with month and accessible aria-label', () => {
    const handleChange = vi.fn();
    render(<ExpenseDateFilter value={initialValue} onChange={handleChange} />);

    const trigger = screen.getByLabelText(/mês de competência/i);
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText(/setembro de 2026/i)).toBeInTheDocument();
    expect(screen.getByText('Comp.')).toBeInTheDocument();
  });

  it('should navigate to previous and next month using arrow buttons', () => {
    const handleChange = vi.fn();
    render(<ExpenseDateFilter value={initialValue} onChange={handleChange} />);

    const prevButton = screen.getByLabelText(/período anterior/i);
    fireEvent.click(prevButton);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'month',
        competenceMonth: '2026-08',
      })
    );

    const nextButton = screen.getByLabelText(/próximo período/i);
    fireEvent.click(nextButton);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'month',
        competenceMonth: '2026-10',
      })
    );
  });

  it('should open popover when clicking trigger and switch tabs', () => {
    const handleChange = vi.fn();
    render(<ExpenseDateFilter value={initialValue} onChange={handleChange} />);

    const trigger = screen.getByLabelText(/mês de competência/i);
    fireEvent.click(trigger);

    expect(screen.getByText('Por Mês')).toBeInTheDocument();
    expect(screen.getByText('Entre Datas')).toBeInTheDocument();
    expect(screen.getByText('Filtrar por:')).toBeInTheDocument();

    // Switch to custom range tab
    fireEvent.click(screen.getByText('Entre Datas'));
    expect(screen.getByText('Atalhos Rápidos')).toBeInTheDocument();
    expect(screen.getByText('Data Inicial:')).toBeInTheDocument();
    expect(screen.getByText('Data Final:')).toBeInTheDocument();
  });

  it('should select month in month grid', () => {
    const handleChange = vi.fn();
    render(<ExpenseDateFilter value={initialValue} onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText(/mês de competência/i));

    // Click 'Out' (October)
    const octButton = screen.getByText('Out');
    fireEvent.click(octButton);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'month',
        competenceMonth: '2026-10',
      })
    );
  });

  it('should apply quick presets in Entre Datas tab', () => {
    const handleChange = vi.fn();
    render(<ExpenseDateFilter value={initialValue} onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText(/mês de competência/i));
    fireEvent.click(screen.getByText('Entre Datas'));

    const todayButton = screen.getByText('Hoje');
    fireEvent.click(todayButton);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'custom',
        startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    );
  });

  it('should switch dateField to Vencimento', () => {
    const handleChange = vi.fn();
    render(<ExpenseDateFilter value={initialValue} onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText(/mês de competência/i));

    const vencimentoBtn = screen.getByRole('button', { name: /^vencimento$/i });
    fireEvent.click(vencimentoBtn);

    // Apply via month selection
    fireEvent.click(screen.getByText('Ago'));

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'month',
        competenceMonth: '2026-08',
        dateField: 'dueDate',
      })
    );
  });
});
