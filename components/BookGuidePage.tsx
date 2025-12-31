import React, { useState, useEffect } from 'react';
import { City, Guide } from '../types';
import { generateGuides } from '../services/aiService';
import { User, Star, MapPin, ShieldCheck, Loader2, MessageCircle, Calendar } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';
import SkeletonLoader from './SkeletonLoader';

interface BookGuidePageProps {
  city: City;
  showToast: (message: string) => void;
  provider?: 'gemini' | 'openai' | 'grok';
}

export const BookGuidePage: React.FC<BookGuidePageProps> = ({ city, showToast, provider = 'gemini' }) => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      setIsLoading(true);
      setError(null);
      const data = await generateGuides(city.name, provider);
      if (data) {
        setGuides(data);
      } else {
        setError('Could not find available guides at this time. Please try again later.');
      }
      setIsLoading(false);
    };

    fetchGuides();
  }, [city.name, provider]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-16 animate-fade-in">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 gradient-text tracking-tight">
          Local Experts in {city.name}
        </h2>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Connect with top-rated local guides who can show you the hidden gems and authentic culture of {city.name}.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="glass-card rounded-3xl shadow-xl overflow-hidden flex flex-col border border-white/10">
              <SkeletonLoader className="h-80 w-full" />
              <div className="p-8 space-y-4">
                <SkeletonLoader className="h-8 w-3/4 rounded-lg" />
                <div className="flex gap-2">
                  <SkeletonLoader className="h-6 w-20 rounded-full" />
                  <SkeletonLoader className="h-6 w-24 rounded-full" />
                </div>
                <SkeletonLoader className="h-4 w-full rounded" />
                <SkeletonLoader className="h-4 w-full rounded" />
                <SkeletonLoader className="h-12 w-full mt-4 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center p-12 glass-card rounded-3xl max-w-2xl mx-auto border border-red-500/30 bg-red-500/10">
            <h3 className="text-2xl font-bold text-red-200 mb-2">Oops!</h3>
            <p className="text-red-300">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
          {guides.map((guide, index) => (
            <div 
                key={index} 
                className="glass-card rounded-3xl shadow-xl overflow-hidden flex flex-col transform transition-all duration-500 hover:scale-[1.02] hover:shadow-purple-500/20 border border-white/10 group"
                style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="h-80 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                <ImageWithFallback 
                    src={guide.image} 
                    alt={`Portrait of ${guide.name}`} 
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" /> 4.9
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-green-400" /> Verified
                    </div>
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-grow relative">
                <div className="mb-4">
                    <h3 className="text-3xl font-bold text-white mb-2">{guide.name}</h3>
                    <div className="flex flex-wrap gap-2">
                        {guide.specialties.map(spec => (
                        <span key={spec} className="bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            {spec}
                        </span>
                        ))}
                    </div>
                </div>
                
                <p className="text-slate-300 flex-grow mb-8 leading-relaxed border-t border-white/10 pt-4">
                    "{guide.bio}"
                </p>
                
                <div className="mt-auto grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => showToast(`Starting chat with ${guide.name}...`)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
                    >
                        <MessageCircle className="h-5 w-5" /> Chat
                    </button>
                    <button 
                        onClick={() => showToast(`Booking request sent to ${guide.name}!`)}
                        className="w-full gradient-bg text-white font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Calendar className="h-5 w-5" /> Book
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};