import React, { useState, useEffect } from 'react';
import { City, TouristSpot } from '../types';
import ImageWithFallback from './ImageWithFallback';
import { Check, ArrowRight, Wind } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

interface SpotsPageProps {
  city: City | null;
  onBack: () => void;
  onContinue: (selectedSpots: TouristSpot[]) => void;
}

const SpotsPage: React.FC<SpotsPageProps> = ({ city, onBack, onContinue }) => {
  const [selectedSpots, setSelectedSpots] = useState<TouristSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for effect
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const toggleSpot = (spot: TouristSpot) => {
    if (selectedSpots.some(s => s.id === spot.id)) {
      setSelectedSpots(selectedSpots.filter(s => s.id !== spot.id));
    } else {
      setSelectedSpots([...selectedSpots, spot]);
    }
  };

  const handleContinue = () => {
    onContinue(selectedSpots);
  };

  if (!city) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-12 animate-fade-in">
        <h2 className="text-4xl md:text-6xl font-bold mb-4 gradient-text tracking-tight">
          Explore {city.name}
        </h2>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Select the places you'd like to visit to build your perfect itinerary.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
             <SkeletonLoader key={i} className="h-96 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
          {city.spots.map((spot, index) => {
            const isSelected = selectedSpots.some((s) => s.id === spot.id);
            return (
              <div
                key={spot.id}
                onClick={() => toggleSpot(spot)}
                className={`group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 border border-white/10 ${
                  isSelected 
                    ? 'ring-4 ring-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)] transform scale-[1.02]' 
                    : 'hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10"></div>
                
                <ImageWithFallback 
                    src={spot.image} 
                    alt={spot.name} 
                    className="w-full h-96 object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                
                {spot.aqi && (
                    <div className="absolute top-4 left-4 z-20">
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2 text-xs font-bold text-white shadow-lg">
                            <Wind className="h-3 w-3 text-green-400" />
                            {spot.aqi}
                        </div>
                    </div>
                )}

                <div className="absolute top-4 right-4 z-20">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isSelected ? 'bg-purple-500 text-white scale-110' : 'bg-black/40 text-white/50 border border-white/20 group-hover:bg-purple-500/50 group-hover:text-white'
                    }`}>
                        <Check className={`h-5 w-5 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 transform transition-transform duration-300 translate-y-2 group-hover:translate-y-0">
                  <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{spot.name}</h3>
                  <p className="text-slate-300 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    {spot.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleContinue}
          disabled={selectedSpots.length === 0}
          className={`gradient-bg text-white font-bold py-4 px-8 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 transform ${
            selectedSpots.length > 0 
                ? 'translate-y-0 opacity-100 hover:scale-105 hover:shadow-purple-500/50' 
                : 'translate-y-20 opacity-0'
          }`}
        >
          Generate Itinerary ({selectedSpots.length}) <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default SpotsPage;