import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Music2, Play, Shield, Users, Zap, Loader2 } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/app');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
        </div>

        <div className="relative z-10 px-3 md:px-4 py-16 md:py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6 md:mb-8">
              <div className="bg-gradient-primary p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.5)]">
                <Music2 className="h-12 w-12 md:h-16 md:w-16 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-4 md:mb-6 px-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Open-Source
              </span>
              <br />
              Music Streaming
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto px-4">
              Free, ad-free, and privacy-focused. Stream millions of tracks from legal sources.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12 px-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 text-base md:text-lg px-6 md:px-8 shadow-[0_0_30px_rgba(139,92,246,0.4)]"
                onClick={() => navigate('/auth')}
              >
                <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                Start Listening
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base md:text-lg px-6 md:px-8 border-border/50 bg-card/50 backdrop-blur-sm"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            </div>

            <p className="text-xs md:text-sm text-muted-foreground px-4">
              No credit card required • Free forever • Open source
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-background to-card/30">
        <div className="px-3 md:px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-16 px-4">
            Why Choose OpenBeats?
          </h2>

          <div className="grid md:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-primary/50 transition-colors">
              <div className="bg-gradient-primary p-2.5 md:p-3 rounded-lg md:rounded-xl w-fit mb-3 md:mb-4">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">100% Free & Legal</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                All music from legal sources: Jamendo, Free Music Archive, Audius, and more. No ads, ever.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-primary/50 transition-colors">
              <div className="bg-gradient-accent p-2.5 md:p-3 rounded-lg md:rounded-xl w-fit mb-3 md:mb-4">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Privacy First</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Your data stays yours. No tracking, no selling data. Fully transparent and open source.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl md:rounded-2xl p-4 md:p-6 hover:border-primary/50 transition-colors">
              <div className="bg-gradient-primary p-2.5 md:p-3 rounded-lg md:rounded-xl w-fit mb-3 md:mb-4">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Community Driven</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Built by the community, for the community. Contribute on GitHub and help shape the future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
        </div>
        
        <div className="px-3 md:px-4 text-center relative z-10">
          <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-primary-foreground mb-4 md:mb-6 px-4">
            Ready to Experience Free Music?
          </h2>
          <p className="text-base md:text-xl text-primary-foreground/90 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of music lovers enjoying premium features without the premium price.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-base md:text-lg px-6 md:px-8"
            onClick={() => navigate('/auth')}
          >
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
