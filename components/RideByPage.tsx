import React, { useState } from 'react';
import { getRideRoute, processVoiceCommand, VoiceResponse, AIProvider } from '../services/aiService';
import { getRealTimeAQI } from '../services/weatherService';
import { RideRoute, RideStop } from '../types';
import { MapPin, Navigation, Bike, Car, AlertTriangle, Coffee, Fuel, Clock, CheckCircle, Cloud, Sun, CloudRain, Wind, Info, X, ChevronRight } from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';
import MusicPlayer from './MusicPlayer';
import LoadingIndicator from './LoadingSpinner';

interface RideByPageProps {
    provider?: AIProvider;
}

const RideByPage: React.FC<RideByPageProps> = ({ provider = 'gemini' }) => {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [vehicleType, setVehicleType] = useState<'bike' | 'car'>('bike');
    const [route, setRoute] = useState<RideRoute | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedStop, setSelectedStop] = useState<RideStop | null>(null);

    const [stopInterval, setStopInterval] = useState(25);

    const handlePlanRide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!origin.trim() || !destination.trim()) return;

        setIsLoading(true);
        setError(null);
        setRoute(null);
        setSelectedStop(null);

        try {
            const data = await getRideRoute(origin, destination, vehicleType, stopInterval, provider);
            if (data) {
                setRoute(data);
            } else {
                setError("Could not generate a route plan. Please try again.");
            }
        } catch (err) {
            setError("An error occurred while planning the ride.");
        } finally {
            setIsLoading(false);
        }
    };

    const getWeatherIcon = (weather: string) => {
        const w = weather.toLowerCase();
        if (w.includes('rain') || w.includes('storm')) return <CloudRain className="h-6 w-6 text-blue-400" />;
        if (w.includes('cloud')) return <Cloud className="h-6 w-6 text-slate-400" />;
        if (w.includes('wind')) return <Wind className="h-6 w-6 text-slate-300" />;
        return <Sun className="h-6 w-6 text-yellow-400" />;
    };

    // --- Voice Assistant Logic ---
    const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
    const [isActiveMode, setIsActiveMode] = useState(false);
    const [musicState, setMusicState] = useState<{isPlaying: boolean, track: string | null}>({ isPlaying: false, track: null });


    // Tts with Voice Selection
    // Tts with Voice Selection
    const speak = React.useCallback((text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop current speech
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Voice Selection Logic
            const voices = window.speechSynthesis.getVoices();
            // Priority: Google US English -> Microsoft Zira -> Any Female/Natural -> Default
            const preferredVoice = voices.find(v => v.name.includes("Google US English")) 
                                || voices.find(v => v.name.includes("Zira")) 
                                || voices.find(v => v.name.includes("Samantha"))
                                || voices.find(v => v.lang === 'en-US' && v.name.includes("Female"));
            
            if (preferredVoice) utterance.voice = preferredVoice;
            
            utterance.rate = 1.1; // Slightly faster
            utterance.pitch = 1.05; // Slightly higher

            utterance.onstart = () => setVoiceStatus('speaking');
            utterance.onend = () => setVoiceStatus('idle');
            utterance.onerror = (e) => {
                console.error("TTS Error:", e);
                setVoiceStatus('idle');
            };

            window.speechSynthesis.speak(utterance);
        }
    }, []);

    const handleSpeechResult = React.useCallback(async (transcript: string) => {
        setVoiceStatus('processing');
        console.log("User said:", transcript);

        try {
            const context = {
                location: origin && destination ? `Driving from ${origin} to ${destination}` : "On the road",
                route: route ? { duration: route.duration, distance: route.distance } : undefined
            };
            
            const response: VoiceResponse = await processVoiceCommand(transcript, context);
            
            if (response.type === 'MUSIC') {
                if (response.action === 'play') setMusicState(prev => ({ ...prev, isPlaying: true, track: response.track || prev.track }));
                if (response.action === 'pause') setMusicState(prev => ({ ...prev, isPlaying: false }));
                if (response.action === 'next') setMusicState(prev => ({ ...prev, track: "Skipped Track" })); // Mock
                
                speak(response.text);
            } else {
                speak(response.text);
            }

        } catch (e) {
            console.error("Voice processing error:", e);
            speak("Sorry, I had a bit of a brain fart. Can you say that again?");
            setVoiceStatus('idle');
        }
    }, [origin, destination, route, speak]);

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <h1 className="text-5xl md:text-6xl font-bold text-center mb-4 gradient-text tracking-tight">RideBy Route Planner</h1>
            <p className="text-center text-slate-400 text-lg mb-12 max-w-2xl mx-auto">
                Your AI-powered co-pilot for the perfect road trip. Get detailed stops, road conditions, and weather updates instantly.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Input Form (Takes 4 columns) */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass-card p-8 rounded-2xl shadow-xl border border-slate-700/50">
                        <form onSubmit={handlePlanRide} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Starting Point</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-4 text-slate-400 h-6 w-6 group-focus-within:text-purple-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value)}
                                        placeholder="e.g., Delhi"
                                        className="w-full bg-slate-800/80 border border-slate-600 rounded-xl py-4 pl-12 pr-4 text-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Destination</label>
                                <div className="relative group">
                                    <Navigation className="absolute left-4 top-4 text-slate-400 h-6 w-6 group-focus-within:text-purple-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        placeholder="e.g., Jaipur"
                                        className="w-full bg-slate-800/80 border border-slate-600 rounded-xl py-4 pl-12 pr-4 text-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Stop Interval (km)</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[5, 10, 15, 20, 25].map(km => (
                                        <button
                                            key={km}
                                            type="button"
                                            onClick={() => setStopInterval(km)}
                                            className={`py-2 rounded-lg font-bold text-sm transition-all border ${
                                                stopInterval === km 
                                                ? 'bg-purple-600 text-white border-purple-500 shadow-lg' 
                                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                            }`}
                                        >
                                            {km}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Find places approximately every {stopInterval} km</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Vehicle Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setVehicleType('bike')}
                                        className={`py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${vehicleType === 'bike' ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700 hover:border-slate-600'}`}
                                    >
                                        <Bike className="h-8 w-8" /> 
                                        <span className="font-bold">Motorbike</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVehicleType('car')}
                                        className={`py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${vehicleType === 'car' ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 border-transparent text-slate-400 hover:bg-slate-700 hover:border-slate-600'}`}
                                    >
                                        <Car className="h-8 w-8" /> 
                                        <span className="font-bold">Car</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full gradient-bg text-white font-bold text-lg py-5 rounded-xl hover:opacity-90 transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
                            >
                                {isLoading ? <LoadingIndicator /> : (
                                    <>
                                        <Navigation className="h-6 w-6" /> Plan My Ride
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Route Summary (Small) */}
                    {route && (
                        <div className="glass-card p-8 rounded-2xl border-l-4 border-purple-500 animate-fade-in shadow-lg">
                            <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                                <Info className="text-purple-400" /> Trip Overview
                            </h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
                                    <span className="text-slate-400 font-medium">Total Distance</span>
                                    <span className="text-2xl font-bold text-white">{route.distance}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
                                    <span className="text-slate-400 font-medium">Est. Duration</span>
                                    <span className="text-2xl font-bold text-white">{route.duration}</span>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-lg">
                                    <span className="text-slate-400 block mb-2 font-medium">Road Condition</span>
                                    <p className="text-slate-200 leading-relaxed">{route.roadCondition}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Timeline Map (Takes 8 columns) */}
                <div className="lg:col-span-8 space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-6 rounded-xl text-center text-lg font-medium">
                            {error}
                        </div>
                    )}

                    {route && (
                        <div className="glass-card p-8 md:p-10 rounded-2xl min-h-[800px] relative animate-fade-in shadow-2xl border border-slate-700/50">
                            <h2 className="text-3xl font-bold text-slate-100 mb-12 flex items-center gap-3">
                                <MapPin className="text-purple-400 h-8 w-8" /> Route Timeline
                            </h2>

                            <div className="relative pl-12 space-y-16">
                                {/* Gradient Line */}
                                <div className="absolute left-[3px] top-4 bottom-4 w-1 bg-gradient-to-b from-green-500 via-purple-500 to-red-500 rounded-full opacity-50"></div>
                                {/* Start Point */}
                                <div className="relative">
                                    <div className="absolute -left-[62px] bg-green-500 h-10 w-10 rounded-full border-8 border-slate-900 shadow-[0_0_15px_rgba(34,197,94,0.5)] z-10"></div>
                                    <div className="bg-slate-800/80 p-6 rounded-xl border border-green-500/30 inline-block min-w-[200px]">
                                        <h3 className="text-2xl font-bold text-white mb-1">{route.origin}</h3>
                                        <p className="text-green-400 font-medium flex items-center gap-2">
                                            <Navigation className="h-4 w-4" /> Start Point
                                        </p>
                                    </div>
                                </div>

                                {/* Stops */}
                                {route.stops.map((stop, index) => (
                                    <div 
                                        key={index} 
                                        className="relative group cursor-pointer"
                                        onClick={() => setSelectedStop(stop)}
                                    >
                                        <div className={`absolute -left-[62px] h-10 w-10 rounded-full border-8 border-slate-900 transition-all duration-300 z-10 ${
                                            selectedStop === stop ? 'bg-purple-500 scale-125 shadow-[0_0_20px_rgba(168,85,247,0.6)]' : 'bg-slate-600 group-hover:bg-purple-400 group-hover:scale-110'
                                        }`}></div>
                                        
                                        <div className={`p-6 rounded-2xl transition-all duration-300 border-2 ${
                                            selectedStop === stop ? 'bg-slate-800 border-purple-500 shadow-2xl shadow-purple-500/10 translate-x-2' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 hover:translate-x-1'
                                        }`}>
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                                <div>
                                                    <span className="text-sm font-bold font-mono text-purple-400 mb-1 block tracking-wider">
                                                        +{stop.distanceFromLast} <span className="text-slate-500 mx-2">|</span> {stop.location}
                                                    </span>
                                                    <h4 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">{stop.name}</h4>
                                                </div>
                                                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                                                    <div className="flex items-center gap-3 bg-slate-900/60 px-4 py-2 rounded-lg border border-slate-700/50">
                                                        {getWeatherIcon(stop.weather)}
                                                        <span className="text-slate-200 font-medium">{stop.weather}</span>
                                                    </div>
                                                    {stop.aqi && (
                                                        <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-lg border border-slate-700/50">
                                                            <Wind className="h-4 w-4 text-green-400" />
                                                            <span className="text-slate-200 font-medium">{stop.aqi}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-3 mb-4">
                                                <span className={`text-sm px-4 py-1.5 rounded-full uppercase font-bold tracking-wide ${
                                                    stop.type === 'food' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                                    stop.type === 'fuel' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                                    stop.type === 'scenic' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                }`}>
                                                    {stop.type}
                                                </span>
                                            </div>
                                            
                                            <p className="text-slate-400 text-base leading-relaxed line-clamp-2">{stop.description}</p>
                                            
                                            <div className="mt-4 flex items-center text-purple-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                                View Details <ChevronRight className="h-4 w-4 ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* End Point */}
                                <div className="relative">
                                    <div className="absolute -left-[62px] bg-red-500 h-10 w-10 rounded-full border-8 border-slate-900 shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10"></div>
                                    <div className="bg-slate-800/80 p-6 rounded-xl border border-red-500/30 inline-block min-w-[200px]">
                                        <h3 className="text-2xl font-bold text-white mb-1">{route.destination}</h3>
                                        <p className="text-red-400 font-medium flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4" /> Destination Reached
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal / Slide-over */}
            {selectedStop && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex justify-end animate-fade-in" onClick={() => setSelectedStop(null)}>
                    <div className="w-full max-w-xl bg-slate-900 h-full p-10 shadow-2xl border-l border-slate-700 overflow-y-auto transform transition-transform duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h2 className="text-4xl font-bold text-white mb-4">{selectedStop.name}</h2>
                                <span className={`text-sm px-4 py-2 rounded-full uppercase font-bold tracking-wider ${
                                    selectedStop.type === 'food' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                                    selectedStop.type === 'fuel' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                    selectedStop.type === 'scenic' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                    {selectedStop.type}
                                </span>
                            </div>
                            <button onClick={() => setSelectedStop(null)} className="p-3 hover:bg-slate-800 rounded-full transition-colors group">
                                <X className="h-8 w-8 text-slate-400 group-hover:text-white" />
                            </button>
                        </div>

                        <div className="space-y-10">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Cloud className="h-4 w-4" /> Weather Forecast
                                </h3>
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-slate-800 rounded-xl">
                                        {getWeatherIcon(selectedStop.weather)}
                                    </div>
                                    <div>
                                        <span className="text-3xl font-bold text-white block mb-1">{selectedStop.weather}</span>
                                        <span className="text-slate-400 text-sm">Expected conditions upon arrival</span>
                                    </div>
                                </div>
                                {selectedStop.aqi && (
                                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-4">
                                        <div className="p-2 bg-slate-800 rounded-lg">
                                            <Wind className="h-5 w-5 text-green-400" />
                                        </div>
                                        <div>
                                            <span className="text-lg font-bold text-white block">{selectedStop.aqi}</span>
                                            <span className="text-slate-500 text-xs">Air Quality Index</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Info className="h-5 w-5 text-purple-400" /> About this stop
                                </h3>
                                <p className="text-slate-300 text-lg leading-relaxed bg-slate-800/30 p-6 rounded-2xl border border-slate-800">
                                    {selectedStop.description}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-400" /> Highlights & Tips
                                </h3>
                                <ul className="space-y-4">
                                    {selectedStop.highlights.map((highlight, idx) => (
                                        <li key={idx} className="flex items-start gap-4 bg-slate-800 p-5 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition-colors">
                                            <div className="bg-purple-500/20 p-2 rounded-lg shrink-0">
                                                <Info className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <span className="text-slate-200 text-lg">{highlight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Travel Buddy Voice & Music UI */}
            {(route || isLoading) && (
                <>
                    <div className="fixed top-24 right-4 z-40 w-64 md:w-80">
                        <MusicPlayer 
                            isPlayingExternal={musicState.isPlaying} 
                            currentTrackName={musicState.track}
                            onPlayStateChange={(playing) => setMusicState(prev => ({ ...prev, isPlaying: playing }))}
                        />
                    </div>
                    <VoiceAssistant 
                        onSpeechResult={handleSpeechResult} 
                        isSpeaking={voiceStatus === 'speaking'}
                        status={voiceStatus}
                        isActiveMode={isActiveMode}
                        onToggleActiveMode={() => setIsActiveMode(!isActiveMode)}
                    />
                </>
            )}
        </div>
    );
};

export default RideByPage;
