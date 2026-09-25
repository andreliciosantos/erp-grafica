import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { NumberInput } from '../../components/common/NumberInput';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import {
  ProductTemplateItem,
  CreateProductTemplateDto,
  UpdateProductTemplateDto,
} from '@erp/shared-types';
import { RawMaterialItem, MachineItem, PaginatedResult } from '../../types';
import {
  Bookmark,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Printer,
  SlidersHorizontal,
  AlertTriangle,
  Play,
} from 'lucide-react';

interface QuickQuotesTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: ProductTemplateItem) => void;
}

const COMMON_FINISHINGS = [
  { id: 'REFILE', label: 'Refile / Guilhotina' },
  { id: 'DOBRA', label: 'Dobra / Vinco' },
  { id: 'LAMINACAO_FOSCA', label: 'Laminação BOPP Fosca' },
  { id: 'LAMINACAO_BRILHO', label: 'Laminação Brilho' },
  { id: 'VERNIZ_UV', label: 'Verniz UV Localizado' },
  { id: 'CORTE_ESPECIAL', label: 'Faca de Corte Especial' },
  { id: 'ILHOS', label: 'Ilhós Metálico' },
];

const PRESET_DIMENSIONS = [
  { label: 'Cartão (9x5)', width: 90, height: 50 },
  { label: 'Panfleto (10x14)', width: 100, height: 140 },
  { label: 'A5 (14,8x21)', width: 148, height: 210 },
  { label: 'A4 (21x29,7)', width: 210, height: 297 },
  { label: 'A3 (29,7x42)', width: 297, height: 420 },
  { label: 'Banner (60x90)', width: 600, height: 900 },
];

const CATEGORIES = [
  'Todos',
  'Papelaria',
  'Promocional',
  'Comunicação Visual',
  'Editorial',
  'Embalagens',
  'Outros',
];

export const QuickQuotesTemplatesModal: React.FC<QuickQuotesTemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [editingTemplate, setEditingTemplate] = useState<ProductTemplateItem | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<ProductTemplateItem | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Papelaria');
  const [description, setDescription] = useState('');
  const [defaultWidthMm, setDefaultWidthMm] = useState<number>(210);
  const [defaultHeightMm, setDefaultHeightMm] = useState<number>(297);
  const [defaultColorsFront, setDefaultColorsFront] = useState<number>(4);
  const [defaultColorsBack, setDefaultColorsBack] = useState<number>(4);
  const [defaultRawMaterialId, setDefaultRawMaterialId] = useState<string>('');
  const [defaultMachineId, setDefaultMachineId] = useState<string>('');
  const [defaultMarkupPercent, setDefaultMarkupPercent] = useState<number>(35);
  const [suggestedQuantitiesStr, setSuggestedQuantitiesStr] = useState('500, 1000, 2000');
  const [defaultFinishing, setDefaultFinishing] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Fetch Templates
  const { data: templates = [], isLoading } = useQuery<ProductTemplateItem[]>({
    queryKey: ['product-templates'],
    queryFn: async () => {
      const res = await api.get('/product-templates');
      return res.data;
    },
    enabled: isOpen,
  });

  // Fetch Materials
  const { data: materialsData } = useQuery<PaginatedResult<RawMaterialItem>>({
    queryKey: ['raw-materials-for-templates'],
    queryFn: async () => {
      const res = await api.get('/raw-materials?limit=100');
      return res.data;
    },
    enabled: isOpen && viewMode === 'FORM',
  });

  // Fetch Machines
  const { data: machinesData } = useQuery<MachineItem[]>({
    queryKey: ['machines-for-templates'],
    queryFn: async () => {
      const res = await api.get('/machines');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
    enabled: isOpen && viewMode === 'FORM',
  });

  const materials = materialsData?.data || [];
  const machines = machinesData || [];

  const handleOpenCreateForm = () => {
    setEditingTemplate(null);
    setName('');
    setCategory('Papelaria');
    setDescription('');
    setDefaultWidthMm(210);
    setDefaultHeightMm(297);
    setDefaultColorsFront(4);
    setDefaultColorsBack(4);
    setDefaultRawMaterialId(materials.length > 0 ? materials[0].id : '');
    setDefaultMachineId(machines.length > 0 ? machines[0].id : '');
    setDefaultMarkupPercent(35);
    setSuggestedQuantitiesStr('500, 1000, 2000');
    setDefaultFinishing(['REFILE']);
    setIsActive(true);
    setFeedbackMessage(null);
    setViewMode('FORM');
  };

  const handleOpenEditForm = (tpl: ProductTemplateItem) => {
    setEditingTemplate(tpl);
    setName(tpl.name);
    setCategory(tpl.category || 'Papelaria');
    setDescription(tpl.description || '');
    setDefaultWidthMm(tpl.defaultWidthMm);
    setDefaultHeightMm(tpl.defaultHeightMm);
    setDefaultColorsFront(tpl.defaultColorsFront);
    setDefaultColorsBack(tpl.defaultColorsBack);
    setDefaultRawMaterialId(tpl.defaultRawMaterialId || (tpl.rawMaterial ? tpl.rawMaterial.id : ''));
    setDefaultMachineId(tpl.defaultMachineId || (tpl.machine ? tpl.machine.id : ''));
    setDefaultMarkupPercent(tpl.defaultMarkupPercent || 35);
    setSuggestedQuantitiesStr((tpl.suggestedQuantities || [500, 1000, 2000]).join(', '));
    setDefaultFinishing(tpl.defaultFinishing || []);
    setIsActive(tpl.isActive !== undefined ? tpl.isActive : true);
    setFeedbackMessage(null);
    setViewMode('FORM');
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsedQuantities = suggestedQuantitiesStr
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);

      const payload: CreateProductTemplateDto = {
        name: name.trim(),
        category: category.trim() || 'Papelaria',
        description: description.trim() || undefined,
        defaultWidthMm: Number(defaultWidthMm) || 210,
        defaultHeightMm: Number(defaultHeightMm) || 297,
        defaultColorsFront: Number(defaultColorsFront) || 4,
        defaultColorsBack: Number(defaultColorsBack) || 0,
        defaultRawMaterialId: defaultRawMaterialId || undefined,
        defaultMachineId: defaultMachineId || undefined,
        defaultMarkupPercent: Number(defaultMarkupPercent) || 35,
        suggestedQuantities: parsedQuantities.length > 0 ? parsedQuantities : [500, 1000, 2000],
        defaultFinishing,
        isActive,
      };

      if (editingTemplate) {
        const res = await api.put(`/product-templates/${editingTemplate.id}`, payload as UpdateProductTemplateDto);
        return res.data;
      } else {
        const res = await api.post('/product-templates', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-templates'] });
      setFeedbackMessage({
        type: 'success',
        text: editingTemplate ? 'Modelo atualizado com sucesso!' : 'Novo modelo de orçamento rápido criado com sucesso!',
      });
      setViewMode('LIST');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Falha ao salvar modelo de orçamento rápido.';
      setFeedbackMessage({
        type: 'error',
        text: Array.isArray(message) ? message.join(' ') : message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/product-templates/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-templates'] });
      setTemplateToDelete(null);
      setFeedbackMessage({ type: 'success', text: 'Modelo removido do catálogo com sucesso.' });
    },
    onError: (err: any) => {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || 'Erro ao remover modelo.',
      });
    },
  });

  const toggleFinishing = (finId: string) => {
    setDefaultFinishing((prev) =>
      prev.includes(finId) ? prev.filter((f) => f !== finId) : [...prev, finId]
    );
  };

  const handleUseTemplate = (tpl: ProductTemplateItem) => {
    if (onSelectTemplate) {
      onSelectTemplate(tpl);
    } else {
      onClose();
      navigate(`/quotes/new?templateId=${tpl.id}`);
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      !searchTerm ||
      tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tpl.category && tpl.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tpl.rawMaterial && tpl.rawMaterial.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Todos' || tpl.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Orçamentos Rápidos Pré-definidos"
      description="Gerencie gabaritos padrão de produtos com medidas, insumos e margens para agilizar cotações no balcão e comercial."
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Feedback message */}
        {feedbackMessage && (
          <div
            className={`flex items-center justify-between p-3 rounded-xl text-xs border ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* View Mode: LIST */}
        {viewMode === 'LIST' && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar modelos por nome, formato ou papel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleOpenCreateForm} className="text-xs">
                  <Plus className="w-4 h-4 mr-1" />
                  Novo Modelo Rápido
                </Button>
              </div>
            </div>

            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer text-xs ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Template Cards Grid */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Carregando modelos pré-definidos...
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                <Bookmark className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nenhum modelo rápido encontrado
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {searchTerm
                      ? 'Tente ajustar sua busca ou categoria.'
                      : 'Clique no botão acima para cadastrar seu primeiro orçamento rápido pré-definido.'}
                  </p>
                </div>
                {!searchTerm && (
                  <Button size="sm" variant="outline" onClick={handleOpenCreateForm}>
                    <Plus className="w-4 h-4 mr-1" />
                    Criar Primeiro Modelo
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {tpl.name}
                            </h4>
                            <Badge variant="neutral" size="sm" className="text-[10px] py-0">
                              {tpl.category}
                            </Badge>
                            {!tpl.isActive && (
                              <Badge variant="warning" size="sm" className="text-[10px] py-0">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          {tpl.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {tpl.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Technical specifications pills */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">
                            {tpl.defaultWidthMm} × {tpl.defaultHeightMm} mm
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                          <span>
                            {tpl.defaultColorsFront}×{tpl.defaultColorsBack} Cores
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 col-span-2 truncate">
                          <Bookmark className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">
                            {tpl.rawMaterial?.name || 'Insumo padrão a definir'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Printer className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span className="truncate">
                            {tpl.machine?.name || 'Máquina a definir'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <SlidersHorizontal className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>Markup: {tpl.defaultMarkupPercent}%</span>
                        </div>
                      </div>

                      {/* Suggested Quantities */}
                      {tpl.suggestedQuantities && tpl.suggestedQuantities.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">Tiragens:</span>
                          {tpl.suggestedQuantities.map((q) => (
                            <span
                              key={q}
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300"
                            >
                              {q.toLocaleString('pt-BR')} un
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditForm(tpl)}
                          className="h-7 px-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs"
                          title="Editar especificações do modelo"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setTemplateToDelete(tpl)}
                          className="h-7 px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
                          title="Remover modelo"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Excluir
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUseTemplate(tpl)}
                        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Usar Modelo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View Mode: FORM */}
        {viewMode === 'FORM' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar aos Modelos Cadastrados
              </button>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {editingTemplate ? `Editar: ${editingTemplate.name}` : 'Cadastrar Novo Modelo Rápido'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs max-h-[58vh] overflow-y-auto pr-1">
              {/* Product Name */}
              <div className="md:col-span-2">
                <Input
                  label="Nome Comercial do Modelo *"
                  placeholder="Ex: Cartão de Visita 4x4 Couchê 300g..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Categoria do Produto
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Papelaria">Papelaria</option>
                  <option value="Promocional">Promocional</option>
                  <option value="Comunicação Visual">Comunicação Visual</option>
                  <option value="Editorial">Editorial</option>
                  <option value="Embalagens">Embalagens</option>
                  <option value="Brindes">Brindes</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <Input
                  label="Descrição / Detalhes Comerciais"
                  placeholder="Ex: Impressão frente e verso, refile reto em guilhotina..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Preset Dimensions Shortcuts */}
              <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Atalhos de Dimensões Padronizadas
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {PRESET_DIMENSIONS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setDefaultWidthMm(preset.width);
                        setDefaultHeightMm(preset.height);
                      }}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Width & Height */}
              <div>
                <NumberInput
                  label="Largura Padrão (mm) *"
                  suffix="mm"
                  min={1}
                  value={defaultWidthMm}
                  onChangeValue={setDefaultWidthMm}
                  helperText="Medida horizontal do impresso aberto."
                />
              </div>

              <div>
                <NumberInput
                  label="Altura Padrão (mm) *"
                  suffix="mm"
                  min={1}
                  value={defaultHeightMm}
                  onChangeValue={setDefaultHeightMm}
                  helperText="Medida vertical do impresso aberto."
                />
              </div>

              {/* Colors Front & Back */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cores Frente
                </label>
                <select
                  value={defaultColorsFront}
                  onChange={(e) => setDefaultColorsFront(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={4}>4 - Colorido (CMYK Total)</option>
                  <option value={1}>1 - Preto / Monocromático</option>
                  <option value={2}>2 - Duas Cores (Escala)</option>
                  <option value={0}>0 - Sem Impressão na Frente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cores Verso
                </label>
                <select
                  value={defaultColorsBack}
                  onChange={(e) => setDefaultColorsBack(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={4}>4 - Colorido (CMYK Total)</option>
                  <option value={1}>1 - Preto / Monocromático</option>
                  <option value={0}>0 - Branco (Sem Impressão no Verso)</option>
                </select>
              </div>

              {/* Raw Material */}
              <div>
                <Select
                  label="Matéria-Prima Padrão (Papel / Lona / Vinil)"
                  placeholder="Selecione o insumo padrão..."
                  value={defaultRawMaterialId}
                  onChange={(e) => setDefaultRawMaterialId(e.target.value)}
                  options={[
                    { value: '', label: 'Não vinculado (escolher no orçamento)' },
                    ...materials.map((m) => ({
                      value: m.id,
                      label: `${m.name} (${m.sheetWidthMm || 660}x${m.sheetHeightMm || 960}mm)`,
                    })),
                  ]}
                />
              </div>

              {/* Machine */}
              <div>
                <Select
                  label="Máquina / Equipamento Padrão"
                  placeholder="Selecione a impressora..."
                  value={defaultMachineId}
                  onChange={(e) => setDefaultMachineId(e.target.value)}
                  options={[
                    { value: '', label: 'Não vinculado (escolher no orçamento)' },
                    ...machines.map((m) => ({
                      value: m.id,
                      label: `${m.name} (Setup: ${m.setupMinutes}m, Taxa: R$ ${m.hourlyRate}/h)`,
                    })),
                  ]}
                />
              </div>

              {/* Markup & Quantities */}
              <div>
                <NumberInput
                  label="Markup Comercial Padrão (%)"
                  suffix="%"
                  min={0}
                  value={defaultMarkupPercent}
                  onChangeValue={setDefaultMarkupPercent}
                  helperText="Margem líquida aplicada sobre o custo de produção."
                />
              </div>

              <div>
                <Input
                  label="Tiragens Sugeridas (Separadas por vírgula)"
                  placeholder="Ex: 500, 1000, 2500, 5000"
                  value={suggestedQuantitiesStr}
                  onChange={(e) => setSuggestedQuantitiesStr(e.target.value)}
                  helperText="Quantidades que aparecem em pílulas de 1 clique."
                />
              </div>

              {/* Finishings Selection */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Acabamentos Gráficos Padrão
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COMMON_FINISHINGS.map((fin) => {
                    const isSelected = defaultFinishing.includes(fin.id);
                    return (
                      <button
                        key={fin.id}
                        type="button"
                        onClick={() => toggleFinishing(fin.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                        <span>{fin.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Is Active */}
              <div className="md:col-span-2 flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="tpl-active-checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="tpl-active-checkbox"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Disponível para seleção rápida na barra de orçamentos (Ativo)
                </label>
              </div>
            </div>

            {/* Form Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setViewMode('LIST')}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => saveMutation.mutate()}
                isLoading={saveMutation.isPending}
                disabled={!name.trim() || defaultWidthMm <= 0 || defaultHeightMm <= 0}
              >
                Salvar Modelo Rápido
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation In-App Modal */}
      {templateToDelete && (
        <Modal
          isOpen={Boolean(templateToDelete)}
          onClose={() => setTemplateToDelete(null)}
          title="Excluir Orçamento Rápido"
          description="Esta ação removerá o gabarito do catálogo de seleção rápida."
          maxWidth="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setTemplateToDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(templateToDelete.id)}
                isLoading={deleteMutation.isPending}
              >
                Confirmar Exclusão
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900 dark:text-rose-200">
                  Deseja realmente excluir o modelo "{templateToDelete.name}"?
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1">
                  Os orçamentos já gerados com base neste gabarito permanecerão intactos no histórico.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
