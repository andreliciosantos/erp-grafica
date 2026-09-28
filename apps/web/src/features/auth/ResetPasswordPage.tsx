import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Printer, CheckCircle2, AlertTriangle, Lock, KeyRound } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email?: string; name?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setTokenValid(false);
      setErrorMessage('Token de recuperação não fornecido.');
      return;
    }

    const checkToken = async () => {
      try {
        const res = await api.get(`/auth/verify-token?token=${token}&type=reset`);
        if (res.data.valid) {
          setTokenValid(true);
          setUserInfo({ email: res.data.email, name: res.data.name });
        } else {
          setTokenValid(false);
          setErrorMessage(res.data.message || 'Token de recuperação inválido ou expirado.');
        }
      } catch (err: any) {
        setTokenValid(false);
        setErrorMessage(
          err.response?.data?.message || 'Falha ao verificar link de recuperação. Tente novamente mais tarde.'
        );
      } finally {
        setIsVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        password,
      });

      setSuccess(true);
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || 'Não foi possível redefinir sua senha. O link pode ter expirado.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Elementos visuais de fundo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header com logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 items-center justify-center text-white shadow-lg shadow-emerald-950/60 mb-2">
            <Printer className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">ERP Gráfica Modular</h2>
          <p className="text-xs text-slate-400">Recuperação de Acesso e Redefinição de Senha</p>
        </div>

        {/* Card Principal */}
        <div className="bg-slate-900/90 border border-slate-800 p-7 rounded-2xl shadow-xl backdrop-blur-xl">
          {isVerifying ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Validando link de recuperação...</p>
            </div>
          ) : !tokenValid ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-200">Link Inválido ou Expirado</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {errorMessage ||
                    'Este link de redefinição de senha é inválido ou já expirou. Solicite um novo link de recuperação.'}
                </p>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Voltar para a Página de Login
              </Button>
            </div>
          ) : success ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-200">Senha Alterada com Sucesso!</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sua senha foi redefinida com segurança. Você já pode fazer login no sistema.
                </p>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Acessar Minha Conta
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-300 flex items-start gap-2.5">
                <KeyRound className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">
                    Redefinir senha para {userInfo?.email}
                  </p>
                  <p className="text-blue-400 text-[11px] mt-0.5">
                    Digite uma nova senha segura para substituir a anterior.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Input
                label="Nova Senha"
                type="password"
                required
                placeholder="Mínimo 6 caracteres..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="Confirme a Nova Senha"
                type="password"
                required
                placeholder="Repita a mesma senha..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                size="lg"
                isLoading={isSubmitting}
              >
                Salvar Nova Senha
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancelar e voltar para o Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
