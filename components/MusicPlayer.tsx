import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2 } from 'lucide-react';

interface MusicPlayerProps {
  onPlayStateChange?: (isPlaying: boolean) => void;
  currentTrackName?: string | null; // Allow parent (AI) to set track
  isPlayingExternal?: boolean; // Allow parent (AI) to control play state
}

const MOCK_PLAYLIST = [
  { title: "Road Trip Vibes", artist: "Unknown Artist" },
  { title: "Highway to Hell", artist: "AC/DC" },
  { title: "Born to be Wild", artist: "Steppenwolf" },
  { title: "Life is a Highway", artist: "Rascal Flatts" },
  { title: "Lo-Fi Beats", artist: "Chillhop" },
];

const MusicPlayer: React.FC<MusicPlayerProps> = ({ onPlayStateChange, currentTrackName, isPlayingExternal }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(50);

  // Sync with external control (AI)
  useEffect(() => {
    if (isPlayingExternal !== undefined && isPlayingExternal !== isPlaying) {
        setIsPlaying(isPlayingExternal);
    }
  }, [isPlayingExternal]);

  useEffect(() => {
    // Only notify parent if the local state change wasn't caused by the parent itself
    // We can do this by checking if the parent's state matches local state before calling back
    if (onPlayStateChange && isPlaying !== isPlayingExternal) {
        onPlayStateChange(isPlaying);
    }
  }, [isPlaying, onPlayStateChange, isPlayingExternal]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % MOCK_PLAYLIST.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + MOCK_PLAYLIST.length) % MOCK_PLAYLIST.length);
  };

  const currentTrack = MOCK_PLAYLIST[currentTrackIndex];

  return (
    <div className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/10 shadow-lg animate-fade-in relative overflow-hidden">
        {/* Animated Background Equalizer Simulation */}
        {isPlaying && (
             <div className="absolute inset-0 opacity-10 flex items-end justify-center gap-1 pointer-events-none">
                 {[...Array(20)].map((_, i) => (
                     <div 
                        key={i} 
                        className="w-2 bg-purple-500 animate-pulse" 
                        style={{ 
                            height: `${Math.random() * 100}%`,
                            animationDuration: `${0.5 + Math.random()}s`
                        }} 
                    />
                 ))}
             </div>
        )}

      <div className="flex items-center gap-4 z-10">
        <div className={`p-3 rounded-full ${isPlaying ? 'bg-green-500/20 text-green-400 animate-spin-slow' : 'bg-slate-700 text-slate-400'}`}>
            <Music className="h-6 w-6" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">{currentTrackName || currentTrack.title}</h4>
          <p className="text-xs text-slate-400">{currentTrackName ? 'AI Selection' : currentTrack.artist}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 z-10">
        <button onClick={prevTrack} className="text-slate-400 hover:text-white transition-colors">
            <SkipBack className="h-5 w-5" />
        </button>
        <button 
            onClick={togglePlay} 
            className={`p-3 rounded-full transition-all hover:scale-110 shadow-lg ${isPlaying ? 'bg-purple-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
        >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 pl-0.5" />}
        </button>
        <button onClick={nextTrack} className="text-slate-400 hover:text-white transition-colors">
            <SkipForward className="h-5 w-5" />
        </button>
      </div>
      
       <div className="flex items-center gap-2 ml-4 hidden md:flex z-10">
            <Volume2 className="h-4 w-4 text-slate-400" />
            <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400" style={{ width: `${volume}%` }}></div>
            </div>
       </div>

    </div>
  );
};

export default MusicPlayer;
