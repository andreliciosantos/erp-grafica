import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  RotateCcw,
  X,
  Filter,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DateFilterValue {
  mode: 'month' | 'custom';
  competenceMonth: string; // YYYY-MM
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dateField: 'competenceDate' | 'dueDate';
}

export interface ExpenseDateFilterProps {
  value: DateFilterValue;
  onChange: (newValue: DateFilterValue) => void;
  className?: string;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const MONTH_NAMES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toLocalIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseYearMonth(ym: string): { year: number; month: number } {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const [y, m] = ym.split('-').map(Number);
  return { year: y, month: m };
}

export const ExpenseDateFilter: React.FC<ExpenseDateFilterProps> = ({
  value,
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Local state for popover editing
  const [activeTab, setActiveTab] = useState<'month' | 'custom'>(value.mode || 'month');
  const { year: parsedYear } = parseYearMonth(value.competenceMonth);
  const [viewYear, setViewYear] = useState<number>(parsedYear);
  const [tempStartDate, setTempStartDate] = useState<string>(value.startDate || '');
  const [tempEndDate, setTempEndDate] = useState<string>(value.endDate || '');
  const [tempDateField, setTempDateField] = useState<'competenceDate' | 'dueDate'>(value.dateField || 'competenceDate');

  const now = new Date();
  const currentIsoMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Sync internal state when popover opens or prop changes
  useEffect(() => {
    setActiveTab(value.mode);
    setTempStartDate(value.startDate);
    setTempEndDate(value.endDate);
    setTempDateField(value.dateField);
    const { year } = parseYearMonth(value.competenceMonth);
    setViewYear(year);
  }, [value, isOpen]);

  // Click outside and ESC key listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Navigate period (arrows on trigger)
  const handleNavigateStep = (direction: -1 | 1) => {
    if (value.mode === 'month') {
      const { year, month } = parseYearMonth(value.competenceMonth);
      const nextDate = new Date(Date.UTC(year, month - 1 + direction, 1));
      const nextMonthStr = nextDate.toISOString().slice(0, 7);
      onChange({
        ...value,
        mode: 'month',
        competenceMonth: nextMonthStr,
        startDate: '',
        endDate: '',
      });
    } else {
      // Custom range: shift range by interval length (in days)
      if (value.startDate && value.endDate) {
        const start = new Date(value.startDate);
        const end = new Date(value.endDate);
        const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        start.setDate(start.getDate() + diffDays * direction);
        end.setDate(end.getDate() + diffDays * direction);
        onChange({
          ...value,
          startDate: toLocalIsoDate(start),
          endDate: toLocalIsoDate(end),
          competenceMonth: '',
        });
      }
    }
  };

  // Reset to current month
  const handleResetToCurrentMonth = () => {
    onChange({
      mode: 'month',
      competenceMonth: currentIsoMonth,
      startDate: '',
      endDate: '',
      dateField: value.dateField,
    });
    setIsOpen(false);
  };

  // Select month in Month Tab
  const handleSelectMonth = (monthNumber: number) => {
    const monthStr = `${viewYear}-${String(monthNumber).padStart(2, '0')}`;
    onChange({
      mode: 'month',
      competenceMonth: monthStr,
      startDate: '',
      endDate: '',
      dateField: tempDateField,
    });
    setIsOpen(false);
  };

  // Apply custom range
  const handleApplyCustomRange = () => {
    if (!tempStartDate && !tempEndDate) {
      // Empty dates -> fallback to current month
      handleResetToCurrentMonth();
      return;
    }

    let start = tempStartDate;
    let end = tempEndDate;
    // If both filled and start > end, swap them
    if (start && end && start > end) {
      const swap = start;
      start = end;
      end = swap;
    }

    onChange({
      mode: 'custom',
      competenceMonth: '',
      startDate: start,
      endDate: end,
      dateField: tempDateField,
    });
    setIsOpen(false);
  };

  // Quick Range Presets
  const applyPreset = (preset: 'today' | 'this_week' | 'this_month' | 'last_month' | 'next_30' | 'last_30' | 'this_year') => {
    const d = new Date();
    let start = '';
    let end = '';

    switch (preset) {
      case 'today': {
        const today = toLocalIsoDate(d);
        start = today;
        end = today;
        break;
      }
      case 'this_week': {
        const dayOfWeek = d.getDay();
        const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(d);
        monday.setDate(d.getDate() + distanceToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        start = toLocalIsoDate(monday);
        end = toLocalIsoDate(sunday);
        break;
      }
      case 'this_month': {
        const first = new Date(d.getFullYear(), d.getMonth(), 1);
        const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        start = toLocalIsoDate(first);
        end = toLocalIsoDate(last);
        break;
      }
      case 'last_month': {
        const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
        const last = new Date(d.getFullYear(), d.getMonth(), 0);
        start = toLocalIsoDate(first);
        end = toLocalIsoDate(last);
        break;
      }
      case 'next_30': {
        start = toLocalIsoDate(d);
        const future = new Date(d);
        future.setDate(d.getDate() + 30);
        end = toLocalIsoDate(future);
        break;
      }
      case 'last_30': {
        const past = new Date(d);
        past.setDate(d.getDate() - 30);
        start = toLocalIsoDate(past);
        end = toLocalIsoDate(d);
        break;
      }
      case 'this_year': {
        start = `${d.getFullYear()}-01-01`;
        end = `${d.getFullYear()}-12-31`;
        break;
      }
    }

    setTempStartDate(start);
    setTempEndDate(end);
    onChange({
      mode: 'custom',
      competenceMonth: '',
      startDate: start,
      endDate: end,
      dateField: tempDateField,
    });
    setIsOpen(false);
  };

  // Formatted trigger label
  const getTriggerLabel = () => {
    if (value.mode === 'month') {
      const { year, month } = parseYearMonth(value.competenceMonth);
      return `${MONTH_NAMES_FULL[month - 1]} de ${year}`;
    }

    if (value.startDate && value.endDate) {
      if (value.startDate === value.endDate) {
        const [y, m, d] = value.startDate.split('-');
        return `${d}/${m}/${y}`;
      }
      const [sy, sm, sd] = value.startDate.split('-');
      const [ey, em, ed] = value.endDate.split('-');
      return `${sd}/${sm}/${sy} até ${ed}/${em}/${ey}`;
    }
    if (value.startDate) {
      const [y, m, d] = value.startDate.split('-');
      return `A partir de ${d}/${m}/${y}`;
    }
    if (value.endDate) {
      const [y, m, d] = value.endDate.split('-');
      return `Até ${d}/${m}/${y}`;
    }
    return 'Todas as datas';
  };

  const isCurrentMonthActive =
    value.mode === 'month' && value.competenceMonth === currentIsoMonth;

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center', className)}>
      {/* Trigger Pill */}
      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xs transition-all hover:border-slate-400 dark:hover:border-slate-700">
        {/* Previous step arrow */}
        <button
          type="button"
          onClick={() => handleNavigateStep(-1)}
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-l-xl transition-colors"
          title={value.mode === 'month' ? 'Mês anterior' : 'Período anterior'}
          aria-label="Período anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Main Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          aria-label="Mês de competência"
          title="Clique para alterar período ou escolher entre datas"
        >
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold tracking-tight">{getTriggerLabel()}</span>

          {/* Badge indicating Base (Competência vs Vencimento) */}
          <span
            className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase',
              value.dateField === 'dueDate'
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
            )}
            title={`Filtrado por Data de ${value.dateField === 'dueDate' ? 'Vencimento' : 'Competência'}`}
          >
            {value.dateField === 'dueDate' ? 'Venc.' : 'Comp.'}
          </span>

          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-slate-400 transition-transform duration-200',
              isOpen && 'rotate-180 text-emerald-600 dark:text-emerald-400'
            )}
          />
        </button>

        {/* Next step arrow */}
        <button
          type="button"
          onClick={() => handleNavigateStep(1)}
          className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={value.mode === 'month' ? 'Próximo mês' : 'Próximo período'}
          aria-label="Próximo período"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Quick Return to Current Month ("Hoje") button */}
        {!isCurrentMonthActive && (
          <button
            type="button"
            onClick={handleResetToCurrentMonth}
            className="border-l border-slate-200 dark:border-slate-800 px-2 py-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-r-xl transition-colors flex items-center gap-1"
            title="Voltar para o mês atual"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Hoje</span>
          </button>
        )}
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('month')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all',
                  activeTab === 'month'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Por Mês</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all',
                  activeTab === 'custom'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                )}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>Entre Datas</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Fechar seletor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Date Base Selection (Competência vs Vencimento) */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">Filtrar por:</span>
            </div>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setTempDateField('competenceDate')}
                className={cn(
                  'px-2.5 py-1 rounded-md font-medium transition-all',
                  tempDateField === 'competenceDate'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                Competência
              </button>
              <button
                type="button"
                onClick={() => setTempDateField('dueDate')}
                className={cn(
                  'px-2.5 py-1 rounded-md font-medium transition-all',
                  tempDateField === 'dueDate'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                Vencimento
              </button>
            </div>
          </div>

          {/* TAB: Por Mês */}
          {activeTab === 'month' && (
            <div className="space-y-3">
              {/* Year Navigation Bar */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setViewYear(viewYear - 1)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Ano anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide">
                  {viewYear}
                </span>
                <button
                  type="button"
                  onClick={() => setViewYear(viewYear + 1)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Próximo ano"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 12-Month Grid */}
              <div className="grid grid-cols-3 gap-2">
                {MONTH_NAMES_SHORT.map((mName, idx) => {
                  const monthNum = idx + 1;
                  const itemYm = `${viewYear}-${String(monthNum).padStart(2, '0')}`;
                  const isSelected = value.mode === 'month' && value.competenceMonth === itemYm;
                  const isCurrent = itemYm === currentIsoMonth;

                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => handleSelectMonth(monthNum)}
                      className={cn(
                        'py-2 px-3 text-xs rounded-xl font-medium transition-all text-center relative border',
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-sm shadow-emerald-500/30'
                          : isCurrent
                          ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50'
                          : 'border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      {mName}
                      {isCurrent && !isSelected && (
                        <span className="absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Entre Datas */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              {/* Presets Rápidos */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Atalhos Rápidos
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Hoje', key: 'today' as const },
                    { label: 'Esta Semana', key: 'this_week' as const },
                    { label: 'Este Mês', key: 'this_month' as const },
                    { label: 'Mês Passado', key: 'last_month' as const },
                    { label: 'Últimos 30d', key: 'last_30' as const },
                    { label: 'Próximos 30d', key: 'next_30' as const },
                    { label: 'Este Ano', key: 'this_year' as const },
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => applyPreset(preset.key)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/50 dark:border-slate-700/50 transition-colors font-medium"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Range Inputs (De / Até) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Data Inicial:
                  </label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Data Final:
                  </label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Botões de Ação do Range */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTempStartDate('');
                    setTempEndDate('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Limpar
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCustomRange}
                    className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aplicar Filtro</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Informativo */}
          <div className="text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
            <span>
              Base ativa: <strong>{value.dateField === 'dueDate' ? 'Vencimento' : 'Competência'}</strong>
            </span>
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Mês Atual
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
