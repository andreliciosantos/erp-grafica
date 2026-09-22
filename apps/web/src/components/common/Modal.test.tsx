import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/test-utils';
import { Modal } from './Modal';
import { Button } from './Button';

describe('Modal component', () => {
  it('should not render anything when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Detalhes do Pedido">
        <p>Conteúdo interno</p>
      </Modal>
    );

    expect(screen.queryByText('Detalhes do Pedido')).not.toBeInTheDocument();
    expect(screen.queryByText('Conteúdo interno')).not.toBeInTheDocument();
  });

  it('should render title, description, and children when isOpen is true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Apontamento de Máquina"
        description="Selecione o operador e registre perdas"
      >
        <p>Formulário de apontamento</p>
      </Modal>
    );

    expect(screen.getByText('Apontamento de Máquina')).toBeInTheDocument();
    expect(screen.getByText('Selecione o operador e registre perdas')).toBeInTheDocument();
    expect(screen.getByText('Formulário de apontamento')).toBeInTheDocument();
  });

  it('should call onClose callback when close button is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Teste de Fechamento">
        <p>Conteúdo</p>
      </Modal>
    );

    // Close button has an X icon and button role
    const closeBtn = screen.getByRole('button');
    await userEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should render custom footer actions', () => {
    render(
      <Modal
        isOpen={true}
        onClose={() => {}}
        title="Confirmação"
        footer={<Button>Confirmar Ação</Button>}
      >
        <p>Tem certeza?</p>
      </Modal>
    );

    expect(screen.getByRole('button', { name: /confirmar ação/i })).toBeInTheDocument();
  });
});
