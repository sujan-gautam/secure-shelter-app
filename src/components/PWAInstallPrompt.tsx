import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      setShowPrompt(false);
    }
  }, []);

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <Card className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 p-4 bg-card/95 backdrop-blur-lg border-border/50 shadow-glow-accent z-40 animate-fade-in">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-start gap-3">
        <div className="bg-gradient-primary p-2 rounded-lg shrink-0">
          <Download className="h-5 w-5 text-primary-foreground" />
        </div>
        
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-sm">Install OpenBeats</h3>
          <p className="text-xs text-muted-foreground">
            Install our app for quick access and background music playback
          </p>
          
          <Button 
            onClick={handleInstall}
            className="w-full bg-gradient-primary hover:opacity-90"
            size="sm"
          >
            Install App
          </Button>
        </div>
      </div>
    </Card>
  );
};
