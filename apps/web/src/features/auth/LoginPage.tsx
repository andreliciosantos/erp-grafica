import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Printer, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Role } from '../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados para o fluxo "Esqueci minha senha"
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email || '');
                  setForgotFeedback(null);
                  setIsForgotModalOpen(true);
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
              Entrar no Sistema
            </Button>
          </form>

        </div>
      </div>

      {/* Modal Esqueci Minha Senha */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Recuperação de Acesso"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Informe o e-mail cadastrado na sua conta. Se o endereço existir no sistema, enviaremos um link seguro para você cadastrar uma nova senha.
          </p>

          {forgotFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                forgotFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {forgotFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              )}
              <p className="leading-snug">{forgotFeedback.message}</p>
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsForgotLoading(true);
              setForgotFeedback(null);
              try {
                const res = await api.post('/auth/forgot-password', { email: forgotEmail });
                setForgotFeedback({
                  type: 'success',
                  message: res.data.message || 'Instruções enviadas para o seu e-mail!',
                });
              } catch (err: any) {
                setForgotFeedback({
                  type: 'error',
                  message: err.response?.data?.message || 'Falha ao solicitar recuperação de senha.',
                });
              } finally {
                setIsForgotLoading(false);
              }
            }}
            className="space-y-4"
          >
            <Input
              label="E-mail Cadastrado"
              type="email"
              required
              placeholder="seu-email@erpgrafica.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Fechar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isForgotLoading}
              >
                Enviar Link de Recuperação
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
