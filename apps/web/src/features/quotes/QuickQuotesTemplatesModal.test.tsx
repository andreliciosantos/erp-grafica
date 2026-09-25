import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../test/test-utils';
import { QuickQuotesTemplatesModal } from './QuickQuotesTemplatesModal';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('QuickQuotesTemplatesModal', () => {
  const mockTemplates = [
    {
      id: 'tpl-1',
      name: 'Cartão de Visita Premium',
      description: 'Cartão 9x5cm couchê 300g com laminação fosca e verniz localizado',
      category: 'Papelaria',
      defaultWidthMm: 90,
      defaultHeightMm: 50,
      defaultColorsFront: 4,
      defaultColorsBack: 4,
      defaultFinishing: ['LAM_FOSCA', 'VERNIZ_UV_LOCAL'],
      suggestedQuantities: [500, 1000, 2000],
      defaultMarkupPercent: 45,
      isActive: true,
      rawMaterial: {
        id: 'mat-1',
        name: 'Papel Couchê Brilho 300g (66x96cm)',
      },
      machine: {
        id: 'mac-1',
        name: 'Heidelberg Speedmaster SM-74 (4 Cores)',
      },
    },
    {
      id: 'tpl-2',
      name: 'Panfleto Promocional A5',
      description: 'Flyer 14.8x21cm couchê 115g colorido frente e verso',
      category: 'Promocional',
      defaultWidthMm: 148,
      defaultHeightMm: 210,
      defaultColorsFront: 4,
      defaultColorsBack: 4,
      defaultFinishing: ['REFILE'],
      suggestedQuantities: [1000, 2500, 5000],
      defaultMarkupPercent: 35,
      isActive: true,
      rawMaterial: {
        id: 'mat-2',
        name: 'Papel Couchê Brilho 115g (66x96cm)',
      },
      machine: {
        id: 'mac-1',
        name: 'Heidelberg Speedmaster SM-74 (4 Cores)',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/product-templates')) {
        return Promise.resolve({ data: mockTemplates });
      }
      if (url.includes('/raw-materials')) {
        return Promise.resolve({
          data: {
            data: [
              { id: 'mat-1', name: 'Papel Couchê Brilho 300g' },
              { id: 'mat-2', name: 'Papel Couchê Brilho 115g' },
            ],
          },
        });
      }
      if (url.includes('/machines')) {
        return Promise.resolve({
          data: [{ id: 'mac-1', name: 'Heidelberg SM-74' }],
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renders templates list when modal is open', async () => {
    renderWithProviders(
      <QuickQuotesTemplatesModal isOpen={true} onClose={vi.fn()} />
    );

    expect(
      screen.getByText(/Orçamentos Rápidos Pré-definidos/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Cartão de Visita Premium')).toBeInTheDocument();
      expect(screen.getByText('Panfleto Promocional A5')).toBeInTheDocument();
    });

    expect(screen.getByText(/90\s*[×x]\s*50\s*mm/i)).toBeInTheDocument();
    expect(screen.getByText(/148\s*[×x]\s*210\s*mm/i)).toBeInTheDocument();
  });

  it('filters templates by category pill', async () => {
    renderWithProviders(
      <QuickQuotesTemplatesModal isOpen={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Cartão de Visita Premium')).toBeInTheDocument();
    });

    const promoPill = screen.getByRole('button', { name: 'Promocional' });
    fireEvent.click(promoPill);

    expect(screen.queryByText('Cartão de Visita Premium')).not.toBeInTheDocument();
    expect(screen.getByText('Panfleto Promocional A5')).toBeInTheDocument();
  });

  it('calls onSelectTemplate when "Usar Modelo" is clicked', async () => {
    const handleSelect = vi.fn();
    renderWithProviders(
      <QuickQuotesTemplatesModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectTemplate={handleSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cartão de Visita Premium')).toBeInTheDocument();
    });

    const useButtons = screen.getAllByRole('button', { name: /Usar Modelo/i });
    fireEvent.click(useButtons[0]);

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tpl-1',
        name: 'Cartão de Visita Premium',
      })
    );
  });

  it('opens creation form when clicking "Novo Modelo Rápido" and fills preset dimensions', async () => {
    renderWithProviders(
      <QuickQuotesTemplatesModal isOpen={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Cartão de Visita Premium')).toBeInTheDocument();
    });

    const newBtn = screen.getByRole('button', { name: /Novo Modelo Rápido/i });
    fireEvent.click(newBtn);

    expect(screen.getByText(/Cadastrar Novo Modelo Rápido/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Cartão de Visita/i)).toBeInTheDocument();

    // Click shortcut preset A4
    const a4Preset = screen.getByRole('button', { name: /A4/i });
    fireEvent.click(a4Preset);

    const widthInput = screen.getByLabelText(/Largura Padrão \(mm\)/i) as HTMLInputElement;
    const heightInput = screen.getByLabelText(/Altura Padrão \(mm\)/i) as HTMLInputElement;

    expect(widthInput.value).toBe('210');
    expect(heightInput.value).toBe('297');
  });

  it('prompts delete confirmation in-app and deletes template', async () => {
    (api.delete as any).mockResolvedValue({ data: { success: true } });

    renderWithProviders(
      <QuickQuotesTemplatesModal isOpen={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Cartão de Visita Premium')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Excluir/i });
    fireEvent.click(deleteButtons[0]);

    expect(
      screen.getByText(/Excluir Orçamento Rápido/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Deseja realmente excluir o modelo/i)
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Exclusão/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/product-templates/tpl-1');
    });
  });
});
