import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../lib/socket';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ThemeToggle } from '../common/ThemeToggle';
import { LogOut, Wifi, WifiOff, Menu } from 'lucide-react';

export interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuthStore();
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setWsConnected(true);
    const onDisconnect = () => setWsConnected(false);

    if (socket.connected) {
      setWsConnected(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-10 transition-colors">
      {/* Left side: Hamburger button (mobile) & real-time badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            data-testid="mobile-menu-btn"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-xs font-medium">
          {wsConnected ? (
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-500/20 text-[11px] sm:text-xs">
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chão de Fábrica Conectado (Real-Time)</span>
              <span className="sm:hidden">Conectado</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-[11px] sm:text-xs border border-slate-200/80 dark:border-slate-700/60">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reconectando WebSocket...</span>
              <span className="sm:hidden">Offline</span>
            </span>
          )}
        </div>
      </div>

      {/* Right User & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px] sm:max-w-none">
            {user?.name || 'Usuário'}
          </p>
          <Badge variant="primary" size="sm" className="mt-0.5">
            {user?.role || 'OPERATOR'}
          </Badge>
        </div>

        {/* Theme quick toggle */}
        <ThemeToggle variant="compact" />

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/30"
          title="Sair do sistema"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
};
