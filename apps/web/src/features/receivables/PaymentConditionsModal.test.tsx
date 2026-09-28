import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, waitFor, fireEvent } from '../../test/test-utils';
import { PaymentConditionsModal } from './PaymentConditionsModal';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('PaymentConditionsModal', () => {
  const mockConditions = [
    {
      id: 'cond-1',
      name: 'À Vista (100%)',
      description: 'Pagamento integral no pedido',
      installmentsCount: 1,
      downPaymentPercent: 100,
      intervalDays: 0,
      dayOffsets: [0],
      isDefault: true,
      isActive: true,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'cond-2',
      name: '3x Sem Juros (30/60/90d)',
      description: 'Parcelamento em 3x iguais',
      installmentsCount: 3,
      downPaymentPercent: 0,
      intervalDays: 30,
      dayOffsets: [30, 60, 90],
      isDefault: false,
      isActive: true,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: mockConditions });
    (api.post as any).mockResolvedValue({ data: { id: 'cond-new', name: 'Entrada 50% + 2x' } });
    (api.put as any).mockResolvedValue({ data: { id: 'cond-1', isDefault: true } });
    (api.delete as any).mockResolvedValue({ data: { success: true } });
  });

  it('renders modal with list of payment conditions and badges', async () => {
    renderWithProviders(<PaymentConditionsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Condições de Pagamento e Parcelamento')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('À Vista (100%)')).toBeInTheDocument();
      expect(screen.getByText('3x Sem Juros (30/60/90d)')).toBeInTheDocument();
      expect(screen.getByText('Padrão')).toBeInTheDocument();
      expect(screen.getByText('Sinal: 100%')).toBeInTheDocument();
    });
  });

  it('opens create form and submits new payment condition', async () => {
    renderWithProviders(<PaymentConditionsModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('À Vista (100%)')).toBeInTheDocument();
    });

    const newBtn = screen.getByRole('button', { name: /Nova Condição de Pagamento/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Cadastrar Nova Condição')).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByPlaceholderText(/Ex: Sinal 50%/i);
    fireEvent.change(nameInput, { target: { value: 'Entrada 50% + 2x (30/60d)' } });

    const submitBtn = screen.getByRole('button', { name: /Cadastrar Condição/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/payment-conditions',
        expect.objectContaining({
          name: 'Entrada 50% + 2x (30/60d)',
          installmentsCount: 3,
        })
      );
    });
  });

  it('calls onSelectCondition when clicking Selecionar', async () => {
    const handleSelect = vi.fn();
    renderWithProviders(
      <PaymentConditionsModal isOpen={true} onClose={vi.fn()} onSelectCondition={handleSelect} />
    );

    await waitFor(() => {
      expect(screen.getByText('À Vista (100%)')).toBeInTheDocument();
    });

    const selectButtons = screen.getAllByRole('button', { name: /Selecionar/i });
    expect(selectButtons.length).toBeGreaterThan(0);
    fireEvent.click(selectButtons[0]);

    expect(handleSelect).toHaveBeenCalledWith(mockConditions[0]);
  });
});
