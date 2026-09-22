import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Printer, Lock, Mail, AlertCircle } from 'lucide-react';
import { Role } from '../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response.data;
      login(accessToken, refreshToken, user);

      if (user.role === Role.OPERATOR) {
        navigate('/work-orders');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const message = error.response?.data?.message;
      if (Array.isArray(message)) {
        setErrorMessage(message.join(' '));
      } else if (typeof message === 'string') {
        setErrorMessage(message);
      } else {
        setErrorMessage('Falha ao autenticar. Verifique sua conexão ou credenciais.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (type: 'admin' | 'operador') => {
    if (type === 'admin') {
      setEmail('admin@erpgrafica.com');
      setPassword('admin123');
    } else {
      setEmail('operador@erpgrafica.com');
      setPassword('operador123');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background visual elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 items-center justify-center text-white shadow-lg shadow-emerald-950/60 mb-2">
            <Printer className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">ERP Gráfica Modular</h2>
          <p className="text-xs text-slate-400">
            Acesso ao painel administrativo e controle de chão de fábrica
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-7 rounded-2xl shadow-xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Input
              label="E-mail de acesso"
              type="email"
              required
              placeholder="seu-email@erpgrafica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Senha"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
              Entrar no Sistema
            </Button>
          </form>

          {/* Quick fills for testing */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 font-medium mb-2.5">
              Ambiente de Demonstração / Teste Rápido:
            </p>
            <div className="flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials('admin')}
                className="text-xs"
              >
                Preencher Administrador
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials('operador')}
                className="text-xs"
              >
                Preencher Operador
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
