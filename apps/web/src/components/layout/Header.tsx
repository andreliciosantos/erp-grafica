import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../lib/socket';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { LogOut, Wifi, WifiOff } from 'lucide-react';

export const Header: React.FC = () => {
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
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between z-10">
      {/* Left info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          {wsConnected ? (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Wifi className="w-3 h-3" />
              Chão de Fábrica Conectado (Real-Time)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              <WifiOff className="w-3 h-3" />
              Reconectando WebSocket...
            </span>
          )}
        </div>
      </div>

      {/* Right User & Logout */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-100">{user?.name || 'Usuário'}</p>
          <Badge variant="primary" size="sm" className="mt-0.5">
            {user?.role || 'OPERATOR'}
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="text-slate-400 hover:text-rose-400 hover:border-rose-500/30"
          title="Sair do sistema"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
};
