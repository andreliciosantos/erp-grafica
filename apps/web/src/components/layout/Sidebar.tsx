import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  KanbanSquare,
  Package,
  Users,
  Printer,
  ShieldCheck,
  PrinterIcon,
  UserCheck,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { ThemeToggle } from '../common/ThemeToggle';
import { Role } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: Role[];
}

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user } = useAuthStore();

  const navItems: NavItem[] = [
    {
      to: '/',
      label: 'Visão Geral',
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: [Role.ADMIN, Role.COMMERCIAL, Role.FINANCIAL],
    },
    {
      to: '/quotes',
      label: 'Orçamentos',
      icon: <Calculator className="w-4 h-4" />,
      roles: [Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR],
    },
    {
      to: '/work-orders',
      label: 'Chão de Fábrica (PCP)',
      icon: <KanbanSquare className="w-4 h-4" />,
      // All roles have access to work-orders
    },
    {
      to: '/raw-materials',
      label: 'Insumos & Papéis',
      icon: <Package className="w-4 h-4" />,
      roles: [Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR],
    },
    {
      to: '/parties',
      label: 'Clientes & Fornec.',
      icon: <Users className="w-4 h-4" />,
      roles: [Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR],
    },
    {
      to: '/employees',
      label: 'Equipe & RH',
      icon: <UserCheck className="w-4 h-4" />,
      roles: [Role.ADMIN, Role.COMMERCIAL, Role.OPERATOR],
    },
    {
      to: '/machines',
      label: 'Máquinas Gráficas',
      icon: <Printer className="w-4 h-4" />,
      roles: [Role.ADMIN],
    },
    {
      to: '/users',
      label: 'Usuários & Acesso',
      icon: <ShieldCheck className="w-4 h-4" />,
      roles: [Role.ADMIN],
    },
  ];

  const filteredItems = navItems.filter((item) => {
    if (!item.roles || !user) return true;
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          data-testid="sidebar-backdrop"
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        data-testid="sidebar-aside"
        className={cn(
          'w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col h-full z-50 transition-transform duration-200 ease-in-out',
          'fixed inset-y-0 left-0 md:static md:translate-x-0',
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/20">
              <PrinterIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-850 dark:text-slate-100 tracking-tight">ERP Gráfica</h1>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium tracking-wide">MODULAR SYSTEM</p>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Fechar menu de navegação"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Menu Principal
          </p>
          {filteredItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-600/15 dark:text-emerald-300 dark:border-emerald-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Theme Toggle & Footer Info */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <ThemeToggle />

          {/* Footer status */}
          <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-200/80 dark:border-slate-850 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>v1.0.0 (ERP Gráfica)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sistema Online" />
          </div>
        </div>
      </aside>
    </>
  );
};
