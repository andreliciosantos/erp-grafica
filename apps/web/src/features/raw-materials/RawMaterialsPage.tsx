import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { NumberInput } from '../../components/common/NumberInput';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../lib/utils';
import { Package, Plus, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import { RawMaterialItem, PaginatedResult } from '../../types';

export const RawMaterialsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<RawMaterialItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('PAPER');
  const [unitOfMeasure, setUnitOfMeasure] = useState('FL');
  const [costPerUnit, setCostPerUnit] = useState(0.85);
  const [currentStock, setCurrentStock] = useState(5000);
  const [minStock, setMinStock] = useState(1000);
  const [sheetWidthMm, setSheetWidthMm] = useState(660);
  const [sheetHeightMm, setSheetHeightMm] = useState(960);
  const [grammage, setGrammage] = useState(150);

  const { data, isLoading } = useQuery<PaginatedResult<RawMaterialItem>>({
    queryKey: ['raw-materials-list'],
    queryFn: async () => {
      const res = await api.get('/raw-materials?limit=100');
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/raw-materials/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials-list'] });
      setMaterialToDelete(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Erro ao excluir insumo.');
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        category,
        unitOfMeasure,
        costPerUnit: Number(costPerUnit),
        currentStock: Number(currentStock),
        minStock: Number(minStock),
        sheetWidthMm: Number(sheetWidthMm) || undefined,
        sheetHeightMm: Number(sheetHeightMm) || undefined,
        grammage: Number(grammage) || undefined,
      };
      const res = await api.post('/raw-materials', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raw-materials-list'] });
      setIsModalOpen(false);
      setName('');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join('\n') : (msg || 'Erro ao cadastrar insumo.'));
    },
  });

  const materials = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Insumos Gráficos & Estoque de Papel
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Formatos de folha inteira, gramaturas, custo unitário e monitoramento de estoque
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Cadastrar Novo Insumo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insumos e Papéis Disponíveis ({materials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">Carregando insumos...</div>
          ) : materials.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">Nenhum insumo cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                    <th className="pb-3 font-medium">Nome do Insumo / Papel</th>
                    <th className="pb-3 font-medium">Categoria</th>
                    <th className="pb-3 font-medium">Formato da Folha</th>
                    <th className="pb-3 font-medium">Gramatura</th>
                    <th className="pb-3 font-medium">Custo Unitário</th>
                    <th className="pb-3 font-medium">Estoque Atual</th>
                    <th className="pb-3 font-medium">Status do Estoque</th>
                    <th className="pb-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60">
                  {materials.map((item) => {
                    const isLowStock = Number(item.currentStock) <= Number(item.minStock);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">{item.name}</td>
                        <td className="py-3.5">
                          <Badge variant="neutral" size="sm">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-slate-700 dark:text-slate-300 font-mono">
                          {item.sheetWidthMm && item.sheetHeightMm
                            ? `${item.sheetWidthMm} x ${item.sheetHeightMm} mm`
                            : '-'}
                        </td>
                        <td className="py-3.5 text-slate-700 dark:text-slate-300">
                          {item.grammage ? `${item.grammage} g/m²` : '-'}
                        </td>
                        <td className="py-3.5 font-medium text-slate-800 dark:text-slate-200">
                          {formatCurrency(item.costPerUnit)} / {item.unitOfMeasure}
                        </td>
                        <td className="py-3.5 font-bold text-slate-800 dark:text-slate-100">
                          {Number(item.currentStock).toLocaleString('pt-BR')} {item.unitOfMeasure}
                        </td>
                        <td className="py-3.5">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              Estoque Baixo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMaterialToDelete(item)}
                            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
                            title="Excluir Insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Insumo / Papel Gráfico"
        maxWidth="lg"
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
              Salvar Insumo
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome do Insumo"
            required
            placeholder="Ex: Papel Couché Fosco 170g"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'PAPER', label: 'Papel (Folha/Bobina)' },
                { value: 'VINYL', label: 'Vinil / Lona' },
                { value: 'INK', label: 'Tinta / Toner' },
                { value: 'PLATE', label: 'Chapa Offset / Matriz' },
                { value: 'FINISHING', label: 'Acabamento (Verniz/Ribbon)' },
                { value: 'CONSUMABLE', label: 'Consumível Operacional' },
              ]}
            />
            <Input
              label="Unidade de Medida"
              placeholder="FL (Folha), KG, UN..."
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <NumberInput
              label="Largura da Folha"
              suffix="mm"
              placeholder="660"
              value={sheetWidthMm}
              onChangeValue={setSheetWidthMm}
            />
            <NumberInput
              label="Altura da Folha"
              suffix="mm"
              placeholder="960"
              value={sheetHeightMm}
              onChangeValue={setSheetHeightMm}
            />
            <NumberInput
              label="Gramatura"
              suffix="g/m²"
              placeholder="150"
              value={grammage}
              onChangeValue={setGrammage}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <CurrencyInput
              label="Custo Unitário"
              value={costPerUnit}
              onChangeValue={setCostPerUnit}
            />
            <NumberInput
              label="Estoque Inicial"
              suffix="fl"
              value={currentStock}
              onChangeValue={setCurrentStock}
            />
            <NumberInput
              label="Estoque Mínimo"
              suffix="fl"
              value={minStock}
              onChangeValue={setMinStock}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(materialToDelete)}
        onClose={() => setMaterialToDelete(null)}
        title="Confirmar Exclusão de Insumo"
        description="Esta ação removerá o insumo do estoque."
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setMaterialToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (materialToDelete) deleteMutation.mutate(materialToDelete.id);
              }}
              isLoading={deleteMutation.isPending}
            >
              Excluir Insumo
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-200">
              Tem certeza que deseja excluir o insumo {materialToDelete?.name}?
            </p>
            <p className="mt-1 text-slate-300">
              Estoque atual: <strong className="text-white">{materialToDelete?.currentStock} {materialToDelete?.unitOfMeasure}</strong>
              <br />
              Custo: <strong className="text-white">{materialToDelete ? formatCurrency(materialToDelete.costPerUnit) : ''}</strong>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
