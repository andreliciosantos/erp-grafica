import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return 'R$ 0,00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getStatusConfig(status: string) {
  switch (status) {
    case 'PENDING':
      return { label: 'Aguardando', variant: 'warning' as const, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'PRE_PRESS':
      return { label: 'Pré-Impressão (CTP)', variant: 'info' as const, bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    case 'PRINTING':
      return { label: 'Em Impressão', variant: 'primary' as const, bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
    case 'FINISHING':
      return { label: 'Acabamento', variant: 'purple' as const, bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    case 'QUALITY_CONTROL':
      return { label: 'Controle de Qualidade', variant: 'cyan' as const, bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    case 'READY_FOR_PICKUP':
      return { label: 'Pronto p/ Retirada', variant: 'success' as const, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'DISPATCHED':
      return { label: 'Despachado', variant: 'blue' as const, bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
    case 'DELIVERED':
      return { label: 'Entregue', variant: 'success' as const, bg: 'bg-green-500/10 text-green-400 border-green-500/20' };
    case 'CANCELLED':
      return { label: 'Cancelado', variant: 'danger' as const, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    case 'DRAFT':
      return { label: 'Rascunho', variant: 'neutral' as const, bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    case 'APPROVED':
      return { label: 'Aprovado', variant: 'success' as const, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    case 'REJECTED':
      return { label: 'Rejeitado', variant: 'danger' as const, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    case 'IN_PROGRESS':
      return { label: 'Em Andamento', variant: 'info' as const, bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
    case 'PAUSED':
      return { label: 'Pausado', variant: 'warning' as const, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    case 'COMPLETED':
      return { label: 'Concluído', variant: 'success' as const, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    default:
      return { label: status, variant: 'neutral' as const, bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  }
}

export function getPriorityConfig(priority: number) {
  switch (priority) {
    case 4:
      return { label: 'Urgente', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    case 3:
      return { label: 'Alta', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    case 2:
      return { label: 'Normal', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    default:
      return { label: 'Baixa', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
  }
}

export function getExpenseCategoryConfig(category: string) {
  switch (category) {
    case 'RENT_FACILITIES':
      return { label: 'Aluguel & Estrutura', variant: 'primary' as const, bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20' };
    case 'UTILITIES':
      return { label: 'Utilidades & Energia', variant: 'warning' as const, bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' };
    case 'SOFTWARE_LICENSES':
      return { label: 'Softwares & Licenças', variant: 'cyan' as const, bg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20' };
    case 'OFFICE_ADMINISTRATIVE':
      return { label: 'Administrativo & Contábil', variant: 'purple' as const, bg: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' };
    case 'COMMERCIAL_MARKETING':
      return { label: 'Comercial & Marketing', variant: 'danger' as const, bg: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20' };
    case 'MAINTENANCE_PREDIAL':
      return { label: 'Manutenção Predial', variant: 'warning' as const, bg: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' };
    case 'FINANCIAL_TAXES':
      return { label: 'Tributos & Taxas', variant: 'success' as const, bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' };
    default:
      return { label: 'Outras Despesas', variant: 'neutral' as const, bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20' };
  }
}

export function getPaymentStatusConfig(status: string) {
  switch (status) {
    case 'PAID':
      return { label: 'Pago', variant: 'success' as const, bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' };
    case 'PENDING':
      return { label: 'Pendente', variant: 'warning' as const, bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' };
    case 'OVERDUE':
      return { label: 'Vencido', variant: 'danger' as const, bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' };
    case 'CANCELLED':
      return { label: 'Cancelado', variant: 'neutral' as const, bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20' };
    default:
      return { label: status, variant: 'neutral' as const, bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20' };
  }
}

export * from './formatters';
