import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Activity, Globe, Shield, Clock } from 'lucide-react';

interface Position {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number | null;
  };
  timestamp: number;
}

const TrackerPage: React.FC = () => {
  const [location, setLocation] = useState<Position | null>(null);
  const [status, setStatus] = useState('Initializing tracker...');
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setStatus('Tracker Unavailable');
      return;
    }

    setStatus('Acquiring satellite lock...');
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
            coords: position.coords,
            timestamp: position.timestamp
        });
        setStatus('Tracking Active');
        setError(null);
      },
      (err) => {
        setError('Unable to retrieve your location. Please check permissions.');
        setStatus('Signal Lost');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(timer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12 animate-fade-in">
        <h2 className="text-4xl md:text-6xl font-bold mb-4 gradient-text tracking-tight">
          Journey Tracker
        </h2>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Real-time location monitoring and trip statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Status Card */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="h-32 w-32 text-purple-500" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`h-3 w-3 rounded-full ${error ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">System Status</h3>
                </div>
                
                <div className="text-3xl font-bold text-white mb-2">{status}</div>
                {error && <p className="text-red-400">{error}</p>}
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                        <div className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Duration
                        </div>
                        <div className="text-2xl font-mono text-white">{formatTime(elapsedTime)}</div>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                        <div className="text-slate-400 text-sm mb-1 flex items-center gap-2">
                            <Shield className="h-4 w-4" /> Accuracy
                        </div>
                        <div className="text-2xl font-mono text-white">
                            {location ? `±${Math.round(location.coords.accuracy)}m` : '--'}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Coordinates Card */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.1s' }}>
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Globe className="h-32 w-32 text-blue-500" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <Navigation className="h-5 w-5 text-blue-400" />
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Live Telemetry</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="text-slate-400 text-sm mb-1">Latitude</div>
                        <div className="text-4xl font-mono text-white tracking-wider">
                            {location ? location.coords.latitude.toFixed(6) : '00.000000'}
                            <span className="text-lg text-slate-500 ml-2">°N</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-slate-400 text-sm mb-1">Longitude</div>
                        <div className="text-4xl font-mono text-white tracking-wider">
                            {location ? location.coords.longitude.toFixed(6) : '00.000000'}
                            <span className="text-lg text-slate-500 ml-2">°E</span>
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Current Speed</span>
                            <span className="text-2xl font-bold text-white">
                                {location && location.coords.speed ? Math.round(location.coords.speed * 3.6) : 0} <span className="text-sm text-slate-500 font-normal">km/h</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <p className="text-slate-500 text-sm">
            <MapPin className="h-4 w-4 inline-block mr-1" />
            Location data is processed locally on your device and is not stored on our servers.
        </p>
      </div>
    </div>
  );
};

export default TrackerPage;