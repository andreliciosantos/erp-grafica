import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { calculateSheetCutting, calculateQuotePricing } from '@erp/business-core';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { NumberInput } from '../../components/common/NumberInput';
import { Select } from '../../components/common/Select';
import { SheetCuttingCanvas } from '../../components/cutting-preview/SheetCuttingCanvas';
import { formatCurrency } from '../../lib/utils';
import {
  ArrowLeft,
  Save,
  Sparkles,
  AlertCircle,
  Bookmark,
  Settings,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { PartyItem, RawMaterialItem, MachineItem, PaginatedResult } from '../../types';
import { ProductTemplateItem, PaymentConditionItem } from '@erp/shared-types';
import { QuickQuotesTemplatesModal } from './QuickQuotesTemplatesModal';
import { PaymentConditionsModal } from '../receivables/PaymentConditionsModal';

interface CustomInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  description: string;
}

function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysToDateStr(dateStr: string, days: number): string {
  if (!dateStr) return toDateInputValue(new Date());
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
}

function generateInstallmentSchedule(
  totalAmount: number,
  count: number,
  condition: PaymentConditionItem | null,
  baseDate: string,
  interval: number,
  existingDates?: string[]
): CustomInstallment[] {
  const safeCount = Math.max(1, count);
  const safeTotal = Math.max(0, totalAmount);
  const result: CustomInstallment[] = [];
  const downPercent = condition ? Number(condition.downPaymentPercent) || 0 : 0;

  if (downPercent > 0) {
    const downAmount = Math.round(safeTotal * (downPercent / 100) * 100) / 100;
    const remainingCount = safeCount - 1;
    const remainingTotal = Math.max(0, Math.round((safeTotal - downAmount) * 100) / 100);

    result.push({
      id: `inst-1-${Date.now()}`,
      installmentNumber: 1,
      amount: downAmount,
      dueDate: existingDates?.[0] || baseDate,
      description: `Sinal / Entrada (${downPercent}%)`,
    });

    if (remainingCount > 0) {
      const each = Math.round((remainingTotal / remainingCount) * 100) / 100;
      for (let i = 1; i <= remainingCount; i++) {
        const isLast = i === remainingCount;
        const currentAmount = isLast
          ? Math.round((remainingTotal - each * (remainingCount - 1)) * 100) / 100
          : each;
        const dueDate = existingDates?.[i] || addDaysToDateStr(baseDate, i * interval);
        result.push({
          id: `inst-${i + 1}-${Date.now() + i}`,
          installmentNumber: i + 1,
          amount: currentAmount,
          dueDate,
          description: `Parcela ${i + 1}/${safeCount}`,
        });
      }
    }
  } else {
    const offsets =
      condition?.dayOffsets &&
      Array.isArray(condition.dayOffsets) &&
      condition.dayOffsets.length === safeCount
        ? (condition.dayOffsets as number[])
        : null;

    const each = Math.round((safeTotal / safeCount) * 100) / 100;
    for (let i = 0; i < safeCount; i++) {
      const isLast = i === safeCount - 1;
      const currentAmount = isLast
        ? Math.round((safeTotal - each * (safeCount - 1)) * 100) / 100
        : each;
      const offsetDays = offsets ? Number(offsets[i]) || i * interval : i * interval;
      const dueDate = existingDates?.[i] || addDaysToDateStr(baseDate, offsetDays);
      result.push({
        id: `inst-${i + 1}-${Date.now() + i}`,
        installmentNumber: i + 1,
        amount: currentAmount,
        dueDate,
        description: safeCount === 1 ? 'Pagamento À Vista (100%)' : `Parcela ${i + 1}/${safeCount}`,
      });
    }
  }

  return result;
}

export const NewQuotePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const templateIdParam = searchParams.get('templateId');
  const appliedTemplateRef = useRef<string | null>(null);

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
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch Payment Conditions (standard installment models)
  const { data: paymentConditions = [] } = useQuery<PaymentConditionItem[]>({
    queryKey: ['payment-conditions'],
    queryFn: async () => {
      const res = await api.get('/payment-conditions?activeOnly=true');
      return res.data;
    },
  });

  // Installment schedule states
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [firstDueDate, setFirstDueDate] = useState<string>(() => toDateInputValue(new Date()));
  const [intervalDays, setIntervalDays] = useState<number>(30);
  const [installments, setInstallments] = useState<CustomInstallment[]>([]);
  const [isPaymentConditionsModalOpen, setIsPaymentConditionsModalOpen] = useState(false);
  const initialAppliedRef = useRef(false);
  const installmentsRef = useRef<CustomInstallment[]>([]);
  installmentsRef.current = installments;

  // Fetch Product Templates
  const { data: templates = [] } = useQuery<ProductTemplateItem[]>({
    queryKey: ['product-templates'],
    queryFn: async () => {
      const res = await api.get('/product-templates');
      return res.data;
    },
  });

  // Apply template from URL if present
  useEffect(() => {
    if (templateIdParam && templates.length > 0 && appliedTemplateRef.current !== templateIdParam) {
      const found = templates.find((t) => t.id === templateIdParam);
      if (found) {
        applyTemplate(found);
        appliedTemplateRef.current = templateIdParam;
      }
    }
  }, [templateIdParam, templates]);

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

  const totalAmount = calculation.pricing.totalAmount;

  // Initialize installments with default condition or single payment
  useEffect(() => {
    if (totalAmount > 0 && !initialAppliedRef.current && paymentConditions.length > 0) {
      const defaultCond = paymentConditions.find((c) => c.isDefault) || paymentConditions[0];
      if (defaultCond) {
        setSelectedConditionId(defaultCond.id);
        setInstallmentsCount(defaultCond.installmentsCount);
        setIntervalDays(defaultCond.intervalDays || 30);
        setInstallments(
          generateInstallmentSchedule(
            totalAmount,
            defaultCond.installmentsCount,
            defaultCond,
            firstDueDate,
            defaultCond.intervalDays || 30
          )
        );
        initialAppliedRef.current = true;
      }
    } else if (totalAmount > 0 && installments.length === 0) {
      setInstallments(
        generateInstallmentSchedule(
          totalAmount,
          installmentsCount,
          null,
          firstDueDate,
          intervalDays
        )
      );
    }
  }, [totalAmount, paymentConditions, firstDueDate, installmentsCount, intervalDays, installments.length]);

  // Recalculate amounts if totalAmount changes (e.g. quantity or markup modified)
  const prevTotalRef = useRef(totalAmount);
  useEffect(() => {
    if (totalAmount > 0 && prevTotalRef.current !== totalAmount) {
      prevTotalRef.current = totalAmount;
      const currentList = installmentsRef.current;
      if (currentList.length > 0) {
        const activeCondition = paymentConditions.find((c) => c.id === selectedConditionId) || null;
        const existingDates = currentList.map((i) => i.dueDate);
        const updated = generateInstallmentSchedule(
          totalAmount,
          currentList.length,
          activeCondition,
          firstDueDate,
          intervalDays,
          existingDates
        );
        setInstallments(updated);
      }
    }
  }, [totalAmount, selectedConditionId, paymentConditions, firstDueDate, intervalDays]);

  const applyCondition = (condition: PaymentConditionItem) => {
    setSelectedConditionId(condition.id);
    setInstallmentsCount(condition.installmentsCount);
    setIntervalDays(condition.intervalDays || 30);
    const newSchedule = generateInstallmentSchedule(
      totalAmount,
      condition.installmentsCount,
      condition,
      firstDueDate,
      condition.intervalDays || 30
    );
    setInstallments(newSchedule);
  };

  const handleCountChange = (newCount: number) => {
    const validCount = Math.max(1, newCount);
    setInstallmentsCount(validCount);
    setSelectedConditionId(null);
    const existingDates = installments.map((i) => i.dueDate);
    const newSchedule = generateInstallmentSchedule(
      totalAmount,
      validCount,
      null,
      firstDueDate,
      intervalDays,
      existingDates.slice(0, validCount)
    );
    setInstallments(newSchedule);
  };

  const handleFirstDueDateChange = (newDate: string) => {
    setFirstDueDate(newDate);
    setInstallments((prev) =>
      prev.map((inst, idx) => ({
        ...inst,
        dueDate: idx === 0 ? newDate : addDaysToDateStr(newDate, idx * intervalDays),
      }))
    );
  };

  const handleIntervalDaysChange = (newInterval: number) => {
    const validInterval = Math.max(1, newInterval);
    setIntervalDays(validInterval);
    setInstallments((prev) =>
      prev.map((inst, idx) => ({
        ...inst,
        dueDate: idx === 0 ? inst.dueDate : addDaysToDateStr(prev[0]?.dueDate || firstDueDate, idx * validInterval),
      }))
    );
  };

  const handleUpdateInstallment = (index: number, field: keyof CustomInstallment, value: any) => {
    setSelectedConditionId(null);
    setInstallments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddInstallment = () => {
    setSelectedConditionId(null);
    const last = installments[installments.length - 1];
    const newDate = last ? addDaysToDateStr(last.dueDate, intervalDays) : firstDueDate;
    const newNumber = installments.length + 1;
    setInstallmentsCount(newNumber);
    setInstallments((prev) => [
      ...prev.map((inst) => ({
        ...inst,
        description: inst.description.replace(/\/\d+/, `/${newNumber}`),
      })),
      {
        id: `inst-${newNumber}-${Date.now()}`,
        installmentNumber: newNumber,
        amount: 0,
        dueDate: newDate,
        description: `Parcela ${newNumber}/${newNumber}`,
      },
    ]);
  };

  const handleRemoveInstallment = (index: number) => {
    if (installments.length <= 1) return;
    setSelectedConditionId(null);
    const remaining = installments.filter((_, idx) => idx !== index);
    const newCount = remaining.length;
    setInstallmentsCount(newCount);
    const renumbered = remaining.map((inst, idx) => ({
      ...inst,
      installmentNumber: idx + 1,
      description: inst.description.replace(/\d+\/\d+/, `${idx + 1}/${newCount}`),
    }));
    setInstallments(renumbered);
  };

  const handleAutoBalance = () => {
    if (installments.length === 0) return;
    const sumOther = installments.slice(0, -1).reduce((acc, i) => acc + Number(i.amount || 0), 0);
    const balancedLast = Math.max(0, Math.round((totalAmount - sumOther) * 100) / 100);
    setInstallments((prev) => {
      const next = [...prev];
      next[next.length - 1] = {
        ...next[next.length - 1],
        amount: balancedLast,
      };
      return next;
    });
  };

  const totalInstallmentsAmount = useMemo(
    () => Math.round(installments.reduce((acc, i) => acc + Number(i.amount || 0), 0) * 100) / 100,
    [installments]
  );
  const sumDifference = useMemo(
    () => Math.round((totalAmount - totalInstallmentsAmount) * 100) / 100,
    [totalAmount, totalInstallmentsAmount]
  );
  const isSumBalanced = Math.abs(sumDifference) < 0.01;

  // Mutation to create quote
  const createQuoteMutation = useMutation({
    mutationFn: async () => {
      const effectivePartyId = partyId || parties[0]?.id || '';
      const effectiveMaterialId = rawMaterialId || materials[0]?.id || '';

      const payload = {
        partyId: effectivePartyId,
        markupApplied: Number(markupPercent) / 100,
        validDays: 15,
        notes,
        items: [
          {
            productName,
            rawMaterialId: effectiveMaterialId,
            quantity: Number(quantity),
            widthMm: Number(widthMm),
            heightMm: Number(heightMm),
            colorsFront: Number(colorsFront),
            colorsBack: Number(colorsBack),
            finishingOptions,
          },
        ],
        installments: installments.map((inst, idx) => ({
          installmentNumber: idx + 1,
          totalInstallments: installments.length,
          amount: Number(inst.amount),
          dueDate: inst.dueDate,
          description: inst.description || `Parcela ${idx + 1}/${installments.length}`,
        })),
      };
      const res = await api.post('/quotes', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['quotes-list'] });
      navigate('/work-orders');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const msg = error.response?.data?.message;
      setSubmitError(Array.isArray(msg) ? msg.join(' ') : (msg || 'Erro ao gerar orçamento.'));
    },
  });

  const applyTemplate = (tpl: ProductTemplateItem) => {
    setProductName(tpl.name);
    setWidthMm(tpl.defaultWidthMm);
    setHeightMm(tpl.defaultHeightMm);
    setColorsFront(tpl.defaultColorsFront);
    setColorsBack(tpl.defaultColorsBack);
    setFinishingOptions(tpl.defaultFinishing || []);
    setMarkupPercent(tpl.defaultMarkupPercent || 35);
    if (tpl.defaultRawMaterialId) setRawMaterialId(tpl.defaultRawMaterialId);
    if (tpl.defaultMachineId) setMachineId(tpl.defaultMachineId);
    if (tpl.suggestedQuantities && tpl.suggestedQuantities.length > 0) {
      setQuantity(tpl.suggestedQuantities[0]);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/quotes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Calculadora Gráfica de Orçamento Técnico
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Imposição em folha inteira, consumo de insumos e formação de preço em tempo real
            </p>
          </div>
        </div>
      </div>

      {/* In-app Error Banner */}
      {submitError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{submitError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 text-xs font-semibold px-2 py-0.5"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Modelos Rápidos Pré-definidos (1-Clique) */}
      <Card className="border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
        <CardContent className="p-3.5 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
              <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Modelos Rápidos Pré-definidos (1-Clique)</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Preenchimento instantâneo de especificações técnicas
              </span>
              <button
                type="button"
                onClick={() => setIsTemplatesModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200 bg-emerald-100/70 hover:bg-emerald-200/70 dark:bg-emerald-900/50 dark:hover:bg-emerald-900/80 rounded-lg transition-colors cursor-pointer"
                title="Gerenciar e cadastrar modelos rápidos"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Gerenciar Modelos</span>
              </button>
            </div>
          </div>
          {templates.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-xs active:scale-95"
                >
                  <span>{tpl.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400">
              <span>Nenhum modelo rápido pré-definido cadastrado ainda.</span>
              <button
                type="button"
                onClick={() => setIsTemplatesModalOpen(true)}
                className="text-emerald-600 hover:underline font-medium"
              >
                Cadastrar primeiro modelo
              </button>
            </div>
          )}
        </CardContent>
      </Card>

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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <NumberInput
                  label="Tiragem"
                  suffix="un"
                  required
                  min={1}
                  value={quantity}
                  onChangeValue={setQuantity}
                />
                <NumberInput
                  label="Largura Aberta"
                  suffix="mm"
                  required
                  min={1}
                  value={widthMm}
                  onChangeValue={setWidthMm}
                />
                <NumberInput
                  label="Altura Aberta"
                  suffix="mm"
                  required
                  min={1}
                  value={heightMm}
                  onChangeValue={setHeightMm}
                />
              </div>

              {/* Quick Quantity Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-medium text-slate-400">Tiragens comuns:</span>
                {[500, 1000, 2500, 5000].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setQuantity(qty)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all active:scale-95 ${
                      quantity === qty
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {qty.toLocaleString('pt-BR')} un
                  </button>
                ))}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <NumberInput
                  label="Markup Comercial"
                  suffix="%"
                  required
                  min={0}
                  max={90}
                  value={markupPercent}
                  onChangeValue={setMarkupPercent}
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

            </CardContent>
          </Card>

          {/* Payment & Installments Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Condições de Pagamento & Parcelamento
                </CardTitle>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Escolha o número de parcelas, edite as datas de vencimento ou use um padrão rápido
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPaymentConditionsModalOpen(true)}
                className="text-xs h-7 px-2 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                title="Configurar tipos de pagamento e parcelamento padrão"
              >
                <Settings className="w-3.5 h-3.5 mr-1" />
                Gerenciar Padrões
              </Button>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              {/* Modelos de Acesso Rápido */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Acesso Rápido (1 clique):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {paymentConditions.map((cond) => {
                    const isSelected = selectedConditionId === cond.id;
                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() => applyCondition(cond)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {cond.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Controles de Configuração Livre */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nº de Parcelas
                  </label>
                  <select
                    value={installmentsCount}
                    onChange={(e) => handleCountChange(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24].map((num) => (
                      <option key={num} value={num}>
                        {num}x {num === 1 ? '(À vista)' : 'parcelas'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    1º Vencimento
                  </label>
                  <input
                    type="date"
                    value={firstDueDate}
                    onChange={(e) => handleFirstDueDateChange(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Intervalo Padrão
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={intervalDays}
                      onChange={(e) => handleIntervalDaysChange(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-slate-900 dark:text-slate-100"
                    />
                    <span className="text-[11px] text-slate-400 font-medium">dias</span>
                  </div>
                </div>
              </div>

              {/* Cronograma Interativo de Parcelas e Vencimentos Customizáveis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Cronograma de Vencimentos ({installments.length} parcela{installments.length > 1 ? 's' : ''}):
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddInstallment}
                    className="text-[11px] h-6 px-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar Parcela
                  </Button>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {installments.map((inst, index) => (
                    <div
                      key={inst.id}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                    >
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-xs font-bold text-slate-400 w-6 text-center">
                          {index + 1}ª
                        </span>
                        <input
                          type="text"
                          value={inst.description}
                          onChange={(e) => handleUpdateInstallment(index, 'description', e.target.value)}
                          placeholder="Descrição da parcela"
                          className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1 text-slate-800 dark:text-slate-200 flex-1 min-w-[100px]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="date"
                            value={inst.dueDate}
                            onChange={(e) => handleUpdateInstallment(index, 'dueDate', e.target.value)}
                            className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-1.5 py-1 text-slate-800 dark:text-slate-200 font-medium"
                            title="Editar data de vencimento desta parcela livremente"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={inst.amount}
                            onChange={(e) => handleUpdateInstallment(index, 'amount', Number(e.target.value))}
                            className="w-20 text-xs font-bold text-slate-900 dark:text-slate-100 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-1.5 py-1 text-right"
                            title="Editar valor desta parcela"
                          />
                        </div>

                        {installments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveInstallment(index)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                            title="Remover esta parcela"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Validação de Soma & Saldo */}
                <div className="p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {isSumBalanced ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Soma das parcelas confere: {formatCurrency(totalInstallmentsAmount)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Soma: {formatCurrency(totalInstallmentsAmount)} / Total: {formatCurrency(totalAmount)} (Dif: {formatCurrency(sumDifference)})
                      </span>
                    )}
                  </div>

                  {!isSumBalanced && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoBalance}
                      className="text-[11px] h-6 px-2 text-amber-700 border-amber-300 dark:border-amber-700"
                    >
                      Ajustar Centavos
                    </Button>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 p-2.5 text-xs rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <Button
                size="lg"
                className="w-full mt-2"
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

      {/* Quick Quotes Templates Management Modal */}
      <QuickQuotesTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={(tpl) => {
          applyTemplate(tpl);
          setIsTemplatesModalOpen(false);
        }}
      />

      {/* Payment Conditions & Installment Templates Modal */}
      <PaymentConditionsModal
        isOpen={isPaymentConditionsModalOpen}
        onClose={() => setIsPaymentConditionsModalOpen(false)}
        onSelectCondition={(cond) => {
          applyCondition(cond);
          setIsPaymentConditionsModalOpen(false);
        }}
      />
    </div>
  );
};
