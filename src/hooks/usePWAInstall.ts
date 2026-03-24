import { useState, useEffect, useCallback } from 'react';

// Store the event globally so it survives component unmounts
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(() => !!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(() => 
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      try {
        e.preventDefault();
      } catch {
        // Some browsers may throw if event is not cancelable; still continue
      }
      // Stash the event so it can be triggered later.
      deferredPrompt = e as BeforeInstallPromptEvent;
      console.debug('[PWA] beforeinstallprompt received, deferredPrompt saved')
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      // Hide the app-provided install promotion
      setIsInstallable(false);
      setIsInstalled(true);
      // Clear the deferredPrompt so it can be garbage collected
      deferredPrompt = null;
      console.debug('[PWA] appinstalled event fired')
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.debug('[PWA] promptInstall called but deferredPrompt is null')
      return false;
    }

    // Show the install prompt
    console.debug('[PWA] prompting install')
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt = null;
    setIsInstallable(false);

    console.debug('[PWA] userChoice outcome:', outcome)
    return outcome === 'accepted';
  }, []);

  return {
    isInstallable,
    isInstalled,
    promptInstall
  };
}
