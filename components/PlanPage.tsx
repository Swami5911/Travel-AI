import React, { useState, useEffect } from 'react';
import { City, TouristSpot, Itinerary } from '../types';
import { generateItinerary, AIProvider } from '../services/aiService';
import LoadingIndicator from './LoadingSpinner';
import { Calendar, MapPin, Clock, Share2, ArrowRight, Loader2, BookOpen, CheckCircle, Copy, Printer } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

interface PlanPageProps {
  city: City;
  selectedSpots: TouristSpot[];
  itinerary: Itinerary | null;
  onPlanGenerated: (itinerary: Itinerary) => void;
  onNavigateToTracker: () => void;
  onNavigateToBookGuide: () => void;
  isSharedView: boolean;
  provider?: 'gemini' | 'openai' | 'grok';
}

const PlanPage: React.FC<PlanPageProps> = ({ city, selectedSpots, itinerary, onPlanGenerated, onNavigateToTracker, onNavigateToBookGuide, isSharedView, provider = 'gemini' }) => {
  const [days, setDays] = useState(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([1]));
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy Link');

  const toggleDay = (day: number) => {
    const newOpenDays = new Set(openDays);
    if (newOpenDays.has(day)) {
      newOpenDays.delete(day);
    } else {
      newOpenDays.add(day);
    }
    setOpenDays(newOpenDays);
  };

  const handleShare = () => {
    setCopyButtonText('Copy Link');
    setIsShareModalOpen(true);
  };

  const generateShareLink = () => {
    if (!itinerary) return '';
    const planJson = JSON.stringify(itinerary);
    // Unicode-safe base64 encoding
    const encodedPlan = btoa(
        encodeURIComponent(planJson).replace(/%([0-9A-F]{2})/g, (match, p1) =>
            String.fromCharCode(Number(`0x${p1}`))
        )
    );
    return `${window.location.origin}${window.location.pathname}?plan=${encodeURIComponent(encodedPlan)}`;
  };

  const handleCopyLink = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy Link'), 2000);
    });
  };

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setError(null);
    const result = await generateItinerary(city.name, days, selectedSpots, startDate, provider);
    setIsLoading(false);
    if (result) {
      onPlanGenerated(result);
    } else {
      setError("Sorry, I couldn't create a plan right now. The AI might be busy. Please try again later.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-12 glass-card rounded-2xl shadow-2xl max-w-2xl mx-auto animate-fade-in border border-white/10">
            <div className="inline-block p-4 rounded-full bg-purple-500/20 mb-6 animate-pulse">
                <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Crafting your perfect journey...</h2>
            <p className="text-slate-300 text-lg">Our AI is exploring the best routes, finding hidden gems, and scheduling your adventure in {city.name}.</p>
        </div>
      </div>
    );
  }

  if (itinerary) {
    const shareLink = generateShareLink();
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="printable-container">
          <div className="printable-area animate-fade-in">
            <div className="text-center mb-12">
                <h2 className="text-5xl font-bold mb-4 gradient-text tracking-tight">{itinerary.tripTitle}</h2>
                <div className="flex items-center justify-center gap-6 text-slate-300">
                    <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-white/5">
                        <Calendar className="h-5 w-5 text-purple-400" />
                        <span>{itinerary.dailyPlans.length} Days</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-white/5">
                        <MapPin className="h-5 w-5 text-purple-400" />
                        <span>{city.name}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
              {itinerary.dailyPlans.map((plan, index) => {
                const isOpen = openDays.has(plan.day);
                return(
                <div key={plan.day} className="flex flex-col md:flex-row items-start gap-6 group" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="hidden md:flex flex-col items-center gap-2 sticky top-24">
                      <div className="flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg shadow-lg shadow-purple-500/20 z-10">
                        <div className="text-center text-white">
                          <div className="text-xs font-medium uppercase tracking-wider opacity-80">Day</div>
                          <div className="text-2xl font-bold">{plan.day}</div>
                        </div>
                      </div>
                      <div className="w-0.5 h-full bg-gradient-to-b from-purple-500/50 to-transparent min-h-[100px] rounded-full"></div>
                  </div>

                  <div className="glass-card p-0 rounded-2xl shadow-xl w-full border border-white/10 overflow-hidden transition-all duration-300 hover:border-purple-500/30">
                    <button 
                        onClick={() => toggleDay(plan.day)} 
                        className="flex justify-between items-center w-full text-left p-6 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                          <div className="md:hidden flex items-center justify-center w-12 h-12 rounded-xl gradient-bg shadow-lg text-white shrink-0">
                              <span className="font-bold text-lg">{plan.day}</span>
                          </div>
                          <h3 className="text-2xl font-bold text-white">{plan.title}</h3>
                      </div>
                      <div className={`p-2 rounded-full bg-white/5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                          <ArrowRight className="h-5 w-5 text-slate-400" style={{ transform: 'rotate(90deg)' }} />
                      </div>
                    </button>
                    
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="p-6 pt-0">
                          <div className="space-y-6 border-t border-white/10 pt-6">
                            {plan.activities.map((activity, idx) => (
                              <div key={idx} className="flex gap-6 relative pl-4">
                                <div className="absolute left-0 top-2 bottom-0 w-0.5 bg-slate-700 rounded-full"></div>
                                <div className="absolute left-[-5px] top-2 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-slate-900"></div>
                                
                                <div className="w-24 shrink-0 pt-0.5">
                                    <span className="text-purple-400 font-bold font-mono">{activity.time}</span>
                                </div>
                                <div className="pb-6">
                                  <h4 className="font-bold text-lg text-white mb-1">{activity.location}</h4>
                                  <p className="text-slate-400 leading-relaxed">{activity.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {plan.specialEvent && (
                            <div className="mt-4 p-6 rounded-xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/20 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10">
                                  <Calendar className="h-24 w-24" />
                              </div>
                              <div className="relative z-10">
                                <h4 className="font-bold text-lg text-purple-300 mb-2 flex items-center gap-2">
                                    <span className="text-xl">✨</span> Special Evening Event
                                </h4>
                                <p className="font-bold text-white text-xl mb-1">{plan.specialEvent.name} at {plan.specialEvent.location}</p>
                                <p className="text-slate-300">{plan.specialEvent.details}</p>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
        
        {!isSharedView && (
            <div className="no-print mt-16 text-center space-y-8 animate-fade-in">
                <h3 className="text-3xl font-bold text-white">Ready for your trip?</h3>
                <div className="flex justify-center flex-wrap gap-4">
                    <button onClick={handleShare} className="glass-card px-8 py-4 rounded-xl hover:bg-white/10 transition-all flex items-center gap-3 text-white font-bold border border-white/10 hover:scale-105">
                        <Share2 className="h-5 w-5" /> Share Plan
                    </button>
                    <button onClick={() => window.print()} className="glass-card px-8 py-4 rounded-xl hover:bg-white/10 transition-all flex items-center gap-3 text-white font-bold border border-white/10 hover:scale-105">
                        <Printer className="h-5 w-5" /> Print PDF
                    </button>
                    <button onClick={onNavigateToBookGuide} className="bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all flex items-center gap-3 shadow-lg hover:scale-105 hover:shadow-orange-500/20">
                        <BookOpen className="h-5 w-5" /> Book Guide
                    </button>
                    <button onClick={onNavigateToTracker} className="gradient-bg text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all flex items-center gap-3 shadow-lg hover:scale-105 hover:shadow-purple-500/20">
                        <CheckCircle className="h-5 w-5" /> Start Tracking
                    </button>
                </div>
            </div>
        )}
        
        {isShareModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsShareModalOpen(false)}>
                <div className="glass-card rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-white/10 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                    <h3 className="text-2xl font-bold text-white mb-2">Share Your Itinerary</h3>
                    <p className="text-slate-400 mb-6">Anyone with this link will be able to view a read-only version of your plan.</p>
                    <div className="relative">
                        <input type="text" readOnly value={shareLink} className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-4 pr-32 text-slate-300 focus:outline-none focus:border-purple-500 transition-colors" />
                        <button onClick={handleCopyLink} className="absolute right-2 top-1/2 -translate-y-1/2 gradient-bg text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2 hover:opacity-90 transition shadow-lg">
                            <Copy className="h-4 w-4"/>
                            {copyButtonText}
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center glass-card p-12 rounded-3xl shadow-2xl border border-white/10 animate-fade-in relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">Final Step!</h2>
        <p className="text-xl text-slate-300 mb-10">Configure your adventure in <span className="text-purple-400 font-semibold">{city.name}</span>.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-12 mb-12">
            <div className="text-center">
                <label className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Trip Duration</label>
                <div className="flex items-center justify-center space-x-4 bg-slate-800/50 p-2 rounded-2xl border border-white/5">
                    <button onClick={() => setDays(d => Math.max(1, d - 1))} className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl transition-colors flex items-center justify-center">-</button>
                    <span className="text-3xl font-bold w-24 text-center text-white">{days} <span className="text-sm text-slate-400 font-normal block">days</span></span>
                    <button onClick={() => setDays(d => d + 1)} className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl transition-colors flex items-center justify-center">+</button>
                </div>
            </div>
            <div className="text-center">
                <label htmlFor="start-date" className="block text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Start Date</label>
                <div className="bg-slate-800/50 p-2 rounded-2xl border border-white/5">
                    <input 
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="bg-transparent border-none text-white text-xl font-bold p-2.5 focus:ring-0 text-center w-full cursor-pointer"
                    />
                </div>
            </div>
        </div>
        
        <div className="bg-slate-800/30 rounded-xl p-6 mb-10 border border-white/5">
            {selectedSpots.length > 0 ? (
                <p className="text-slate-300">Your plan will be built around your <span className="text-white font-bold">{selectedSpots.length} selected spots</span>, including <span className="text-purple-300">{selectedSpots[0].name}</span>.</p>
            ) : (
                <p className="text-slate-300">This will be a general plan based on popular attractions in {city.name}.</p>
            )}
        </div>

        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">{error}</div>}

        <div className="flex justify-center">
            <button 
                onClick={handleGeneratePlan} 
                className="gradient-bg text-white font-bold text-xl py-5 px-12 rounded-2xl hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/40 flex items-center gap-3"
            >
                Generate My Plan <ArrowRight className="h-6 w-6" />
            </button>
        </div>
        </div>
    </div>
  );
};

export default PlanPage;