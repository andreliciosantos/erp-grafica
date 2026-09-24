import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, CheckCircle2, Smartphone, Share, X } from 'lucide-react';

interface PwaInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({
  className = '',
  variant = 'full',
}) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (isInstallable) {
      await promptInstall();
    } else if (isIOS) {
      setShowIosGuide(true);
    } else {
      // Fallback em navegadores desktop Chrome/Edge ou outros
      alert(
        'Para instalar o ERP Gráfica no seu dispositivo, clique no ícone de instalação (+) na barra de endereços do seu navegador ou no menu de opções (três pontos) > "Instalar Aplicativo".'
      );
    }
  };

  if (isInstalled) {
    if (variant === 'compact') {
      return (
        <div
          title="Aplicativo PWA Instalado no dispositivo"
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
        >
          <CheckCircle2 className="w-4 h-4" />
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold ${className}`}>
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>App Instalado</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Instalar ERP Gráfica como Aplicativo Mobile / Balcão"
        className={`group flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 border ${
          isInstallable
            ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white border-emerald-500 shadow-sm shadow-emerald-950/20'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700/80'
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          {isInstallable ? (
            <Download className="w-4 h-4 animate-bounce" />
          ) : (
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>Instalar App</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/10">
          PWA
        </span>
      </button>

      {/* Modal Guia de Instalação para iOS / iPadOS */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span>Instalar no iPhone / iPad</span>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No Safari da Apple, você pode instalar o ERP Gráfica na tela de início em 2 passos rápidos:
            </p>

            <ol className="text-xs space-y-2.5 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold shrink-0 text-[11px]">
                  1
                </span>
                <span>
                  Toque no botão <strong>Compartilhar</strong> (ícone <Share className="w-3.5 h-3.5 inline mx-0.5" /> na barra do Safari).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold shrink-0 text-[11px]">
                  2
                </span>
                <span>
                  Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
