
import React, { useState } from 'react';
import { Match, Team, MatchType, MatchStatus, Inning, Player } from '../types';

interface MatchListProps {
  matches: Match[];
  teams: Team[];
  players: Player[];
  onAddMatch: (match: Match) => void;
  onDeleteMatch: (id: string) => void;
  onSelectMatch: (id: string) => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, teams, players, onAddMatch, onDeleteMatch, onSelectMatch }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'STANDARD' | 'INDIVIDUAL'>('STANDARD');
  const [formData, setFormData] = useState({
    teamAId: teams[0]?.id || '',
    teamBId: teams[1]?.id || '',
    venue: '',
    date: new Date().toISOString().split('T')[0],
    type: MatchType.T20,
    maxOvers: 20,
    teamARoster: [] as string[],
    teamBRoster: [] as string[],
    playerPool: [] as string[]
  });

  const teamAPlayers = players.filter(p => p.teamId === formData.teamAId);
  const teamBPlayers = players.filter(p => p.teamId === formData.teamBId);

  const togglePlayerSelection = (team: 'A' | 'B' | 'POOL', playerId: string) => {
    let key: 'teamARoster' | 'teamBRoster' | 'playerPool';
    if (team === 'A') key = 'teamARoster';
    else if (team === 'B') key = 'teamBRoster';
    else key = 'playerPool';

    const current = formData[key];
    const updated = current.includes(playerId)
      ? current.filter(id => id !== playerId)
      : [...current, playerId];
    setFormData({ ...formData, [key]: updated });
  };

  const movePlayer = (team: 'A' | 'B' | 'POOL', index: number, direction: 'UP' | 'DOWN') => {
    let key: 'teamARoster' | 'teamBRoster' | 'playerPool';
    if (team === 'A') key = 'teamARoster';
    else if (team === 'B') key = 'teamBRoster';
    else key = 'playerPool';

    const newRoster = [...formData[key]];
    const newIndex = direction === 'UP' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newRoster.length) return;

    const [removed] = newRoster.splice(index, 1);
    newRoster.splice(newIndex, 0, removed);
    setFormData({ ...formData, [key]: newRoster });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === 'STANDARD' && (formData.teamARoster.length === 0 || formData.teamBRoster.length === 0)) {
        alert("Please select at least one player for each team.");
        return;
    }
    if (modalType === 'INDIVIDUAL' && formData.playerPool.length === 0) {
        alert("Please select at least one player for the individual pool.");
        return;
    }
    
    const inningA: Inning = {
      battingTeamId: modalType === 'INDIVIDUAL' ? 'IND_TEAM' : formData.teamAId,
      bowlingTeamId: modalType === 'INDIVIDUAL' ? 'IND_TEAM' : formData.teamBId,
      totalRuns: 0,
      totalWickets: 0,
      oversCompleted: 0,
      ballsInCurrentOver: 0,
      history: [],
      batsmenStats: {},
      bowlersStats: {}
    };
    const inningB: Inning = { ...inningA, battingTeamId: inningA.bowlingTeamId, bowlingTeamId: inningA.battingTeamId };

    const newMatch: Match = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      type: modalType === 'INDIVIDUAL' ? MatchType.INDIVIDUAL : formData.type,
      status: MatchStatus.UPCOMING,
      innings: [inningA, inningB],
      currentInningIndex: 0
    };

    onAddMatch(newMatch);
    setShowAddModal(false);
    setFormData({
      ...formData,
      teamARoster: [],
      teamBRoster: [],
      playerPool: [],
      venue: ''
    });
  };

  const openModal = (type: 'STANDARD' | 'INDIVIDUAL') => {
    setModalType(type);
    setShowAddModal(true);
  };

  const renderRosterConfig = (team: 'A' | 'B' | 'POOL') => {
    const key = team === 'A' ? 'teamARoster' : team === 'B' ? 'teamBRoster' : 'playerPool';
    const roster = formData[key];
    const sourcePlayers = team === 'A' ? teamAPlayers : team === 'B' ? teamBPlayers : players;
    
    return (
      <div className="space-y-4">
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
          <h4 className="text-[9px] font-black text-slate-900 uppercase mb-3 tracking-widest text-center">
            {team === 'POOL' ? 'Step 1: Select Players' : `Step 1: Squad Selection (${team})`}
          </h4>
          <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1.5 custom-scrollbar">
            {sourcePlayers.map(player => (
              <label key={player.id} className="flex items-center space-x-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-600 transition-all">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border border-slate-400 text-emerald-600 focus:ring-emerald-500"
                  checked={roster.includes(player.id)}
                  onChange={() => togglePlayerSelection(team, player.id)}
                />
                <span className="text-[11px] font-black text-slate-900 truncate">{player.name}</span>
              </label>
            ))}
          </div>
        </div>

        {roster.length > 0 && (
          <div className="bg-emerald-100 p-4 rounded-2xl border-2 border-emerald-400 shadow-sm">
            <h4 className="text-[9px] font-black text-emerald-900 uppercase mb-3 tracking-[0.2em] text-center">
              Step 2: Batting Sequence
            </h4>
            <div className="space-y-2">
              {roster.map((pid, idx) => {
                const p = players.find(player => player.id === pid);
                return (
                  <div key={pid} className="flex items-center space-x-2 p-2 bg-white rounded-xl shadow-sm border border-emerald-200">
                    <span className="w-6 h-6 bg-emerald-700 text-white rounded-full flex items-center justify-center font-black text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="flex-1 font-black text-slate-950 text-[10px] truncate">{p?.name}</span>
                    <div className="flex space-x-1">
                      <button type="button" disabled={idx === 0} onClick={() => movePlayer(team, idx, 'UP')} className={`p-1 rounded font-black text-[9px] transition-all ${idx === 0 ? 'text-slate-300' : 'text-emerald-900 bg-emerald-200 hover:bg-emerald-300 active:scale-90 border border-emerald-400'}`}>▲</button>
                      <button type="button" disabled={idx === roster.length - 1} onClick={() => movePlayer(team, idx, 'DOWN')} className={`p-1 rounded font-black text-[9px] transition-all ${idx === roster.length - 1 ? 'text-slate-300' : 'text-emerald-900 bg-emerald-200 hover:bg-emerald-300 active:scale-90 border border-emerald-400'}`}>▼</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm gap-4">
        <div className="flex space-x-3">
           <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Season</div>
           <div className="w-px h-5 bg-slate-100"></div>
           <div className="text-xs font-bold text-slate-900">{matches.length} Scheduled Matches</div>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => openModal('STANDARD')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center space-x-2 uppercase">
            <span>🏏 SQUAD MATCH</span>
          </button>
          <button onClick={() => openModal('INDIVIDUAL')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center space-x-2 uppercase">
            <span>🎮 INDIVIDUAL MODE</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map(match => {
          const tA = teams.find(t => t.id === match.teamAId);
          const tB = teams.find(t => t.id === match.teamBId);
          const isIndividual = match.type === MatchType.INDIVIDUAL;

          return (
            <div key={match.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-sm border ${match.status === 'Live' ? 'bg-rose-50 text-rose-600 border-rose-100' : match.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                    {match.status}
                  </div>
                  <button onClick={() => onDeleteMatch(match.id)} className="text-gray-200 hover:text-rose-500 transition-colors text-sm">🗑️</button>
                </div>
                
                {isIndividual ? (
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner mb-3 group-hover:scale-105 transition-transform">🏆</div>
                    <span className="font-black text-slate-900 text-sm uppercase tracking-widest text-center leading-none">FUN MODE</span>
                    <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase">{match.playerPool?.length} INDIVIDUALS</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between space-x-2 mb-6">
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-300 shadow-inner mb-2 group-hover:scale-105 transition-transform">{tA?.shortName.slice(0, 1)}</div>
                      <span className="font-black text-slate-900 text-[10px] truncate w-full text-center uppercase tracking-widest">{tA?.shortName}</span>
                    </div>
                    <div className="text-[9px] font-black text-slate-200 italic uppercase">VS</div>
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl font-black text-slate-300 shadow-inner mb-2 group-hover:scale-105 transition-transform">{tB?.shortName.slice(0, 1)}</div>
                      <span className="font-black text-slate-900 text-[10px] truncate w-full text-center uppercase tracking-widest">{tB?.shortName}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-6">
                   <div className="bg-slate-50 p-2 rounded-xl">
                      <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Venue</p>
                      <p className="text-[9px] font-black text-slate-700 truncate">{match.venue}</p>
                   </div>
                   <div className="bg-slate-50 p-2 rounded-xl">
                      <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Format</p>
                      <p className="text-[9px] font-black text-slate-700 uppercase">{match.type}</p>
                   </div>
                </div>

                <button onClick={() => onSelectMatch(match.id)} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-lg">
                  {match.status === 'Upcoming' ? 'ACTIVATE ENGINE' : 'ENTER COMMANDER'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl my-4 p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black mb-1 text-slate-950 tracking-tighter text-center">
              {modalType === 'INDIVIDUAL' ? 'DEPLOY INDIVIDUAL MATCH ENGINE' : 'MATCH DEPLOYMENT MODULE'}
            </h2>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-8 text-center">
              Configure venue and lineup parameters
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-yellow-400 p-6 rounded-[2.5rem] border-[8px] border-black shadow-xl transform hover:scale-[1.01] transition-all">
                <label className="block text-[10px] font-black text-black uppercase tracking-[0.3em] mb-3 text-center">
                  ⚠️ ACTION REQUIRED: INPUT SANCTIONED VENUE ⚠️
                </label>
                <input type="text" className="w-full bg-white border-4 border-black rounded-[2rem] p-4 focus:ring-4 focus:ring-black/10 outline-none font-black text-xl text-black shadow-lg uppercase placeholder-slate-300" placeholder="LOCATION / STADIUM NAME" required value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
              </div>

              {modalType === 'STANDARD' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest text-center">Select Home Team (Alpha)</label>
                    <select className="w-full bg-slate-100 border-2 border-slate-300 rounded-2xl p-3 focus:ring-4 focus:ring-emerald-500/20 outline-none font-black text-sm text-slate-950 shadow-inner" value={formData.teamAId} onChange={e => setFormData({...formData, teamAId: e.target.value, teamARoster: []})}>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {renderRosterConfig('A')}
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[9px] font-black text-slate-900 uppercase tracking-widest text-center">Select Away Team (Beta)</label>
                    <select className="w-full bg-slate-100 border-2 border-slate-300 rounded-2xl p-3 focus:ring-4 focus:ring-emerald-500/20 outline-none font-black text-sm text-slate-950 shadow-inner" value={formData.teamBId} onChange={e => setFormData({...formData, teamBId: e.target.value, teamBRoster: []})}>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {renderRosterConfig('B')}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-200">
                   {renderRosterConfig('POOL')}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border-2 border-slate-100">
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Tournament Format</label>
                  <select className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-xs text-slate-950" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as MatchType})}>
                    {Object.values(MatchType).filter(m => modalType === 'INDIVIDUAL' ? m === MatchType.INDIVIDUAL : m !== MatchType.INDIVIDUAL).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Inning Limit (Overs)</label>
                  <input type="number" className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-xs text-slate-950" value={formData.maxOvers} onChange={e => setFormData({...formData, maxOvers: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-200 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-300 transition-all active:translate-y-1">ABORT MISSION</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all active:translate-y-1">ACTIVATE ENGINE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchList;
