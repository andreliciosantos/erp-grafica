import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { NumberInput } from '../../components/common/NumberInput';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../lib/utils';
import {
  Sparkles,
  Plus,
  Trash2,
  Package,
  Layers,
  AlertCircle,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { QuickServicePresetItem, RawMaterialItem, PaginatedResult } from '../../types';

interface QuickPresetsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickPresetsManagerModal: React.FC<QuickPresetsManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Xerox');
  const [defaultPrice, setDefaultPrice] = useState(1.0);
  const [rawMaterialId, setRawMaterialId] = useState<string>('');
  const [materialConsumeQty, setMaterialConsumeQty] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Queries
  const { data: presets = [], isLoading: isLoadingPresets } = useQuery<QuickServicePresetItem[]>({
    queryKey: ['quick-service-presets', 'all'],
    queryFn: async () => {
      const res = await api.get('/quick-service-presets?all=true');
      return res.data;
    },
    enabled: isOpen,
  });

  const { data: rawMaterialsData } = useQuery<PaginatedResult<RawMaterialItem>>({
    queryKey: ['raw-materials-select'],
    queryFn: async () => {
      const res = await api.get('/raw-materials?limit=200');
      return res.data;
    },
    enabled: isOpen,
  });

  const rawMaterials: RawMaterialItem[] = Array.isArray(rawMaterialsData?.data)
    ? rawMaterialsData.data
    : Array.isArray(rawMaterialsData)
    ? (rawMaterialsData as unknown as RawMaterialItem[])
    : [];

  const presetsList: QuickServicePresetItem[] = Array.isArray(presets)
    ? presets
    : Array.isArray((presets as any)?.data)
    ? (presets as any).data
    : [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error('Informe o nome do modelo de serviço rápido.');
      }
      if (defaultPrice < 0) {
        throw new Error('O preço padrão não pode ser negativo.');
      }

      const payload = {
        name: name.trim(),
        category: category.trim() || 'Outros',
        defaultPrice,
        rawMaterialId: rawMaterialId ? rawMaterialId : null,
        materialConsumeQty: rawMaterialId ? Math.max(1, Math.round(materialConsumeQty)) : 0,
        isActive: true,
      };

      const res = await api.post('/quick-service-presets', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-service-presets'] });
      setName('');
      setDefaultPrice(1.0);
      setRawMaterialId('');
      setMaterialConsumeQty(1);
      setErrorMessage(null);
      setSuccessMessage('Modelo de serviço rápido salvo com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Falha ao salvar modelo.';
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quick-service-presets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-service-presets'] });
      setSuccessMessage('Modelo removido com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Falha ao excluir modelo.';
      setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const selectedMaterial = rawMaterials.find((m) => m.id === rawMaterialId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciar Modelos Prontos de Serviços Rápidos"
      description="Crie e exclua modelos predefinidos de balcão com vínculo de estoque automático"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Alertas */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulário de Criação de Modelo */}
        <form
          onSubmit={handleCreate}
          className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Cadastrar Novo Modelo Pronto</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Nome do Serviço"
                placeholder="Ex: Xerox P&B A4, Plastificação A3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Select
                label="Categoria"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: 'Xerox', label: 'Xerox' },
                  { value: 'Impressão', label: 'Impressão' },
                  { value: 'Acabamento', label: 'Acabamento' },
                  { value: 'Foto & Scan', label: 'Foto & Scan' },
                  { value: 'Comunicação Visual', label: 'Comunicação Visual' },
                  { value: 'Outros', label: 'Outros' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <CurrencyInput
                label="Preço Padrão de Venda"
                value={defaultPrice}
                onChangeValue={(val) => setDefaultPrice(val)}
              />
            </div>

            <div>
              <Select
                label="Insumo Consumido do Estoque"
                value={rawMaterialId}
                onChange={(e) => setRawMaterialId(e.target.value)}
                options={[
                  { value: '', label: '(Nenhum insumo / Somente mão de obra)' },
                  ...rawMaterials.map((m) => ({
                    value: m.id,
                    label: `${m.name} (Disp: ${Number(m.currentStock).toLocaleString()} ${m.unitOfMeasure})`,
                  })),
                ]}
              />
            </div>

            <div>
              <NumberInput
                label={`Qtd Consumida por Unidade ${selectedMaterial ? `(${selectedMaterial.unitOfMeasure})` : ''}`}
                value={materialConsumeQty}
                min={1}
                step={1}
                onChangeValue={(val) => setMaterialConsumeQty(Math.max(1, Math.round(val)))}
                disabled={!rawMaterialId}
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Modelo
            </Button>
          </div>
        </form>

        {/* Lista de Modelos Existentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-500" />
              Modelos Cadastrados ({presetsList.length})
            </span>
          </div>

          {isLoadingPresets ? (
            <div className="py-8 text-center text-xs text-slate-400">Carregando modelos...</div>
          ) : presetsList.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
              Nenhum modelo cadastrado. Use o formulário acima para adicionar o primeiro.
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {presetsList.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {preset.name}
                        </span>
                        <Badge variant="neutral" size="sm" className="text-[10px]">
                          <Tag className="w-2.5 h-2.5 mr-0.5" />
                          {preset.category}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          Preço padrão: {formatCurrency(Number(preset.defaultPrice))}
                        </span>

                        {preset.rawMaterial ? (
                          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            <Package className="w-3 h-3 text-amber-500" />
                            Consome {Number(preset.materialConsumeQty)} {preset.rawMaterial.unitOfMeasure} de{' '}
                            <strong>{preset.rawMaterial.name}</strong> (Estoque: {Number(preset.rawMaterial.currentStock).toLocaleString()} {preset.rawMaterial.unitOfMeasure})
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Sem dedução de matéria-prima
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botão de Excluir */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir o modelo "${preset.name}"?`)) {
                          deleteMutation.mutate(preset.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Excluir modelo"
                      aria-label={`Excluir modelo ${preset.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose} size="sm">
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
