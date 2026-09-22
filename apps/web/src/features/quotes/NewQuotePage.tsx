import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { calculateSheetCutting, calculateQuotePricing } from '@erp/business-core';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { SheetCuttingCanvas } from '../../components/cutting-preview/SheetCuttingCanvas';
import { formatCurrency } from '../../lib/utils';
import { ArrowLeft, Save, Sparkles, AlertCircle } from 'lucide-react';
import { PartyItem, RawMaterialItem, MachineItem, PaginatedResult } from '../../types';

export const NewQuotePage: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [partyId, setPartyId] = useState('');
  const [productName, setProductName] = useState('Folder Institucional A4');
  const [rawMaterialId, setRawMaterialId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [quantity, setQuantity] = useState(1000);
  const [widthMm, setWidthMm] = useState(210);
  const [heightMm, setHeightMm] = useState(297);
  const [colorsFront, setColorsFront] = useState(4);
  const [colorsBack, setColorsBack] = useState(4);
  const [markupPercent, setMarkupPercent] = useState(35);
  const [notes, setNotes] = useState('');
  const [finishingOptions, setFinishingOptions] = useState<string[]>(['DOBRA']);

  // Fetch Parties
  const { data: partiesData } = useQuery<PaginatedResult<PartyItem>>({
    queryKey: ['parties-select'],
    queryFn: async () => {
      const res = await api.get('/parties?limit=100');
      return res.data;
    },
  });

  // Fetch Raw Materials
  const { data: materialsData } = useQuery<PaginatedResult<RawMaterialItem>>({
    queryKey: ['materials-select'],
    queryFn: async () => {
      const res = await api.get('/raw-materials?limit=100');
      return res.data;
    },
  });

  // Fetch Machines
  const { data: machinesData } = useQuery<MachineItem[]>({
    queryKey: ['machines-select'],
    queryFn: async () => {
      const res = await api.get('/machines');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    },
  });

  const parties = partiesData?.data || [];
  const materials = materialsData?.data || [];
  const machines = machinesData || [];

  // Default selections
  React.useEffect(() => {
    if (parties.length > 0 && !partyId) setPartyId(parties[0].id);
    if (materials.length > 0 && !rawMaterialId) setRawMaterialId(materials[0].id);
    if (machines.length > 0 && !machineId) setMachineId(machines[0].id);
  }, [parties, materials, machines, partyId, rawMaterialId, machineId]);

  const selectedMaterial = materials.find((m) => m.id === rawMaterialId) || materials[0];
  const selectedMachine = machines.find((m) => m.id === machineId) || machines[0];

  const sheetWidth = selectedMaterial?.sheetWidthMm || 660;
  const sheetHeight = selectedMaterial?.sheetHeightMm || 960;

  // Real-time calculation using business-core
  const calculation = useMemo(() => {
    try {
      const cutting = calculateSheetCutting({
        parentSheetWidthMm: sheetWidth,
        parentSheetHeightMm: sheetHeight,
        itemWidthMm: Number(widthMm) || 210,
        itemHeightMm: Number(heightMm) || 297,
        bleedMm: 3,
        gripperMarginMm: 10,
        runQuantity: Number(quantity) || 1000,
        wasteRate: 0.10,
      });

      const pricing = calculateQuotePricing({
        sheetsRequired: cutting.sheetsRequired,
        costPerSheet: Number(selectedMaterial?.costPerUnit) || 0.85,
        machineSetupMinutes: selectedMachine?.setupMinutes || 15,
        machineMaxSheetsHour: selectedMachine?.maxSheetsHour || 4000,
        machineHourlyRate: Number(selectedMachine?.hourlyRate) || 180,
        finishingCostTotal: finishingOptions.length > 0 ? finishingOptions.length * 45 : 0,
        markupApplied: (Number(markupPercent) || 35) / 100,
        itemQuantity: Number(quantity) || 1000,
      });

      return {
        cutting,
        pricing: {
          paperCost: pricing.paperCost.toNumber(),
          machineHours: pricing.machineHours.toNumber(),
          machineCost: pricing.machineCost.toNumber(),
          finishingCost: pricing.finishingCost.toNumber(),
          totalCost: pricing.totalCost.toNumber(),
          totalAmount: pricing.totalAmount.toNumber(),
          unitPrice: pricing.unitPrice.toNumber(),
        },
        error: null,
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        cutting: {
          itemsPerSheet: 0,
          sheetsRequired: 0,
          effectiveRunQuantity: 0,
          bestOrientation: 'DIRECT' as const,
          usefulItemWidthMm: 0,
          usefulItemHeightMm: 0,
          usefulSheetWidthMm: 0,
          usefulSheetHeightMm: 0,
          itemsDirect: 0,
          itemsRotated: 0,
        },
        pricing: {
          paperCost: 0,
          machineHours: 0,
          machineCost: 0,
          finishingCost: 0,
          totalCost: 0,
          totalAmount: 0,
          unitPrice: 0,
        },
        error: error.message,
      };
    }
  }, [sheetWidth, sheetHeight, widthMm, heightMm, quantity, selectedMaterial, selectedMachine, finishingOptions, markupPercent]);

  // Mutation to create quote
  const createQuoteMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        partyId,
        markupApplied: Number(markupPercent) / 100,
        validDays: 15,
        notes,
        items: [
          {
            productName,
            rawMaterialId,
            quantity: Number(quantity),
            widthMm: Number(widthMm),
            heightMm: Number(heightMm),
            colorsFront: Number(colorsFront),
            colorsBack: Number(colorsBack),
            finishingOptions,
          },
        ],
      };
      const res = await api.post('/quotes', payload);
      return res.data;
    },
    onSuccess: () => {
      navigate('/quotes');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      alert(Array.isArray(msg) ? msg.join('\n') : (msg || 'Erro ao gerar orçamento.'));
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/quotes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Calculadora Gráfica de Orçamento Técnico
            </h2>
            <p className="text-xs text-slate-400">
              Imposição em folha inteira, consumo de insumos e formação de preço em tempo real
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>1. Dados do Cliente e Especificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Cliente / Parceiro"
                required
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                options={parties.map((p) => ({ value: p.id, label: `${p.name} (${p.document})` }))}
              />

              <Input
                label="Nome do Produto Gráfico"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Folder A4 4x4 Couché 150g"
              />

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Tiragem (Qtd)"
                  type="number"
                  required
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
                <Input
                  label="Largura Aberta (mm)"
                  type="number"
                  required
                  min={1}
                  value={widthMm}
                  onChange={(e) => setWidthMm(Number(e.target.value))}
                />
                <Input
                  label="Altura Aberta (mm)"
                  type="number"
                  required
                  min={1}
                  value={heightMm}
                  onChange={(e) => setHeightMm(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Insumos e Equipamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Substrato / Papel de Impressão"
                  required
                  value={rawMaterialId}
                  onChange={(e) => setRawMaterialId(e.target.value)}
                  options={materials.map((m) => ({
                    value: m.id,
                    label: `${m.name} (${m.sheetWidthMm}x${m.sheetHeightMm}mm) - ${formatCurrency(m.costPerUnit)}/fl`,
                  }))}
                />

                <Select
                  label="Máquina de Impressão"
                  required
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  options={machines.map((m) => ({
                    value: m.id,
                    label: `${m.name} (${m.maxSheetsHour} fl/h)`,
                  }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Select
                  label="Cores Frente"
                  value={colorsFront}
                  onChange={(e) => setColorsFront(Number(e.target.value))}
                  options={[
                    { value: 4, label: '4 Cores (Policromia)' },
                    { value: 1, label: '1 Cor (Monocromático)' },
                    { value: 0, label: 'Sem Impressão' },
                  ]}
                />
                <Select
                  label="Cores Verso"
                  value={colorsBack}
                  onChange={(e) => setColorsBack(Number(e.target.value))}
                  options={[
                    { value: 4, label: '4 Cores (Policromia)' },
                    { value: 1, label: '1 Cor (Monocromático)' },
                    { value: 0, label: 'Em Branco (4x0)' },
                  ]}
                />
                <Input
                  label="Markup Comercial (%)"
                  type="number"
                  required
                  min={0}
                  max={90}
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Acabamentos Especiais</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'DOBRA', label: 'Dobra / Vinco' },
                    { id: 'LAM_FOSCA', label: 'Laminação Fosca' },
                    { id: 'VERNIZ_UV', label: 'Verniz UV Total' },
                    { id: 'CORTE_ESPECIAL', label: 'Corte Especial / Faca' },
                  ].map((opt) => {
                    const isChecked = finishingOptions.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setFinishingOptions(finishingOptions.filter((f) => f !== opt.id));
                          } else {
                            setFinishingOptions([...finishingOptions, opt.id]);
                          }
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                          isChecked
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="Observações do Pedido"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Entrega prioritária, verniz UV localizado na capa..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Visual Simulator & Price Formation */}
        <div className="lg:col-span-5 space-y-5">
          {/* Sheet Visual Preview */}
          <SheetCuttingCanvas
            sheetWidthMm={sheetWidth}
            sheetHeightMm={sheetHeight}
            productWidthMm={Number(widthMm) || 210}
            productHeightMm={Number(heightMm) || 297}
            bleedMm={3}
            gripMm={10}
            itemsPerSheet={calculation.cutting.itemsPerSheet}
            sheetsRequired={calculation.cutting.sheetsRequired}
            totalQuantity={Number(quantity) || 1000}
            isRotated={calculation.cutting.bestOrientation === 'ROTATED'}
          />

          {calculation.error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{calculation.error}</span>
            </div>
          )}

          {/* Pricing Breakdown Card */}
          <Card>
            <CardHeader>
              <CardTitle>Composição de Custo e Preço de Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Custo de Papel ({calculation.cutting.sheetsRequired} fl):</span>
                <span className="font-semibold text-slate-200">
                  {formatCurrency(calculation.pricing.paperCost)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Custo Máquina (Setup + Tiragem):</span>
                <span className="font-semibold text-slate-200">
                  {formatCurrency(calculation.pricing.machineCost)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Acabamentos & Dobra:</span>
                <span className="font-semibold text-slate-200">
                  {formatCurrency(calculation.pricing.finishingCost)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-300 font-medium">
                <span>Custo Industrial Total:</span>
                <span>{formatCurrency(calculation.pricing.totalCost)}</span>
              </div>

              <div className="pt-3 mt-3 border-t-2 border-slate-800 flex items-baseline justify-between bg-slate-950/60 p-3 rounded-xl border">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Preço Total de Venda</p>
                  <p className="text-xl font-extrabold text-emerald-400">
                    {formatCurrency(calculation.pricing.totalAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Unitário</p>
                  <p className="text-xs font-semibold text-slate-300">
                    {formatCurrency(calculation.pricing.unitPrice)} / un
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full mt-4"
                onClick={() => createQuoteMutation.mutate()}
                isLoading={createQuoteMutation.isPending}
                disabled={Boolean(calculation.error) || calculation.cutting.itemsPerSheet <= 0}
              >
                <Save className="w-4 h-4" />
                Salvar Orçamento Técnico
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
