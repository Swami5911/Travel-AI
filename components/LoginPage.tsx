import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/dbService';
import { Compass as CompassIcon, User as UserIcon, ArrowRight, Lock, Briefcase, Shield } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

type Tab = 'visitor' | 'guide' | 'admin';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<Tab>('visitor');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  // Guide specific registration fields
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // API Config State
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [groqKey, setGroqKey] = useState(localStorage.getItem('GROQ_API_KEY') || '');

  const saveApiKey = () => {
    if (geminiKey.trim()) {
        localStorage.setItem('GEMINI_API_KEY', geminiKey.trim());
    } else {
        localStorage.removeItem('GEMINI_API_KEY');
    }

    if (groqKey.trim()) {
        localStorage.setItem('GROQ_API_KEY', groqKey.trim());
    } else {
        localStorage.removeItem('GROQ_API_KEY');
    }
    
    alert('Configuration Update!');
    setShowApiConfig(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (activeTab === 'admin') {
        const user = await db.login(name, password);
        if (user && user.role === 'admin') onLogin(user);
        else alert('Invalid Admin Credentials');
        return;
    }

    if (activeTab === 'visitor') {
        // Simple auto-login or register for visitors for this demo
        let user = await db.login(name);
        if (!user) user = await db.registerVisitor(name);
        onLogin(user);
    }

    if (activeTab === 'guide') {
        if (isRegistering) {
            const user = await db.registerGuide(name, bio, specialties.split(',').map(s => s.trim()));
            onLogin(user);
        } else {
            const user = await db.login(name, password || 'password'); // Mock default password checking
            if (user && user.role === 'guide') onLogin(user);
            else alert('Guide not found or invalid credentials. Try registering?');
        }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* API Configuration Modal */}
      {showApiConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="glass-card p-8 rounded-2xl w-full max-w-lg border border-white/10 relative">
                <button 
                    onClick={() => setShowApiConfig(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    ✕
                </button>
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-purple-400" /> Configure AI API
                </h3>
                <p className="text-slate-300 mb-6">
                    Enter your personal API keys below to use your own quotas. Keys are stored locally on your device.
                </p>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">Gemini API Key</label>
                        <input 
                            type="password" 
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                            placeholder="AIzaSy..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">Groq API Key (Optional - Faster)</label>
                        <input 
                            type="password" 
                            value={groqKey}
                            onChange={(e) => setGroqKey(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-orange-500 outline-none"
                            placeholder="gsk_..."
                        />
                    </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                    <h4 className="text-blue-300 font-bold mb-2 text-sm">How to get a key:</h4>
                    <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                        <li><strong>Gemini:</strong> <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline">Google AI Studio</a></li>
                        <li><strong>Groq:</strong> <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-blue-400 underline">Groq Console</a></li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={saveApiKey}
                        className="w-2/3 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="glass-card p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/10 relative z-10 animate-fade-in">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/20 mb-6 animate-float">
            <CompassIcon className="h-10 w-10 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2 gradient-text tracking-tight">Travel.AI</h1>
          <p className="text-slate-400">Intelligent Travel Companion</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/50 p-1 rounded-xl mb-8 border border-white/5">
            <button 
                onClick={() => setActiveTab('visitor')} 
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'visitor' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                Visitor
            </button>
            <button 
                onClick={() => setActiveTab('guide')} 
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'guide' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                Guide
            </button>
            <button 
                onClick={() => setActiveTab('admin')} 
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'admin' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                Admin
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* VISITOR VIEW */}
          {activeTab === 'visitor' && (
              <div className="space-y-4">
                <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20 mb-4">
                    <p className="text-sm text-purple-200">✨ Plan trips, track progress, and save history.</p>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-purple-500 outline-none" placeholder="Enter your name" required />
                    <div className="flex justify-end mt-2">
                        <button type="button" onClick={() => setShowApiConfig(true)} className="text-xs text-slate-500 hover:text-purple-400 flex items-center gap-1 transition-colors">
                            <Shield size={12} /> Configure API Key
                        </button>
                    </div>
                </div>
              </div>
          )}

          {/* ADMIN VIEW */}
          {activeTab === 'admin' && (
              <div className="space-y-4">
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 mb-4">
                    <p className="text-sm text-red-200">🛡️ Manage accounts and system settings.</p>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Admin Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-red-500 outline-none" placeholder="e.g. Admin User" required />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-red-500 outline-none" placeholder="admin123" required />
                </div>
              </div>
          )}

          {/* GUIDE VIEW */}
          {activeTab === 'guide' && (
              <div className="space-y-4">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-400">{isRegistering ? 'Create Profile' : 'Sign In'}</span>
                    <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-xs text-blue-400 hover:underline">
                        {isRegistering ? 'Already have an account?' : 'New Guide? Register'}
                    </button>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 outline-none" placeholder="Your Full Name" required />
                    <div className="flex justify-end mt-2">
                        <button type="button" onClick={() => setShowApiConfig(true)} className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors">
                             <Shield size={12} /> Configure API Key
                        </button>
                    </div>
                 </div>
                 
                 {!isRegistering && (
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 outline-none" placeholder="Enter password (default: password)" />
                    </div>
                 )}

                 {isRegistering && (
                    <>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Specialties</label>
                            <input type="text" value={specialties} onChange={e => setSpecialties(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 outline-none" placeholder="History, Food, Hiking..." />
                        </div>
                         <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">Bio</label>
                            <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white focus:border-blue-500 outline-none h-24" placeholder="Tell visitors about yourself..." />
                        </div>
                    </>
                 )}
              </div>
          )}

          <button
            type="submit"
            className={`w-full text-white font-bold text-lg py-4 rounded-xl hover:opacity-90 transition shadow-xl mt-6 
                ${activeTab === 'visitor' ? 'gradient-bg' : ''}
                ${activeTab === 'guide' ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : ''}
                ${activeTab === 'admin' ? 'bg-gradient-to-r from-red-600 to-orange-500' : ''}
            `}
          >
            {isRegistering && activeTab === 'guide' ? 'Register As Guide' : 'Enter Portal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;