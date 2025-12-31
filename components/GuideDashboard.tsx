
import React, { useState } from 'react';
import { GuideUser, Review } from '../types';
import { db } from '../services/dbService';
import { Briefcase, User, Settings, ToggleLeft, ToggleRight, MessageSquare, Star } from 'lucide-react';

interface GuideDashboardProps {
  user: GuideUser;
  onLogout: () => void;
}

const GuideDashboard: React.FC<GuideDashboardProps> = ({ user, onLogout }) => {
  const [currentUser, setCurrentUser] = useState<GuideUser>(user);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Profile Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    bio: user.bio,
    image: user.image,
    specialties: user.specialties
  });

  const toggleStatus = async () => {
    setStatusLoading(true);
    const newStatus = !currentUser.isAvailable;
    await db.updateGuideStatus(currentUser.id, newStatus);
    setCurrentUser({ ...currentUser, isAvailable: newStatus });
    setStatusLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await db.updateGuideProfile(currentUser.id, editForm);
    if (updated) {
        setCurrentUser(updated);
        setIsEditing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
         <header className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Briefcase className="h-8 w-8 text-blue-500" />
                    Guide Portal
                </h1>
                <p className="text-slate-400">Manage your profile and availability</p>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <img src={currentUser.image} alt={currentUser.name} className="w-10 h-10 rounded-full border border-white/20" />
                    <span className="text-white font-bold">{currentUser.name}</span>
                </div>
                <button onClick={onLogout} className="text-slate-400 hover:text-white underline">Logout</button>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* STATUS CARD */}
            <div className="glass-card p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-purple-400" /> Availability Status
                </h3>
                
                <div className="flex items-center justify-between bg-slate-800/50 p-6 rounded-xl border border-white/5">
                    <div>
                        <p className={`text-lg font-bold mb-1 ${currentUser.isAvailable ? 'text-green-400' : 'text-slate-400'}`}>
                            {currentUser.isAvailable ? 'On Duty (Available)' : 'Off Duty (Invisible)'}
                        </p>
                        <p className="text-sm text-slate-500">
                            {currentUser.isAvailable ? 'Visitors can find and message you.' : 'You will be hidden from search results.'}
                        </p>
                    </div>
                    <button 
                        onClick={toggleStatus} 
                        disabled={statusLoading}
                        className={`p-2 rounded-full transition-colors ${currentUser.isAvailable ? 'text-green-400 hover:text-green-300' : 'text-slate-500 hover:text-slate-400'}`}
                    >
                        {currentUser.isAvailable ? <ToggleRight className="h-12 w-12" /> : <ToggleLeft className="h-12 w-12" />}
                    </button>
                </div>
            </div>

            {/* STATS CARD */}
            <div className="glass-card p-6 rounded-2xl border border-white/10">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" /> Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-white mb-1">{currentUser.rating}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Rating</div>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl text-center">
                        <div className="text-3xl font-bold text-white mb-1">{currentUser.reviews.length}</div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Reviews</div>
                    </div>
                </div>
            </div>

            {/* CHAT PREVIEW (Mock) */}
            <div className="glass-card p-6 rounded-2xl border border-white/10 md:col-span-2">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-400" /> Recent Messages
                </h3>
                <div className="space-y-4">
                    <div className="p-8 text-center border-2 border-dashed border-slate-700/50 rounded-xl">
                        <p className="text-slate-500">No active chats at the moment.</p>
                        <button className="mt-4 text-blue-400 text-sm hover:underline">View Archived Messages</button>
                    </div>
                </div>
            </div>

             {/* PROFILE CARD */}
             <div className="glass-card p-6 rounded-2xl border border-white/10 md:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="h-5 w-5 text-slate-400" /> 
                        {isEditing ? 'Edit Profile' : 'Profile Details'}
                    </h3>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors ${isEditing ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                    >
                        {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                    </button>
                </div>
                
                {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Display Name</label>
                            <input 
                                type="text" 
                                value={editForm.name}
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Profile Image URL</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={editForm.image}
                                    onChange={e => setEditForm({...editForm, image: e.target.value})}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white"
                                    placeholder="https://..."
                                />
                                <div className="w-12 h-12 rounded-lg bg-slate-800 shrink-0 overflow-hidden">
                                     <img src={editForm.image || user.image} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-slate-500 mb-1">Bio</label>
                             <textarea 
                                value={editForm.bio}
                                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white h-24"
                             />
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-slate-500 mb-1">Specialties</label>
                             <input 
                                type="text" 
                                value={editForm.specialties.join(', ')}
                                onChange={e => setEditForm({...editForm, specialties: e.target.value.split(',').map(s => s.trim())})}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white"
                                placeholder="History, Food, Culture"
                            />
                            <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
                        </div>
                        <div className="pt-2">
                            <button 
                                type="submit" 
                                className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500 transition shadow-lg"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 mb-6">
                             <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl">
                                <img src={currentUser.image} alt={currentUser.name} className="w-full h-full object-cover" />
                             </div>
                             <div>
                                 <h2 className="text-2xl font-bold text-white">{currentUser.name}</h2>
                                 <p className="text-blue-400 font-medium">Verified Guide</p>
                             </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Bio</label>
                            <p className="text-slate-300 bg-slate-900/50 p-4 rounded-lg leading-relaxed">{currentUser.bio}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-500 mb-1">Specialties</label>
                            <div className="flex gap-2 flex-wrap">
                                {currentUser.specialties.map(s => (
                                    <span key={s} className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm border border-slate-600 shadow-sm">{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    </div>
  );
};

export default GuideDashboard;
