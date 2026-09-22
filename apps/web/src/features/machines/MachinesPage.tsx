import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../lib/utils';
import { Printer, Plus, Gauge, Clock } from 'lucide-react';
import { MachineItem } from '../../types';

export const MachinesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        hourlyRate: Number(hourlyRate),
        setupMinutes: Number(setupMinutes),
        maxSheetsHour: Number(maxSheetsHour) || undefined,
        isActive: true,
      };
      const res = await api.post('/machines', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines-list'] });
      setIsModalOpen(false);
      setName('');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join('\n') : (msg || 'Erro ao cadastrar máquina.'));
    },
  });

  const machines = data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            Parque Gráfico & Máquinas de Impressão
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configuração de velocidades nominais, taxas horárias e tempos médios de setup
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
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
            <div className="py-12 text-center text-slate-400 text-xs">Carregando máquinas...</div>
          ) : machines.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">Nenhuma máquina cadastrada.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {machines.map((machine) => (
                <div
                  key={machine.id}
                  className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{machine.name}</h3>
                      <Badge variant="success" size="sm" className="mt-1">
                        Ativa
                      </Badge>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                      <Printer className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-slate-500" />
                        Velocidade Nominal:
                      </span>
                      <span className="font-semibold text-slate-200">
                        {machine.maxSheetsHour?.toLocaleString('pt-BR') || '-'} fl/h
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Tempo de Setup:
                      </span>
                      <span className="font-semibold text-slate-200">{machine.setupMinutes} min</span>
                    </div>

                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-850">
                      <span>Custo Hora-Máquina:</span>
                      <span className="font-bold text-emerald-400 text-sm">
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

      {/* Register Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Máquina Gráfica"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
            >
              Salvar Máquina
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
            <Input
              label="Custo Hora-Máquina (R$)"
              type="number"
              required
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
            />
            <Input
              label="Tempo de Setup (minutos)"
              type="number"
              required
              value={setupMinutes}
              onChange={(e) => setSetupMinutes(Number(e.target.value))}
            />
          </div>

          <Input
            label="Velocidade Nominal (folhas/hora)"
            type="number"
            placeholder="Ex: 8000"
            value={maxSheetsHour}
            onChange={(e) => setMaxSheetsHour(Number(e.target.value))}
            helperText="Usada para calcular o tempo estimado de tiragem no orçamento."
          />
        </div>
      </Modal>
    </div>
  );
};
