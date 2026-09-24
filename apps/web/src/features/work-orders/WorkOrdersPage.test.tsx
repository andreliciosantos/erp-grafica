import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '../../test/test-utils';
import { WorkOrdersPage } from './WorkOrdersPage';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('../../lib/socket', () => ({
  getSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
    connected: true,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('WorkOrdersPage', () => {
  const mockOrders = [
    {
      id: 'wo-1',
      orderNumber: 'OS-2026-0001',
      status: 'PENDING',
      priority: 'HIGH',
      totalAmount: 1500,
      deliveryDate: '2026-09-30T12:00:00Z',
      createdAt: '2026-09-20T10:00:00Z',
      barcode: 'OS20260001',
      party: { id: 'p-1', name: 'Gráfica Express' },
      stages: [{ id: 'st-1', name: 'Análise Comercial', status: 'PENDING' }],
    },
    {
      id: 'wo-2',
      orderNumber: 'OS-2026-0002',
      status: 'PRINTING',
      priority: 'URGENT',
      totalAmount: 3200,
      deliveryDate: '2026-10-02T12:00:00Z',
      createdAt: '2026-09-21T10:00:00Z',
      barcode: 'OS20260002',
      party: { id: 'p-2', name: 'Editora Nacional' },
      stages: [
        { id: 'st-2a', name: 'Liberação', status: 'COMPLETED' },
        { id: 'st-2b', name: 'CTP', status: 'COMPLETED' },
        { id: 'st-2c', name: 'Impressão Offset', status: 'IN_PROGRESS' },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({
      data: {
        data: mockOrders,
        total: 2,
        page: 1,
        limit: 100,
      },
    });
  });

  it('renders page header and both Kanban and Table view toggles', async () => {
    renderWithProviders(<WorkOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Chão de Fábrica & PCP/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Kanban/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tabela/i })).toBeInTheDocument();
  });

  it('renders mobile stage carousel pills with short stage names and order counts', async () => {
    renderWithProviders(<WorkOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Liberação')).toBeInTheDocument();
      expect(screen.getByText('CTP / Pré')).toBeInTheDocument();
      expect(screen.getAllByText('Impressão').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Acabamento').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Qualidade')).toBeInTheDocument();
      expect(screen.getByText('Retirada')).toBeInTheDocument();
      expect(screen.getByText('Entregue')).toBeInTheDocument();
    });
  });

  it('scrolls into view smoothly when clicking a mobile stage pill', async () => {
    renderWithProviders(<WorkOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Liberação')).toBeInTheDocument();
    });

    const scrollIntoViewMock = vi.fn();
    const printingCol = document.getElementById('kanban-col-PRINTING');
    if (printingCol) {
      printingCol.scrollIntoView = scrollIntoViewMock;
    }

    const impressionPill = screen.getAllByRole('button').find((btn) => btn.textContent?.includes('Impressão') && btn.textContent?.includes('1'));
    if (impressionPill) {
      fireEvent.click(impressionPill);
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        inline: 'start',
        block: 'nearest',
      });
    }
  });

  it('switches to table view when clicking Tabela button', async () => {
    renderWithProviders(<WorkOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('OS-2026-0001')).toBeInTheDocument();
    });

    const tableButton = screen.getByRole('button', { name: /Tabela/i });
    fireEvent.click(tableButton);

    await waitFor(() => {
      expect(screen.getByText(/Ordens de Serviço \(2\)/i)).toBeInTheDocument();
    });
  });

  it('supports drag and drop of order card to advance status to another column', async () => {
    (api.patch as any).mockResolvedValue({ data: { ...mockOrders[0], status: 'PRE_PRESS' } });

    renderWithProviders(<WorkOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('OS-2026-0001')).toBeInTheDocument();
    });

    const card = screen.getByText('OS-2026-0001').closest('div[draggable="true"]');
    expect(card).toBeInTheDocument();

    const targetColumn = document.getElementById('kanban-col-PRE_PRESS');
    expect(targetColumn).toBeInTheDocument();

    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn((format: string) => {
        if (format === 'text/plain' || format === 'text') return 'wo-1';
        return '';
      }),
      effectAllowed: 'move',
      dropEffect: 'none',
    };

    if (card && targetColumn) {
      fireEvent.dragStart(card, { dataTransfer });
      fireEvent.dragEnter(targetColumn, { dataTransfer });
      fireEvent.dragOver(targetColumn, { dataTransfer });
      fireEvent.drop(targetColumn, { dataTransfer });
    }

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/work-orders/wo-1/status', { status: 'PRE_PRESS' });
    });
  });

  it('redirects to /quotes/new when clicking the new order / quote button', async () => {
    renderWithProviders(<WorkOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(/Novo Pedido \/ Orçamento/i)).toBeInTheDocument();
    });

    const newBtn = screen.getByRole('button', { name: /Novo Pedido \/ Orçamento/i });
    fireEvent.click(newBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/quotes/new');
  });
});

