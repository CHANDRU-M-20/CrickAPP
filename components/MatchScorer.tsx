
import React, { useState, useMemo, useEffect } from 'react';
import { Match, Team, Player, BallRecord, Inning, MatchType, MatchStatus } from '../types';
import { calculateOvers, getRunRate, getEconomy, getStrikeRate } from '../utils/cricketLogic';
import { getMatchSummary } from '../services/geminiService';

interface MatchScorerProps {
  match: Match;
  teams: Team[];
  players: Player[];
  onUpdateMatch: (match: Match) => void;
  onBack: () => void;
}

const MatchScorer: React.FC<MatchScorerProps> = ({ match, teams, players, onUpdateMatch, onBack }) => {
  const currentInning = match.innings[match.currentInningIndex];
  const battingTeam = teams.find(t => t.id === currentInning.battingTeamId);
  const bowlingTeam = teams.find(t => t.id === currentInning.bowlingTeamId);
  
  const isIndividual = match.type === MatchType.INDIVIDUAL;
  const matchPlayers = isIndividual ? players.filter(p => match.playerPool?.includes(p.id)) : players;

  const battingLineup = useMemo(() => {
    if (isIndividual) {
      return match.playerPool ? match.playerPool.map(id => players.find(p => p.id === id)!).filter(Boolean) : matchPlayers;
    }
    const roster = battingTeam?.id === match.teamAId ? match.teamARoster : match.teamBRoster;
    return roster ? roster.map(id => players.find(p => p.id === id)!).filter(Boolean) : players.filter(p => p.teamId === battingTeam?.id);
  }, [match, players, battingTeam, isIndividual, matchPlayers]);

  const bowlingLineup = useMemo(() => {
    if (isIndividual) {
      return match.playerPool ? match.playerPool.map(id => players.find(p => p.id === id)!).filter(Boolean) : matchPlayers;
    }
    const roster = bowlingTeam?.id === match.teamAId ? match.teamARoster : match.teamBRoster;
    return roster ? roster.map(id => players.find(p => p.id === id)!).filter(Boolean) : players.filter(p => p.teamId === bowlingTeam?.id);
  }, [match, players, bowlingTeam, isIndividual, matchPlayers]);

  // Scorer State
  const [onStrikeId, setOnStrikeId] = useState<string>(battingLineup[0]?.id || '');
  const [offStrikeId, setOffStrikeId] = useState<string | null>(battingLineup[1]?.id || null);
  const [bowlerId, setBowlerId] = useState<string>(bowlingLineup[bowlingLineup.length - 1]?.id || '');
  
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showRoleEdit, setShowRoleEdit] = useState(false);

  const fetchAiSummary = async () => {
    setIsGeneratingAi(true);
    const summary = await getMatchSummary({
      type: match.type,
      score: `${currentInning.totalRuns}/${currentInning.totalWickets}`,
      overs: calculateOvers(currentInning.oversCompleted * 6 + currentInning.ballsInCurrentOver),
      onStrike: players.find(p => p.id === onStrikeId)?.name,
      offStrike: offStrikeId ? players.find(p => p.id === offStrikeId)?.name : 'N/A',
      bowler: players.find(p => p.id === bowlerId)?.name
    });
    setAiSummary(summary);
    setIsGeneratingAi(false);
  };

  const getNextAvailablePlayer = (excludeIds: (string|null)[], inning: Inning, pool: Player[]) => {
    const activeExcludes = excludeIds.filter(Boolean);
    return pool.find(p => !activeExcludes.includes(p.id) && !inning.batsmenStats[p.id]?.isOut);
  };

  const getNextBowlerId = (currentId: string, lineup: Player[], excludeIds: (string|null)[]) => {
    const activeExcludes = excludeIds.filter(Boolean);
    let idx = lineup.findIndex(p => p.id === currentId);
    for (let i = 1; i <= lineup.length; i++) {
      const nextIdx = (idx - i + lineup.length) % lineup.length;
      const candidate = lineup[nextIdx];
      if (!activeExcludes.includes(candidate.id)) return candidate.id;
    }
    return currentId;
  };

  const recordBall = (runs: number, isWicket: boolean, isExtra: boolean, extraType?: any) => {
    if (match.status === MatchStatus.COMPLETED) return;

    const updatedMatch = { ...match, status: MatchStatus.LIVE };
    const inning = updatedMatch.innings[updatedMatch.currentInningIndex];
    
    const ball: BallRecord = {
      runs,
      isWicket,
      isExtra,
      extraType,
      batsmanId: onStrikeId,
      bowlerId: bowlerId,
    };

    inning.history.push(ball);
    inning.totalRuns += (runs + (isExtra && (extraType === 'wide' || extraType === 'no-ball') ? 1 : 0));
    
    if (!inning.batsmenStats[onStrikeId]) {
      inning.batsmenStats[onStrikeId] = { runs: 0, balls: 0, boundaries: { fours: 0, sixes: 0 }, isOut: false };
    }
    if (!isExtra || extraType === 'bye' || extraType === 'leg-bye') {
      inning.batsmenStats[onStrikeId].runs += runs;
      inning.batsmenStats[onStrikeId].balls += 1;
      if (runs === 4) inning.batsmenStats[onStrikeId].boundaries.fours += 1;
      if (runs === 6) inning.batsmenStats[onStrikeId].boundaries.sixes += 1;
    }

    if (isWicket) {
      inning.totalWickets += 1;
      inning.batsmenStats[onStrikeId].isOut = true;
    }

    if (!inning.bowlersStats[bowlerId]) {
      inning.bowlersStats[bowlerId] = { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0 };
    }
    if (!isExtra || extraType === 'no-ball') inning.bowlersStats[bowlerId].runs += runs;
    if (isExtra && (extraType === 'wide' || extraType === 'no-ball')) inning.bowlersStats[bowlerId].runs += 1;
    if (isWicket) inning.bowlersStats[bowlerId].wickets += 1;

    if (!isExtra || extraType === 'bye' || extraType === 'leg-bye') {
      inning.ballsInCurrentOver += 1;
      inning.bowlersStats[bowlerId].balls += 1;
      
      if (runs % 2 !== 0 && offStrikeId) {
        const temp = onStrikeId;
        setOnStrikeId(offStrikeId);
        setOffStrikeId(temp);
      }

      if (inning.ballsInCurrentOver === 6) {
        inning.oversCompleted += 1;
        inning.ballsInCurrentOver = 0;
        inning.bowlersStats[bowlerId].overs += 1;
        inning.bowlersStats[bowlerId].balls = 0;
        
        if (offStrikeId) {
          const temp = onStrikeId;
          setOnStrikeId(offStrikeId);
          setOffStrikeId(temp);
        }

        if (isIndividual) {
          setBowlerId(getNextBowlerId(bowlerId, bowlingLineup, [onStrikeId, offStrikeId]));
        }

        if (inning.oversCompleted >= match.maxOvers) updatedMatch.status = MatchStatus.COMPLETED;
      }
    }

    if (isWicket) {
      if (isIndividual) {
        setBowlerId(getNextBowlerId(bowlerId, bowlingLineup, [onStrikeId, offStrikeId]));
      }

      const totalAvailable = battingLineup.length;
      if (inning.totalWickets >= totalAvailable) {
        updatedMatch.status = MatchStatus.COMPLETED;
      } else {
        const nextP = getNextAvailablePlayer([onStrikeId, offStrikeId], inning, battingLineup);
        if (nextP) {
          setOnStrikeId(nextP.id);
        } else {
          if (!offStrikeId) {
             updatedMatch.status = MatchStatus.COMPLETED;
          } else {
             setOnStrikeId(offStrikeId);
             setOffStrikeId(null);
          }
        }
      }
    }

    onUpdateMatch(updatedMatch);
  };

  const onStrikePlayer = players.find(p => p.id === onStrikeId);
  const offStrikePlayer = offStrikeId ? players.find(p => p.id === offStrikeId) : null;
  const bowlerPlayer = players.find(p => p.id === bowlerId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 bg-white hover:bg-slate-50 rounded-xl shadow-sm transition-all border border-slate-200">←</button>
          <div>
            <h2 className="text-lg font-black text-slate-950 flex items-center">
              {battingTeam?.name} <span className="mx-2 text-slate-300">VS</span> {bowlingTeam?.name}
            </h2>
            <div className="flex gap-2 mt-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">{match.type}</span>
              <span className={`text-[9px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full ${match.status === MatchStatus.LIVE ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>{match.status}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
           <button 
            onClick={() => setShowRoleEdit(!showRoleEdit)}
            className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 border-b-4 active:border-b-0 active:translate-y-1 ${showRoleEdit ? 'bg-rose-600 text-white border-rose-800' : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-600'}`}
          >
            {showRoleEdit ? '🔒 LOCK ROLES' : '📝 EDIT MATCH ROLES'}
          </button>
        </div>
      </div>

      {showRoleEdit && (
        <div className="bg-yellow-400 border-[6px] border-black p-6 rounded-[2.5rem] shadow-xl animate-in slide-in-from-top-4 duration-500 transform hover:scale-[1.01]">
          <h4 className="font-black text-black text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center justify-center bg-white border-2 border-black py-2 rounded-xl shadow-sm">
            <span className="mr-3 text-xl">☢️</span> ROLE OVERRIDE INTERFACE <span className="ml-3 text-xl">☢️</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-lg">
                <label className="text-[9px] font-black text-black uppercase mb-2 block text-center tracking-[0.2em]">ASSIGN ON-STRIKE</label>
                <select value={onStrikeId} onChange={(e) => setOnStrikeId(e.target.value)} className="w-full bg-slate-50 border-2 border-black rounded-xl p-2 text-[10px] font-black text-black shadow-inner">
                  {battingLineup.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>
             <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-lg">
                <label className="text-[9px] font-black text-black uppercase mb-2 block text-center tracking-[0.2em]">ASSIGN OFF-STRIKE</label>
                <select value={offStrikeId || ''} onChange={(e) => setOffStrikeId(e.target.value || null)} className="w-full bg-slate-50 border-2 border-black rounded-xl p-2 text-[10px] font-black text-black shadow-inner">
                  <option value="">(OPTIONAL) NONE</option>
                  {battingLineup.filter(p => p.id !== onStrikeId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>
             <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-lg">
                <label className="text-[9px] font-black text-black uppercase mb-2 block text-center tracking-[0.2em]">ASSIGN BOWLER</label>
                <select value={bowlerId} onChange={(e) => setBowlerId(e.target.value)} className="w-full bg-slate-50 border-2 border-black rounded-xl p-2 text-[10px] font-black text-black shadow-inner">
                  {bowlingLineup.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>
          </div>
        </div>
      )}

      {match.status === MatchStatus.COMPLETED && (
        <div className="bg-emerald-600 text-white p-6 rounded-[2rem] shadow-xl text-center border-b-[8px] border-emerald-900 animate-in fade-in zoom-in duration-500">
           <h3 className="text-xl font-black mb-1 uppercase tracking-tighter">Match Finalized</h3>
           <p className="font-black text-[10px] opacity-90 mb-4 uppercase tracking-[0.2em]">Official Results Recorded</p>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <p className="text-[7px] uppercase font-black opacity-70 mb-1">Runs</p>
                <p className="text-base font-black">{currentInning.totalRuns}</p>
              </div>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <p className="text-[7px] uppercase font-black opacity-70 mb-1">Wkts</p>
                <p className="text-base font-black">{currentInning.totalWickets}</p>
              </div>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <p className="text-[7px] uppercase font-black opacity-70 mb-1">Overs</p>
                <p className="text-base font-black">{calculateOvers(currentInning.oversCompleted * 6 + currentInning.ballsInCurrentOver)}</p>
              </div>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <p className="text-[7px] uppercase font-black opacity-70 mb-1">RR</p>
                <p className="text-base font-black">{getRunRate(currentInning.totalRuns, currentInning.oversCompleted * 6 + currentInning.ballsInCurrentOver)}</p>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Scorecard */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-black text-white p-6 rounded-[2rem] shadow-2xl relative overflow-hidden border-b-[8px] border-indigo-900">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-[6rem] font-black select-none pointer-events-none tracking-tighter">SCORE</div>
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[7px] mb-1">Live Tracking</p>
                    <div className="flex items-baseline space-x-1">
                      <h3 className="text-4xl font-black tracking-tighter">{currentInning.totalRuns}</h3>
                      <span className="text-2xl font-black text-slate-700">/</span>
                      <h3 className="text-3xl font-black text-rose-500">{currentInning.totalWickets}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-[7px] font-black uppercase tracking-[0.2em] mb-1">Overs</p>
                    <p className="text-2xl font-black">{calculateOvers(currentInning.oversCompleted * 6 + currentInning.ballsInCurrentOver)} <span className="text-slate-700 text-lg tracking-tighter">/ {match.maxOvers}</span></p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <img src={onStrikePlayer?.imageUrl || `https://picsum.photos/seed/${onStrikeId}/40`} className="w-8 h-8 rounded-lg object-cover" alt="" />
                        <div>
                          <p className="font-black text-[7px] text-indigo-300 uppercase tracking-widest">ON-STRIKE*</p>
                          <p className="font-black text-xs text-white truncate">{onStrikePlayer?.name || '...'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-white">{currentInning.batsmenStats[onStrikeId]?.runs || 0}</p>
                        <p className="text-[7px] font-black text-slate-500">({currentInning.batsmenStats[onStrikeId]?.balls || 0} B)</p>
                      </div>
                    </div>
                    {offStrikePlayer && (
                      <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                        <div className="flex items-center space-x-2">
                          <img src={offStrikePlayer.imageUrl || `https://picsum.photos/seed/${offStrikeId}/40`} className="w-6 h-6 rounded-md object-cover opacity-60" alt="" />
                          <p className="font-black text-[10px] text-slate-300 tracking-wide">{offStrikePlayer.name}</p>
                        </div>
                        <p className="font-black text-base text-slate-400">{currentInning.batsmenStats[offStrikeId!]?.runs || 0} <span className="text-[7px] font-bold">({currentInning.batsmenStats[offStrikeId!]?.balls || 0})</span></p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10 shadow-lg">
                      <div className="flex items-center space-x-2">
                        <img src={bowlerPlayer?.imageUrl || `https://picsum.photos/seed/${bowlerId}/40`} className="w-8 h-8 rounded-lg object-cover" alt="" />
                        <div>
                          <p className="font-black text-[7px] text-rose-300 uppercase tracking-widest">BOWLING</p>
                          <p className="font-black text-xs text-white truncate">{bowlerPlayer?.name || '...'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-white">{currentInning.bowlersStats[bowlerId]?.wickets || 0}</p>
                        <p className="text-[7px] font-black text-slate-500">WKT</p>
                      </div>
                    </div>
                  </div>
               </div>
             </div>
          </div>

          {/* Execution Panel */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em]">Scoring Console</h4>
              <button 
                onClick={() => offStrikeId && setOnStrikeId(offStrikeId)} 
                disabled={!offStrikeId || match.status === MatchStatus.COMPLETED}
                className={`text-[8px] font-black px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest border-b-2 active:border-b-0 active:translate-y-1 ${offStrikeId ? 'text-indigo-700 bg-indigo-50 border-indigo-200' : 'bg-slate-50 text-slate-300 opacity-50'}`}
              >
                🔄 Strike Flip
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 6].map(run => (
                <button 
                  key={run} 
                  disabled={match.status === MatchStatus.COMPLETED}
                  onClick={() => recordBall(run, false, false)}
                  className={`h-12 rounded-xl border font-black text-base transition-all active:scale-95 flex flex-col items-center justify-center border-b-2 active:border-b-0 active:translate-y-1 ${
                    run === 4 ? 'border-emerald-600 bg-emerald-50 text-emerald-700' :
                    run === 6 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' :
                    'border-slate-300 bg-slate-50 text-slate-800'
                  } disabled:opacity-20`}
                >
                  {run}
                  <span className="text-[6px] opacity-60 uppercase tracking-widest font-black">{run === 1 ? 'Single' : run === 4 ? 'Four' : run === 6 ? 'Six' : 'Dot'}</span>
                </button>
              ))}
              <button 
                disabled={match.status === MatchStatus.COMPLETED}
                onClick={() => recordBall(0, true, false)} 
                className="h-12 rounded-xl bg-rose-600 text-white font-black text-[9px] col-span-2 border-b-2 border-rose-900 active:border-b-0 active:translate-y-1 disabled:opacity-20"
              >
                DISMISSAL
              </button>
              <button 
                disabled={match.status === MatchStatus.COMPLETED}
                onClick={() => recordBall(0, false, true, 'wide')} 
                className="h-12 rounded-xl bg-amber-400 text-black font-black text-[9px] col-span-2 border-b-2 border-amber-600 active:border-b-0 active:translate-y-1 disabled:opacity-20"
              >
                WIDE (+1)
              </button>
            </div>
          </div>

          {/* SQUAD PERFORMANCE MATRIX (Live Table) */}
          <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
             <div className="bg-slate-900 px-4 py-3 flex justify-between items-center">
               <h4 className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Squad Performance Matrix</h4>
               <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">● Live Engine</span>
             </div>
             <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="px-4 py-2 text-[8px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Player</th>
                     <th colSpan={4} className="px-4 py-2 text-[8px] font-black text-indigo-600 uppercase tracking-widest text-center bg-indigo-50/30 border-r border-slate-100">Batting</th>
                     <th colSpan={4} className="px-4 py-2 text-[8px] font-black text-rose-600 uppercase tracking-widest text-center bg-rose-50/30">Bowling</th>
                   </tr>
                   <tr className="bg-slate-50/50 border-b border-slate-100 text-[7px] font-black text-slate-400 uppercase tracking-tighter">
                     <th className="px-4 py-1.5 border-r border-slate-100">Identities</th>
                     <th className="px-1.5 py-1.5 text-center">R</th>
                     <th className="px-1.5 py-1.5 text-center">B</th>
                     <th className="px-1.5 py-1.5 text-center">4/6</th>
                     <th className="px-1.5 py-1.5 text-center border-r border-slate-100">SR</th>
                     <th className="px-1.5 py-1.5 text-center">O</th>
                     <th className="px-1.5 py-1.5 text-center">W</th>
                     <th className="px-1.5 py-1.5 text-center">R</th>
                     <th className="px-1.5 py-1.5 text-center">ECN</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {battingLineup.map(p => {
                     const b = currentInning.batsmenStats[p.id] || { runs: 0, balls: 0, boundaries: { fours: 0, sixes: 0 }, isOut: false };
                     const bw = currentInning.bowlersStats[p.id] || { overs: 0, balls: 0, runs: 0, wickets: 0 };
                     const hasBatted = b.balls > 0;
                     const hasBowled = (bw.overs * 6 + bw.balls) > 0;

                     return (
                       <tr key={p.id} className={`hover:bg-slate-50/50 transition-all ${p.id === onStrikeId ? 'bg-indigo-50/20' : ''}`}>
                         <td className="px-4 py-2 border-r border-slate-100">
                           <div className="flex items-center space-x-2">
                             <img src={p.imageUrl || `https://picsum.photos/seed/${p.id}/30`} className="w-5 h-5 rounded-md object-cover" alt="" />
                             <span className={`text-[9px] font-black uppercase tracking-tighter ${b.isOut ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                               {p.name.split(' ').slice(0, 2).join(' ')}
                               {p.id === onStrikeId && <span className="text-indigo-600 ml-1">*</span>}
                             </span>
                           </div>
                         </td>
                         <td className={`px-1.5 py-2 text-center text-[10px] font-black ${hasBatted ? 'text-slate-900' : 'text-slate-200'}`}>{hasBatted ? b.runs : '—'}</td>
                         <td className={`px-1.5 py-2 text-center text-[9px] font-bold ${hasBatted ? 'text-slate-500' : 'text-slate-200'}`}>{hasBatted ? b.balls : '—'}</td>
                         <td className={`px-1.5 py-2 text-center text-[8px] font-black ${hasBatted ? 'text-indigo-400' : 'text-slate-200'}`}>{hasBatted ? `${b.boundaries.fours}/${b.boundaries.sixes}` : '—'}</td>
                         <td className={`px-1.5 py-2 text-center text-[8px] font-black border-r border-slate-100 ${hasBatted ? 'text-slate-600' : 'text-slate-200'}`}>{hasBatted ? getStrikeRate(b.runs, b.balls) : '—'}</td>
                         <td className={`px-1.5 py-2 text-center text-[10px] font-black ${hasBowled ? 'text-slate-900' : 'text-slate-200'}`}>{hasBowled ? calculateOvers(bw.overs * 6 + bw.balls) : '—'}</td>
                         <td className={`px-1.5 py-2 text-center text-[9px] font-black ${hasBowled ? 'text-rose-600' : 'text-slate-200'}`}>{hasBowled ? bw.wickets : '—'}</td>
                         <td className={`px-1.5 py-2 text-center text-[9px] font-bold ${hasBowled ? 'text-slate-500' : 'text-slate-200'}`}>{hasBowled ? bw.runs : '—'}</td>
                         <td className={`px-1.5 py-2 text-center text-[8px] font-black ${hasBowled ? 'text-slate-600' : 'text-slate-200'}`}>{hasBowled ? getEconomy(bw.runs, bw.overs * 6 + bw.balls) : '—'}</td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <div className="bg-indigo-700 p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden group border-b-4 border-indigo-950">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></span>
                    <h4 className="font-black text-[8px] uppercase tracking-[0.3em]">CRIC-IQ</h4>
                  </div>
                </div>
                {isGeneratingAi ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-2.5 bg-white/20 rounded-full w-full"></div>
                    <div className="h-2.5 bg-white/20 rounded-full w-4/5"></div>
                  </div>
                ) : (
                  <p className="text-[10px] leading-relaxed mb-4 font-bold text-indigo-50 italic opacity-95">
                    {aiSummary || "Strategic match intelligence core online."}
                  </p>
                )}
                <button 
                  onClick={fetchAiSummary}
                  disabled={isGeneratingAi}
                  className="w-full py-2 bg-white text-indigo-900 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95"
                >
                  {isGeneratingAi ? "LINKING..." : "REPORT"}
                </button>
              </div>
           </div>

           <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
             <h4 className="font-black text-slate-950 text-[8px] uppercase tracking-[0.3em] mb-4 text-center bg-slate-100 py-1.5 rounded-lg">Match Analytics</h4>
             <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Sanctioned Venue</p>
                   <p className="text-[10px] font-black text-slate-950 truncate leading-tight uppercase">{match.venue}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Live Run Rate</p>
                  <p className="text-2xl font-black text-slate-950 tracking-tighter">{getRunRate(currentInning.totalRuns, currentInning.oversCompleted * 6 + currentInning.ballsInCurrentOver)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Projection</p>
                  <p className="text-2xl font-black text-indigo-700 tracking-tighter">{(parseFloat(getRunRate(currentInning.totalRuns, currentInning.oversCompleted * 6 + currentInning.ballsInCurrentOver)) * match.maxOvers).toFixed(0)} <span className="text-[8px] font-black text-slate-400">RUNS</span></p>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MatchScorer;
