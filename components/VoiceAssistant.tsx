import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, MessageCircle, X, Volume2, Activity } from 'lucide-react';

interface VoiceAssistantProps {
  onSpeechResult: (text: string) => void;
  isSpeaking: boolean; // Is the AI currently TTS-ing?
  isActiveMode: boolean;
  onToggleActiveMode: () => void;
  status: 'idle' | 'listening' | 'processing' | 'speaking';
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onSpeechResult, isSpeaking, isActiveMode, onToggleActiveMode, status }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null); // Use any for SpeechRecognition types

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // We handle continuous manually for better control
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // If Active Mode is ON and we are NOT speaking, restart listening (unless manually stopped)
        // This logic is usually handled by the parent effect to avoid race conditions.
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
            onSpeechResult(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    } else {
        console.warn("Web Speech API not supported");
    }

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null; // Prevent loop
            recognitionRef.current.stop();
        }
    };
  }, [onSpeechResult]);

  // External Control for Active Mode Loop
  useEffect(() => {
      if (isActiveMode && !isSpeaking && !isListening && status === 'idle' && recognitionRef.current) {
          try {
             recognitionRef.current.start();
          } catch (e) {
              // Already started or busy
          }
      }
  }, [isActiveMode, isSpeaking, isListening, status]);


  const toggleListening = () => {
    if (isListening) {
        recognitionRef.current?.stop();
        if (isActiveMode) onToggleActiveMode(); // Turn off active mode if manually stopped
    } else {
        recognitionRef.current?.start();
    }
  };

  return (
    <div className={`fixed bottom-24 right-4 z-50 flex flex-col items-end gap-4 transition-all duration-500 ${status !== 'idle' ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100'}`}>
        
        {/* Status Bubble */}
        {(status === 'processing' || status === 'speaking' || isListening) && (
            <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl rounded-tr-none shadow-xl mb-2 animate-fade-in max-w-[200px]">
       {/* Status Text (Only for Listening/Speaking, hidden for processing/thinking to feel faster) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        {status === 'listening' && (
           <span className="text-sm font-medium text-white/80 animate-pulse">Listening...</span>
        )}
        {status === 'speaking' && (
           <span className="text-sm font-medium text-purple-300 animate-pulse">Speaking...</span>
        )}
      </div>
            </div>
        )}

        {/* Main Orb */}
        <div className="relative group">
            {/* Pulsing Rings */}
            {isListening && (
                <>
                    <div className="absolute inset-0 bg-purple-500/30 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                </>
            )}

            {/* Glowing Orb */}
            <button 
                onClick={toggleListening}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] border-2 transition-all duration-300 relative z-10 overflow-hidden ${
                    isListening ? 'bg-gradient-to-br from-purple-600 to-blue-600 border-white/50 scale-110' : 
                    status === 'processing' ? 'bg-slate-700 border-purple-500/50 animate-pulse' :
                    status === 'speaking' ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-white/50 shadow-[0_0_30px_rgba(34,197,94,0.4)]' :
                    'bg-slate-800 border-slate-600 hover:border-purple-400'
                }`}
            >
                {status === 'speaking' ? (
                     <div className="flex gap-1 items-end h-6">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-1 bg-white rounded-full animate-bounce" style={{ height: '60%', animationDelay: `${i*0.1}s` }}></div>
                        ))}
                     </div>
                ) : isListening ? (
                    <Mic className="h-8 w-8 text-white" />
                ) : (
                    <Mic className="h-7 w-7 text-slate-400 group-hover:text-purple-400 transition-colors" />
                )}
            </button>
            
            {/* Active Mode Toggle */}
             <button 
                onClick={(e) => { e.stopPropagation(); onToggleActiveMode(); }}
                className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center border shadow-lg transition-all z-20 ${
                    isActiveMode ? 'bg-green-500 border-white text-white rotate-0' : 'bg-slate-700 border-slate-600 text-slate-400 -rotate-90 hover:bg-slate-600'
                }`}
                title={isActiveMode ? "Conversation Mode ON" : "Conversation Mode OFF"}
            >
                <Activity className="h-4 w-4" />
            </button>
        </div>
    </div>
  );
};

export default VoiceAssistant;
