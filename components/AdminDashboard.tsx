
import React, { useState, useEffect } from 'react';
import { User, GuideUser, AdminUser } from '../types';
import { db } from '../services/dbService';
import { Shield, Trash2, UserX, UserCheck, Activity, Users, Search } from 'lucide-react';

interface AdminDashboardProps {
  user: AdminUser;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'guides' | 'visitors'>('guides');
  const [guides, setGuides] = useState<GuideUser[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [allGuides, allVisitors] = await Promise.all([
        db.getAllGuides(),
        db.getAllVisitors()
    ]);
    setGuides(allGuides);
    setVisitors(allVisitors);
    setIsLoading(false);
  };

  const handleToggleStatus = async (guide: GuideUser) => {
    await db.updateGuideStatus(guide.id, !guide.isAvailable);
    loadData(); // Reload all
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
        await db.deleteUser(userId);
        loadData();
    }
  };

  const filteredGuides = guides.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredVisitors = visitors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="flex justify-between items-center mb-10">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Shield className="h-8 w-8 text-red-500" />
                    Admin Portal
                </h1>
                <p className="text-slate-400">Welcome back, {user.name}</p>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-white underline">Logout</button>
        </header>

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400"><Users className="h-6 w-6" /></div>
                    <span className="text-slate-400 font-bold">Total Guides</span>
                </div>
                <p className="text-3xl font-bold text-white">{guides.length}</p>
            </div>
            <div className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400"><Users className="h-6 w-6" /></div>
                    <span className="text-slate-400 font-bold">Total Visitors</span>
                </div>
                <p className="text-3xl font-bold text-white">{visitors.length}</p>
            </div>
             <div className="bg-slate-800/50 border border-white/5 p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-lg bg-green-500/20 text-green-400"><Activity className="h-6 w-6" /></div>
                    <span className="text-slate-400 font-bold">System Status</span>
                </div>
                <p className="text-lg font-bold text-green-400">Operational</p>
            </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-4">
                     <button 
                        onClick={() => setActiveTab('guides')}
                        className={`text-xl font-bold transition-colors ${activeTab === 'guides' ? 'text-white border-b-2 border-blue-500' : 'text-slate-500'}`}
                     >
                        Manage Guides
                     </button>
                     <button 
                        onClick={() => setActiveTab('visitors')}
                        className={`text-xl font-bold transition-colors ${activeTab === 'visitors' ? 'text-white border-b-2 border-purple-500' : 'text-slate-500'}`}
                     >
                        Manage Visitors
                     </button>
                </div>
                
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={`Search ${activeTab}...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                            <th className="p-4">Name</th>
                            <th className="p-4">ID</th>
                            {activeTab === 'guides' && <th className="p-4">Status</th>}
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading data...</td></tr>
                        ) : activeTab === 'guides' ? (
                            filteredGuides.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">No guides found.</td></tr> :
                            filteredGuides.map(guide => (
                                <tr key={guide.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={guide.image} alt={guide.name} className="w-10 h-10 rounded-full object-cover bg-slate-700" />
                                            <div>
                                                <p className="text-white font-bold">{guide.name}</p>
                                                <p className="text-xs text-slate-400">{guide.specialties.join(', ')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm">{guide.id}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${guide.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {guide.isAvailable ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleToggleStatus(guide)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" title="Toggle Availability">
                                            {guide.isAvailable ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                        </button>
                                        <button onClick={() => handleDeleteUser(guide.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Delete User">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            filteredVisitors.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">No visitors found.</td></tr> :
                            filteredVisitors.map(visitor => (
                                <tr key={visitor.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-white font-bold">{visitor.name}</td>
                                    <td className="p-4 text-slate-500 text-sm">{visitor.id}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDeleteUser(visitor.id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Delete User">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AdminDashboard;
