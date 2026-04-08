import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

function isIOSDevice() {
  if (typeof window === 'undefined') return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

const DISMISSED_KEY = 'lh_install_dismissed';

export function InstallPrompt() {
  const [isDismissed, setIsDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
  });
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const { isInstallable, promptInstall } = usePWAInstall();

  const isIOS = isIOSDevice();
  const isStandalone = isInStandaloneMode();

  // Show iOS prompt once per session if not already installed / dismissed
  useEffect(() => {
    if (isIOS && !isStandalone && !isDismissed) {
      const timer = setTimeout(() => setShowIOSInstructions(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isIOS, isStandalone, isDismissed]);

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* ignore */ }
    setIsDismissed(true);
    setShowIOSInstructions(false);
  };

  const handleInstallClick = async () => {
    await promptInstall();
    setIsDismissed(true);
  };

  // Android / desktop install prompt
  if (isInstallable && !isDismissed) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-md sm:justify-center sm:gap-6 animate-in slide-in-from-top-full">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">
            Instalar a app LearningHub no dispositivo?
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="bg-white/20 hover:bg-white/30 h-8 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
            aria-label="Dispensar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS manual install instructions
  if (isIOS && !isStandalone && showIOSInstructions && !isDismissed) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-[100] bg-card text-card-foreground border border-border rounded-xl shadow-xl p-4 animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold">Instalar LearningHub</span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-muted rounded-md transition-colors flex-shrink-0"
            aria-label="Dispensar"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <ol className="text-sm text-muted-foreground space-y-1.5 list-none">
          <li className="flex items-center gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</span>
            <span>Toca em <Share className="inline h-4 w-4 text-primary mx-0.5" /> <strong>Partilhar</strong> no Safari</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">2</span>
            <span>Seleciona <strong>"Adicionar ao ecrã principal"</strong></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">3</span>
            <span>Toca em <strong>Adicionar</strong></span>
          </li>
        </ol>
      </div>
    );
  }

  return null;
}
