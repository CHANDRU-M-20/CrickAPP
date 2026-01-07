
import React, { useState } from 'react';
import { Player, Team, PlayerRole } from '../types';

interface PlayerListProps {
  players: Player[];
  teams: Team[];
  onAddPlayer: (player: Player) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, teams, onAddPlayer, onDeletePlayer }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: PlayerRole.BATSMAN,
    teamId: teams[0]?.id || '',
    imageUrl: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      stats: { matches: 0, runs: 0, ballsFaced: 0, wickets: 0, oversBowled: 0, runsConceded: 0, highScore: 0, bestBowling: '0/0' }
    };
    onAddPlayer(newPlayer);
    setShowModal(false);
    setFormData({ name: '', role: PlayerRole.BATSMAN, teamId: teams[0]?.id || '', imageUrl: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="relative w-72">
          <input type="text" placeholder="Search elite players..." className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-12 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none text-sm font-bold text-slate-950 shadow-inner" />
          <span className="absolute left-4 top-3.5 text-xl">🔍</span>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-emerald-950/20 hover:bg-emerald-700 transition-all active:scale-95 uppercase text-xs tracking-widest"
        >
          Add Player
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {players.map(player => (
          <div key={player.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group relative">
            <button 
              onClick={() => onDeletePlayer(player.id)}
              className="absolute top-6 right-6 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xl"
            >
              🗑️
            </button>
            <div className="flex flex-col items-center text-center">
              <img 
                src={player.imageUrl || `https://picsum.photos/seed/${player.id}/200`} 
                className="w-28 h-28 rounded-[2rem] object-cover mb-6 border-[6px] border-slate-50 shadow-md group-hover:scale-110 transition-transform" 
                alt={player.name} 
              />
              <h4 className="text-xl font-black text-slate-950 leading-tight mb-2 uppercase tracking-wide">{player.name}</h4>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-6 bg-emerald-50 px-4 py-1 rounded-full">{player.role}</p>
              
              <div className="w-full grid grid-cols-2 gap-4 mt-2 pt-6 border-t-2 border-slate-50">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Runs</p>
                  <p className="text-lg font-black text-slate-900">{player.stats.runs}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Wkts</p>
                  <p className="text-lg font-black text-slate-900">{player.stats.wickets}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black mb-8 text-slate-950 tracking-tighter text-center">ELITE REGISTRATION</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer">
                  <div className="w-28 h-28 bg-slate-50 rounded-[2rem] flex items-center justify-center overflow-hidden border-4 border-dashed border-slate-200 group-hover:border-emerald-600 transition-all">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <span className="text-3xl opacity-20">📷</span>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-4 font-black uppercase tracking-widest">Upload Profile Photo</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Legal Identity (Name)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-black text-slate-950 text-base"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Field Specialization (Role)</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-black text-slate-950 text-base"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as PlayerRole})}
                  >
                    {Object.values(PlayerRole).map(v => <option key={v} value={v} className="font-black text-slate-950">{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Current Affiliation (Team)</label>
                  <select 
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none font-black text-slate-950 text-base"
                    value={formData.teamId}
                    onChange={e => setFormData({...formData, teamId: e.target.value})}
                  >
                    {teams.map(t => <option key={t.id} value={t.id} className="font-black text-slate-950">{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-200 transition-all">Abort</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-950/20 hover:bg-emerald-700 transition-all active:scale-95">Enroll Player</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerList;
