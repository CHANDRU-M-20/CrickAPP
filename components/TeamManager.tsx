
import React, { useState } from 'react';
import { Team, Player } from '../types';

interface TeamManagerProps {
  teams: Team[];
  players: Player[];
  onAddTeam: (team: Team) => void;
  onDeleteTeam: (id: string) => void;
}

const TeamManager: React.FC<TeamManagerProps> = ({ teams, players, onAddTeam, onDeleteTeam }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', shortName: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTeam: Team = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      players: []
    };
    onAddTeam(newTeam);
    setShowModal(false);
    setFormData({ name: '', shortName: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-emerald-950/20 hover:bg-emerald-700 transition-all active:scale-95 uppercase text-xs tracking-widest"
        >
          Create Franchise
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teams.map(team => (
          <div key={team.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 hover:shadow-2xl transition-all group">
            <div className="flex justify-between items-start mb-8">
              <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-3xl font-black text-slate-300 shadow-inner group-hover:scale-110 transition-transform">
                {team.shortName}
              </div>
              <button onClick={() => onDeleteTeam(team.id)} className="text-gray-200 hover:text-red-500 transition-colors text-xl">🗑️</button>
            </div>
            
            <h3 className="text-2xl font-black text-slate-950 mb-1 uppercase tracking-tight">{team.name}</h3>
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-8">{team.players.length} Active Squad Members</p>
            
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Core Lineup</p>
              <div className="flex -space-x-4 overflow-hidden">
                {players.filter(p => p.teamId === team.id).slice(0, 5).map(p => (
                  <img key={p.id} className="inline-block h-12 w-12 rounded-2xl ring-4 ring-white bg-slate-100 object-cover" src={p.imageUrl || `https://picsum.photos/seed/${p.id}/100`} alt={p.name} />
                ))}
                {players.filter(p => p.teamId === team.id).length > 5 && (
                  <div className="h-12 w-12 rounded-2xl ring-4 ring-white bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                    +{players.filter(p => p.teamId === team.id).length - 5}
                  </div>
                )}
              </div>
            </div>
            
            <button className="w-full mt-10 py-4 bg-slate-100 text-slate-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-md active:scale-95">
              Squad Intelligence
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-12 shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
            <h2 className="text-3xl font-black mb-8 text-slate-950 tracking-tighter text-center">TEAM COMMISSIONING</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Official Franchise Title</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-black text-slate-950 text-base"
                  required
                  placeholder="e.g. Royal Bengal Tigers"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Identifier (Abbreviation)</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none uppercase font-black text-slate-950 text-base"
                  required
                  maxLength={4}
                  placeholder="e.g. RBT"
                  value={formData.shortName}
                  onChange={e => setFormData({...formData, shortName: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="flex space-x-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-200 transition-all">Abort</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-950/20 hover:bg-emerald-700 transition-all active:scale-95">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManager;
