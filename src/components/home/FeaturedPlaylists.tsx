import { Sparkles, Music, Heart, Zap, Coffee, Sunrise, Moon, Headphones } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FeaturedPlaylistsProps {
  onPlaylistClick: (query: string) => void;
}

const playlists = [
  {
    id: 'top-hits',
    name: 'Top Hits',
    icon: Zap,
    gradient: 'from-yellow-500/20 to-orange-500/20',
    iconColor: 'text-yellow-400',
    query: 'top hits music',
    description: 'The biggest songs right now'
  },
  {
    id: 'chill-vibes',
    name: 'Chill Vibes',
    icon: Coffee,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
    query: 'chill vibes relaxing',
    description: 'Relax and unwind'
  },
  {
    id: 'workout',
    name: 'Workout',
    icon: Zap,
    gradient: 'from-red-500/20 to-pink-500/20',
    iconColor: 'text-red-400',
    query: 'workout motivation',
    description: 'Get pumped for your workout'
  },
  {
    id: 'focus',
    name: 'Focus',
    icon: Headphones,
    gradient: 'from-purple-500/20 to-indigo-500/20',
    iconColor: 'text-purple-400',
    query: 'focus study concentration',
    description: 'Music for deep work'
  },
  {
    id: 'morning',
    name: 'Morning',
    icon: Sunrise,
    gradient: 'from-orange-500/20 to-yellow-500/20',
    iconColor: 'text-orange-400',
    query: 'morning energy wake up',
    description: 'Start your day right'
  },
  {
    id: 'evening',
    name: 'Evening',
    icon: Moon,
    gradient: 'from-indigo-500/20 to-purple-500/20',
    iconColor: 'text-indigo-400',
    query: 'evening calm peaceful',
    description: 'Wind down your day'
  },
  {
    id: 'love-songs',
    name: 'Love Songs',
    icon: Heart,
    gradient: 'from-pink-500/20 to-rose-500/20',
    iconColor: 'text-pink-400',
    query: 'love romantic songs',
    description: 'Songs that touch the heart'
  },
  {
    id: 'party',
    name: 'Party',
    icon: Music,
    gradient: 'from-green-500/20 to-teal-500/20',
    iconColor: 'text-green-400',
    query: 'party dance celebration',
    description: 'Get the party started'
  },
];

export const FeaturedPlaylists = ({ onPlaylistClick }: FeaturedPlaylistsProps) => {
  return (
    <section className="mb-12 animate-fade-in">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        <h2 className="text-xl md:text-2xl font-bold">Featured Playlists</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {playlists.map((playlist) => {
          const Icon = playlist.icon;
          return (
            <Card
              key={playlist.id}
              className="group relative overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer hover-scale p-4 md:p-6 bg-card/30 backdrop-blur-sm border-border/50"
              onClick={() => onPlaylistClick(playlist.query)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${playlist.gradient} opacity-50`} />
              
              <div className="relative">
                <div className="mb-3 md:mb-4">
                  <Icon className={`h-10 w-10 md:h-12 md:w-12 ${playlist.iconColor}`} />
                </div>
                
                <h3 className="font-bold text-base md:text-lg mb-1">
                  {playlist.name}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                  {playlist.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
