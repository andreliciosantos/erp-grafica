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
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { Role } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: Role[];
}

export const Sidebar: React.FC = () => {
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
    <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800/80 flex flex-col h-full">
      {/* Brand / Logo */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
          <PrinterIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-100 tracking-tight">ERP Gráfica</h1>
          <p className="text-[10px] text-emerald-400 font-medium tracking-wide">MODULAR SYSTEM</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Menu Principal
        </p>
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-600/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
          <span>v1.0.0 (Web Admin)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sistema Online" />
        </div>
      </div>
    </aside>
  );
};
