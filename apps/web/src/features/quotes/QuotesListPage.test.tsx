import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../test/test-utils';
import { QuotesListPage } from './QuotesListPage';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('QuotesListPage', () => {
  const mockQuotes = [
    {
      id: 'quote-1',
      code: 'ORC-001',
      status: 'DRAFT',
      totalAmount: 450.0,
      validUntil: '2026-10-15T00:00:00.000Z',
      notes: 'Entrega rápida',
      items: [
        {
          id: 'item-1',
          productName: 'Cartão de Visita Couchê 300g',
          quantity: 1000,
          itemsPerSheet: 24,
          sheetsRequired: 45,
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/quotes')) {
        return Promise.resolve({ data: { data: mockQuotes } });
      }
      if (url.includes('/product-templates')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/raw-materials')) {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url.includes('/machines')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renders quotes list page with title and quick templates button', async () => {
    renderWithProviders(<QuotesListPage />);

    expect(screen.getByText('Orçamentos Gráficos')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Modelos Rápidos Pré-definidos/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Cartão de Visita Couchê 300g')).toBeInTheDocument();
      expect(screen.getByText('#ORC-001')).toBeInTheDocument();
    });
  });

  it('opens quick templates modal when clicking header button', async () => {
    renderWithProviders(<QuotesListPage />);

    const openModalBtn = screen.getByRole('button', {
      name: /Modelos Rápidos Pré-definidos/i,
    });
    fireEvent.click(openModalBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Orçamentos Rápidos Pré-definidos' })
      ).toBeInTheDocument();
    });
  });

  it('shows in-app error banner when deletion fails', async () => {
    (api.delete as any).mockRejectedValueOnce({
      response: { data: { message: 'Não é possível excluir orçamento em produção.' } },
    });

    renderWithProviders(<QuotesListPage />);

    await waitFor(() => {
      expect(screen.getByText('Cartão de Visita Couchê 300g')).toBeInTheDocument();
    });

    // Click delete button on the row
    const deleteBtn = screen.getByTitle('Excluir Orçamento');
    fireEvent.click(deleteBtn);

    // Confirm in modal
    const confirmDeleteBtn = screen.getByRole('button', { name: 'Confirmar Exclusão' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Não é possível excluir orçamento em produção.')
      ).toBeInTheDocument();
    });
  });
});
