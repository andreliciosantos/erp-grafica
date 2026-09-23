import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { NumberInput } from '../../components/common/NumberInput';
import { MachineItem } from '../../types';
import { Play, Pause, CheckCircle } from 'lucide-react';

interface StageActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageId: string | null;
  stageName: string | null;
  orderNumber: string | null;
}

export const StageActionModal: React.FC<StageActionModalProps> = ({
  isOpen,
  onClose,
  stageId,
  stageName,
  orderNumber,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [action, setAction] = useState<'START' | 'PAUSE' | 'COMPLETE'>('START');
  const [machineId, setMachineId] = useState('');
  const [wasteQuantity, setWasteQuantity] = useState(0);
  const [notes, setNotes] = useState('');

  // Fetch Machines
  const { data: machinesData } = useQuery<MachineItem[]>({
    queryKey: ['machines-stage-action'],
    queryFn: async () => {
      const res = await api.get('/machines');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    enabled: isOpen,
  });

  const machines = machinesData || [];

  const mutation = useMutation({
    mutationFn: async () => {
      if (!stageId) return;
      const payload = {
        action,
        operatorId: user?.id,
        machineId: machineId || undefined,
        wasteQuantity: Number(wasteQuantity) || 0,
        notes: notes || undefined,
      };
      const res = await api.post(`/stages/${stageId}/action`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      alert('Apontamento de produção registrado com sucesso!');
      onClose();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Falha ao registrar apontamento.');
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Apontamento: ${stageName || 'Etapa'}`}
      description={`Ordem de Serviço: ${orderNumber || ''} | Operador: ${user?.name || ''}`}
      maxWidth="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
          >
            Confirmar Apontamento
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Action Type Picker */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Tipo de Ação no Chão de Fábrica
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAction('START')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                action === 'START'
                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Iniciar
            </button>
            <button
              type="button"
              onClick={() => setAction('PAUSE')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                action === 'PAUSE'
                  ? 'bg-amber-600/20 text-amber-400 border-amber-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Pause className="w-3.5 h-3.5" />
              Pausar
            </button>
            <button
              type="button"
              onClick={() => setAction('COMPLETE')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                action === 'COMPLETE'
                  ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Concluir
            </button>
          </div>
        </div>

        {/* Machine selection */}
        <Select
          label="Máquina / Equipamento Utilizado"
          placeholder="Selecione a máquina (opcional)..."
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          options={machines.map((m) => ({ value: m.id, label: m.name }))}
        />

        {/* Waste quantity */}
        <NumberInput
          label="Perda Operacional de Folhas/Peças (Descarte de Acerto)"
          suffix="fl"
          min={0}
          value={wasteQuantity}
          onChangeValue={setWasteQuantity}
          helperText="Informe quantas folhas foram perdidas no ajuste ou impressão."
        />

        {/* Notes */}
        <Input
          label="Observações do Operador"
          placeholder="Ex: Acerto de cor concluído, chapa OK..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
};
