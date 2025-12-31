import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getCountries, getStates, getTopCities, AIProvider } from '../services/aiService';
import { Country, State, City, CityInfo, Itinerary } from '../types';
import ImageWithFallback from './ImageWithFallback';
import { Search, Globe, Map as MapIcon, MapPin, ArrowRight, Check, Calendar, RotateCcw, Clock } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

interface DestinationPageProps {
  onSelectCity: (city: { name: string; country: string }) => void;
  provider?: 'gemini' | 'openai' | 'grok';
  previousPlan?: Itinerary | null;
  onResumePlan?: () => void;
  history?: Itinerary[];
  onLoadHistory?: (itinerary: Itinerary) => void;
}

const DestinationPage: React.FC<DestinationPageProps> = ({ 
    onSelectCity, 
    provider = 'gemini', 
    previousPlan, 
    onResumePlan,
    history = [],
    onLoadHistory 
}) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<CityInfo[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityInfo | null>(null); // Added state for city
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null); // New state for alphabet filter
  
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingCountries(true);
      setError(null);
      const fetchedCountries = await getCountries();
      if (fetchedCountries) {
        setCountries(fetchedCountries);
      } else {
        setError('Could not load countries. Please refresh the page.');
      }
      setIsLoadingCountries(false);
    };
    fetchInitialData();
  }, []);

  const handleCountrySelect = async (country: Country) => {
    setSelectedCountry(country);
    setSelectedState(null);
    setCities([]);
    setIsLoadingStates(true);
    setError(null);
    const fetchedStates = await getStates(country.name);
    if (fetchedStates) {
      setStates(fetchedStates);
    } else {
      setError(`Could not load regions for ${country.name}. Please try again.`);
    }
    setIsLoadingStates(false);
  };

  const handleStateSelect = async (state: State) => {
    if (!selectedCountry) return;
    setSelectedState(state);
    setIsLoadingCities(true);
    setError(null);
    const fetchedCities = await getTopCities(state.name, selectedCountry.name, provider);
    if (fetchedCities) {
      setCities(fetchedCities);
    } else {
      setError(`Could not load cities for ${state.name}. Please try again.`);
    }
    setIsLoadingCities(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()){
      const parts = searchQuery.split(',').map(p => p.trim());
      const cityName = parts[0];
      const countryName = parts[1] || '';
      onSelectCity({ name: cityName, country: countryName });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="text-center mb-16 animate-fade-in">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text tracking-tight">
                    Where to next?
                </h1>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    Discover your next adventure with AI-curated itineraries and local insights.
                </p>
            </div>

            {/* Direct City Search */}
            <div className="max-w-2xl mx-auto mb-16 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="glass-card p-2 rounded-2xl flex items-center shadow-2xl border border-white/10">
                    <Search className="ml-4 text-slate-400 h-6 w-6" />
                    <input
                        type="text"
                        placeholder="Search for a city directly (e.g. Paris, Tokyo)..."
                        className="w-full bg-transparent border-none text-white text-lg px-4 py-3 focus:ring-0 placeholder:text-slate-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={!searchQuery.trim()}
                        className="bg-purple-600 hover:bg-purple-500 text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowRight className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* TRIP HISTORY */}
            {history && history.length > 0 && (
                <div className="max-w-6xl mx-auto mb-12 animate-fade-in">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Clock className="h-6 w-6 text-purple-400" /> Your Travel History
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        {history.map((item, idx) => (
                            <div key={idx} className="min-w-[300px] glass-card p-5 rounded-xl border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group" onClick={() => onLoadHistory && onLoadHistory(item)}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-slate-800 rounded-lg">
                                        <MapIcon className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-bold truncate">{item.tripTitle.replace("Your Awesome Trip to ", "Trip to ")}</h4>
                                        <p className="text-xs text-slate-400">{item.dailyPlans.length} Days</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Resume Previous Plan Card */}
             {previousPlan && (
                <div className="max-w-2xl mx-auto mb-10 animate-fade-in">
                    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 p-6 rounded-2xl flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/20 rounded-full text-purple-300">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-1">Active Plan</p>
                                <h3 className="text-lg font-bold text-white">{previousPlan.tripTitle}</h3>
                            </div>
                        </div>
                        <button 
                            onClick={onResumePlan}
                            className="flex items-center gap-2 bg-white text-purple-900 px-5 py-2 rounded-xl font-bold hover:bg-purple-100 transition-colors"
                        >
                            <RotateCcw className="h-4 w-4" /> Resume
                        </button>
                    </div>
                </div>
            )}

            {/* BUBBLE EXPLORER */}
            <div className="max-w-4xl mx-auto min-h-[500px] relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
                
                {/* Back / Breadcrumbs Navigation */}
                {(selectedLetter || selectedCountry || selectedState) && (
                    <div className="flex flex-wrap items-center gap-2 mb-6 animate-fade-in">
                        <button 
                            onClick={() => {
                                setSelectedCity(null);
                                setSelectedState(null);
                                setSelectedCountry(null);
                                setSelectedLetter(null);
                            }}
                            className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 hover:text-white text-sm transition-colors"
                        >
                            Start
                        </button>
                        
                        {selectedLetter && (
                            <>
                                <span className="text-slate-600">/</span>
                                <button 
                                    onClick={() => {
                                        setSelectedCountry(null);
                                        setSelectedState(null);
                                    }}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${!selectedCountry ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                >
                                    {selectedLetter}
                                </button>
                            </>
                        )}

                        {selectedCountry && (
                            <>
                                <span className="text-slate-600">/</span>
                                <button 
                                    onClick={() => setSelectedState(null)}
                                    className={`px-3 py-1 rounded-full text-sm transition-colors ${!selectedState ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                >
                                    {selectedCountry.name}
                                </button>
                            </>
                        )}

                        {selectedState && (
                            <>
                                <span className="text-slate-600">/</span>
                                <button 
                                    disabled
                                    className="px-3 py-1 rounded-full bg-orange-600 text-white text-sm shadow-lg"
                                >
                                    {selectedState.name}
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* STAGE 1: ALPHABET BUBBLES */}
                {!selectedLetter && !selectedCountry && (
                    <div className="relative">
                        <h2 className="text-3xl font-bold text-center text-white mb-10">Choose a Region</h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter, i) => (
                                <button
                                    key={letter}
                                    onClick={() => {
                                        setSelectedLetter(letter); 
                                    }}
                                    className="w-16 h-16 rounded-full bg-slate-800/50 border border-white/10 hover:border-purple-500 hover:bg-purple-500/20 text-xl font-bold text-white shadow-lg backdrop-blur-sm transition-all hover:scale-125 flex items-center justify-center animate-float"
                                    style={{ animationDelay: `${i * 0.1}s`, animationDuration: `${3 + (i % 3)}s` }}
                                >
                                    {letter}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STAGE 2: COUNTRIES BY LETTER */}
                {selectedLetter && !selectedCountry && (
                    <div className="animate-fade-in">
                         <h2 className="text-3xl font-bold text-center text-white mb-10">Countries starting with "{selectedLetter}"</h2>
                         {isLoadingCountries ? (
                             <div className="flex justify-center"><SkeletonLoader className="w-96 h-96 rounded-full opacity-20" /></div>
                         ) : (
                             <div className="flex flex-wrap justify-center gap-4">
                                {countries.filter(c => c.name.startsWith(selectedLetter!)).length > 0 ? (
                                    countries.filter(c => c.name.startsWith(selectedLetter!)).map((country) => (
                                        <button
                                            key={country.name}
                                            onClick={() => handleCountrySelect(country)}
                                            className="px-6 py-3 rounded-full bg-gradient-to-br from-blue-900/40 to-slate-800/40 border border-blue-500/30 hover:border-blue-400 hover:from-blue-800/60 hover:to-slate-700/60 text-lg font-bold text-white shadow-xl backdrop-blur-md transition-all hover:scale-110"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-blue-400" />
                                                {country.name}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center w-full py-10">
                                        <p className="text-slate-400 text-lg">No countries found starting with {selectedLetter}.</p>
                                        <button onClick={() => setSelectedLetter(null)} className="mt-4 text-purple-400 hover:underline">Go Back</button>
                                    </div>
                                )}
                             </div>
                         )}
                    </div>
                )}

                {/* STAGE 3: STATES BUBBLE */}
                {selectedCountry && !selectedState && (
                    <div className="animate-fade-in">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-white mb-2">Where in {selectedCountry.name}?</h2>
                            <p className="text-slate-400">Select a region or state</p>
                        </div>
                        
                        {isLoadingStates ? (
                             <div className="flex justify-center flex-wrap gap-4">
                                 {[1,2,3,4,5].map(i => <SkeletonLoader key={i} className="w-32 h-12 rounded-full" />)}
                             </div>
                        ) : (
                            <div className="flex flex-wrap justify-center gap-4">
                                {states.map((state, i) => (
                                    <button
                                        key={state.name}
                                        onClick={() => handleStateSelect(state)}
                                        className="px-6 py-4 rounded-full bg-gradient-to-br from-purple-900/40 to-slate-800/40 border border-purple-500/30 hover:border-purple-400 hover:from-purple-800/60 hover:to-slate-700/60 text-lg font-bold text-white shadow-xl backdrop-blur-md transition-all hover:scale-110 flex items-center justify-center animate-bg-pulse"
                                        style={{ animationDelay: `${i * 0.05}s` }}
                                    >
                                        {state.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STAGE 4: CITIES BUBBLE */}
                {selectedState && (
                    <div className="animate-fade-in">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-white mb-2">Top cities in {selectedState.name}</h2>
                            <p className="text-slate-400">Choose your destination</p>
                        </div>

                        {isLoadingCities ? (
                             <div className="flex justify-center flex-wrap gap-4">
                                 {[1,2,3].map(i => <SkeletonLoader key={i} className="w-40 h-16 rounded-full" />)}
                             </div>
                        ) : (
                            <div className="flex flex-wrap justify-center gap-6">
                                {cities.map((city, i) => (
                                    <button
                                        key={city.name}
                                        onClick={() => onSelectCity({ name: city.name, country: selectedCountry?.name || '' })}
                                        className="group relative w-48 h-48 rounded-full flex flex-col items-center justify-center bg-slate-800 border-4 border-slate-700 hover:border-orange-500/50 transition-all hover:scale-110 shadow-2xl overflow-hidden"
                                    >
                                        {/* Image Background Fallback or Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/80 to-slate-900/90 group-hover:from-orange-800/80 group-hover:to-slate-900/80 transition-colors z-0" />
                                        
                                        <div className="relative z-10 text-center p-4">
                                            <MapPin className="h-8 w-8 text-orange-400 mx-auto mb-2 group-hover:scale-125 transition-transform" />
                                            <h3 className="text-xl font-bold text-white leading-tight mb-1">{city.name}</h3>
                                            <p className="text-[10px] text-slate-300 line-clamp-2 leading-tight">{city.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
      
      <Helmet>
        <title>
            {selectedCountry ? `Select a Region in ${selectedCountry.name} - AI Travel Planner` : 'Choose Your Destination - AI Travel Planner'}
        </title>
        <meta name="description" content={`Explore destinations in ${selectedCountry?.name || 'the world'}. Plan your perfect trip with AI.`} />
      </Helmet>
    </div>
  );
};

export default DestinationPage;