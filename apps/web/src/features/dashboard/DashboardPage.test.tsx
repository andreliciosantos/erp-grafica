import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../test/test-utils';
import { DashboardPage } from './DashboardPage';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('/quotes')) {
        return Promise.resolve({
          data: {
            data: [
              { id: 'q-1', code: 101, totalAmount: 1200, status: 'APPROVED' },
            ],
            meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
          },
        });
      }
      if (url.includes('/work-orders')) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'wo-1',
                orderNumber: 'OS-2026-00001',
                status: 'PRINTING',
                priority: 2,
                totalAmount: 1200,
                createdAt: new Date().toISOString(),
              },
            ],
            meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
          },
        });
      }
      if (url.includes('/raw-materials')) {
        return Promise.resolve({
          data: {
            data: [
              { id: 'rm-1', name: 'Couché 150g', currentStock: 50, minStock: 100 },
            ],
            meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    }),
    post: vi.fn(),
  },
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard title, KPI cards, and quick production button to the left of novo orçamento', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Visão Geral da Produção')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /produção rápida/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /novo orçamento/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quadro de produção/i })).toBeInTheDocument();

    // Verify ordering in DOM: Produção Rápida should come before Novo Orçamento
    const quickProdBtn = screen.getByRole('button', { name: /produção rápida/i });
    const newQuoteBtn = screen.getByRole('button', { name: /novo orçamento/i });
    expect(
      quickProdBtn.compareDocumentPosition(newQuoteBtn) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('opens QuickProductionModal when clicking Produção Rápida button', async () => {
    renderWithProviders(<DashboardPage />);

    const quickProdBtn = screen.getByRole('button', { name: /produção rápida/i });
    await userEvent.click(quickProdBtn);

    expect(screen.getByText('Produção Rápida de Balcão')).toBeInTheDocument();
    expect(screen.getByText('Modelos Prontos de Serviços')).toBeInTheDocument();
  });
});
