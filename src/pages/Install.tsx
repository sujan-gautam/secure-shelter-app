import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Smartphone, Music2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 bg-card/80 backdrop-blur-lg border-border/50">
        <div className="text-center space-y-6">
          <div className="bg-gradient-primary p-4 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center">
            <Music2 className="h-10 w-10 text-primary-foreground" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Install OpenBeats</h1>
            <p className="text-muted-foreground">
              Get the full app experience with offline support and background playback
            </p>
          </div>

          {isInstalled ? (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-center gap-2 text-primary">
                <CheckCircle className="h-6 w-6" />
                <span className="font-semibold">App is installed!</span>
              </div>
              <Button onClick={() => navigate('/app')} className="w-full">
                Open OpenBeats
              </Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-4 text-left">
                <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
                  <Music2 className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">Background Playback</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep music playing even when the app is closed
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
                  <Smartphone className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">Home Screen Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Launch directly from your home screen
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
                  <Download className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold">Offline Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Cache your favorite tracks for offline listening
                  </p>
                </div>
              </div>

              {deferredPrompt ? (
                <Button 
                  onClick={handleInstall}
                  size="lg"
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Install Now
                </Button>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold">Manual Installation</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>On iPhone/iPad:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Tap the Share button in Safari</li>
                        <li>Scroll down and tap "Add to Home Screen"</li>
                        <li>Tap "Add" to install</li>
                      </ol>
                      
                      <p className="pt-2"><strong>On Android:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Tap the menu (⋮) in Chrome</li>
                        <li>Tap "Install app" or "Add to Home screen"</li>
                        <li>Tap "Install" to confirm</li>
                      </ol>
                    </div>
                  </div>

                  <Button onClick={() => navigate('/app')} variant="outline" className="w-full">
                    Continue in Browser
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Install;
