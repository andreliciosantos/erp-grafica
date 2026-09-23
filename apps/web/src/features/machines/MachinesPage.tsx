import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { NumberInput } from '../../components/common/NumberInput';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../lib/utils';
import { Printer, Plus, Gauge, Clock, Trash2, AlertTriangle, Edit2 } from 'lucide-react';
import { MachineItem } from '../../types';

export const MachinesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<MachineItem | null>(null);
  const [machineToDelete, setMachineToDelete] = useState<MachineItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [hourlyRate, setHourlyRate] = useState(180);
  const [setupMinutes, setSetupMinutes] = useState(15);
  const [maxSheetsHour, setMaxSheetsHour] = useState(5000);

  const { data, isLoading } = useQuery<MachineItem[]>({
    queryKey: ['machines-list'],
    queryFn: async () => {
      const res = await api.get('/machines');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
  });

  const handleOpenCreateModal = () => {
    setEditingMachine(null);
    setName('');
    setHourlyRate(180);
    setSetupMinutes(15);
    setMaxSheetsHour(5000);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (machine: MachineItem) => {
    setEditingMachine(machine);
    setName(machine.name);
    setHourlyRate(Number(machine.hourlyRate));
    setSetupMinutes(machine.setupMinutes || 15);
    setMaxSheetsHour(machine.maxSheetsHour || 0);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        hourlyRate: Number(hourlyRate),
        setupMinutes: Number(setupMinutes),
        maxSheetsHour: Number(maxSheetsHour) || undefined,
        isActive: true,
      };
      if (editingMachine) {
        const res = await api.put(`/machines/${editingMachine.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/machines', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines-list'] });
      setIsModalOpen(false);
      setEditingMachine(null);
      setName('');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join('\n') : (msg || 'Erro ao salvar máquina.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/machines/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines-list'] });
      setMachineToDelete(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Erro ao excluir máquina.');
    },
  });

  const machines = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Parque Gráfico & Máquinas de Impressão
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configuração de velocidades nominais, taxas horárias e tempos médios de setup
          </p>
        </div>
        <Button size="sm" onClick={handleOpenCreateModal}>
          <Plus className="w-4 h-4" />
          Cadastrar Máquina
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipamentos Disponíveis ({machines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">Carregando máquinas...</div>
          ) : machines.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">Nenhuma máquina cadastrada.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machines.map((machine) => (
                <div
                  key={machine.id}
                  className="rounded-2xl bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{machine.name}</h3>
                      <Badge variant="success" size="sm" className="mt-1">
                        Ativa
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-slate-800 dark:text-emerald-400 border border-emerald-100 dark:border-slate-700/60">
                        <Printer className="w-4 h-4" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(machine)}
                        className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/50"
                        title="Editar Máquina"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMachineToDelete(machine)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-slate-800/80 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/20 transition-colors cursor-pointer border border-rose-200/60 dark:border-slate-700/50"
                        title="Excluir Máquina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        Velocidade Nominal:
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {machine.maxSheetsHour?.toLocaleString('pt-BR') || '-'} fl/h
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        Tempo de Setup:
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{machine.setupMinutes} min</span>
                    </div>

                    <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/80 dark:border-slate-850">
                      <span>Custo Hora-Máquina:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                        {formatCurrency(machine.hourlyRate)} / hora
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMachine(null);
        }}
        title={editingMachine ? "Editar Máquina Gráfica" : "Cadastrar Máquina Gráfica"}
        maxWidth="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingMachine(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => saveMutation.mutate()}
              isLoading={saveMutation.isPending}
            >
              {editingMachine ? "Atualizar Máquina" : "Salvar Máquina"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome do Equipamento / Modelo"
            required
            placeholder="Ex: Heidelberg Speedmaster SM 74 (4 Cores)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              label="Custo Hora-Máquina"
              suffix="/h"
              required
              value={hourlyRate}
              onChangeValue={setHourlyRate}
            />
            <NumberInput
              label="Tempo de Setup"
              suffix="min"
              required
              value={setupMinutes}
              onChangeValue={setSetupMinutes}
            />
          </div>

          <NumberInput
            label="Velocidade Nominal"
            suffix="fl/h"
            placeholder="8.000"
            value={maxSheetsHour}
            onChangeValue={setMaxSheetsHour}
            helperText="Usada para calcular o tempo estimado de tiragem no orçamento."
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(machineToDelete)}
        onClose={() => setMachineToDelete(null)}
        title="Confirmar Exclusão de Máquina"
        description="Esta ação removerá a máquina do parque gráfico."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setMachineToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (machineToDelete) deleteMutation.mutate(machineToDelete.id);
              }}
              isLoading={deleteMutation.isPending}
            >
              Excluir Máquina
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-200">
              Tem certeza que deseja excluir a máquina {machineToDelete?.name}?
            </p>
            <p className="mt-1 text-slate-300">
              Taxa: <strong className="text-white">{machineToDelete ? formatCurrency(machineToDelete.hourlyRate) : ''}/h</strong>
              <br />
              Apontamentos históricos serão preservados sem vínculo ativo.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
