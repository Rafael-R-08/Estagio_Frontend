import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export function InstallPrompt() {
  const [isDismissed, setIsDismissed] = useState(false);
  const { isInstallable, promptInstall } = usePWAInstall();

  // If the user dismissed it this session, or it's not installable, don't show it
  if (!isInstallable || isDismissed) return null;

  const handleInstallClick = async () => {
    await promptInstall();
    setIsDismissed(true);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-md sm:justify-center sm:gap-6 animate-in slide-in-from-top-full">
      <div className="flex items-center gap-3">
        <Download className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium">
          Deseja instalar a App da LearningHub?
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstallClick}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-8 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors"
        >
          Instalar
        </button>
        <button 
          onClick={handleDismiss}
          className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
