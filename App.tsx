
import React, { useState, useEffect, useMemo } from 'react';
import { Match, Player, Team, MatchStatus, PlayerRole, MatchType } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import MatchList from './components/MatchList';
import PlayerList from './components/PlayerList';
import TeamManager from './components/TeamManager';
import MatchScorer from './components/MatchScorer';

const INITIAL_TEAMS: Team[] = [
  { id: 't1', name: 'Royal Challengers', shortName: 'RCB', players: ['p1', 'p2'] },
  { id: 't2', name: 'Mumbai Indians', shortName: 'MI', players: ['p3', 'p4'] },
];

const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', name: 'Virat Kohli', role: PlayerRole.BATSMAN, teamId: 't1', stats: { matches: 250, runs: 7000, ballsFaced: 5200, wickets: 4, oversBowled: 40, runsConceded: 320, highScore: 183, bestBowling: '1/12' } },
  { id: 'p2', name: 'Mohammed Siraj', role: PlayerRole.BOWLER, teamId: 't1', stats: { matches: 80, runs: 200, ballsFaced: 150, wickets: 120, oversBowled: 450, runsConceded: 2800, highScore: 25, bestBowling: '6/21' } },
  { id: 'p3', name: 'Rohit Sharma', role: PlayerRole.BATSMAN, teamId: 't2', stats: { matches: 240, runs: 6200, ballsFaced: 4800, wickets: 15, oversBowled: 60, runsConceded: 450, highScore: 264, bestBowling: '2/10' } },
  { id: 'p4', name: 'Jasprit Bumrah', role: PlayerRole.BOWLER, teamId: 't2', stats: { matches: 120, runs: 150, ballsFaced: 100, wickets: 145, oversBowled: 800, runsConceded: 4200, highScore: 34, bestBowling: '5/10' } },
];

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'matches' | 'players' | 'teams' | 'scorer'>('dashboard');
  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('cric_matches');
    return saved ? JSON.parse(saved) : [];
  });
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('cric_players');
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('cric_teams');
    return saved ? JSON.parse(saved) : INITIAL_TEAMS;
  });
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('cric_matches', JSON.stringify(matches));
    localStorage.setItem('cric_players', JSON.stringify(players));
    localStorage.setItem('cric_teams', JSON.stringify(teams));
  }, [matches, players, teams]);

  const playersWithCumulativeStats = useMemo(() => {
    const pMap = new Map<string, Player>(players.map(p => [p.id, { ...p, stats: { ...p.stats, runs: 0, wickets: 0, matches: 0, ballsFaced: 0, oversBowled: 0, runsConceded: 0 } }]));
    
    matches.forEach(m => {
      m.innings.forEach(inn => {
        Object.entries(inn.batsmenStats).forEach(([pid, s]) => {
          const p = pMap.get(pid);
          if (p) {
            p.stats.runs += s.runs;
            p.stats.ballsFaced += s.balls;
            p.stats.highScore = Math.max(p.stats.highScore, s.runs);
          }
        });
        Object.entries(inn.bowlersStats).forEach(([pid, s]) => {
          const p = pMap.get(pid);
          if (p) {
            p.stats.wickets += s.wickets;
            p.stats.oversBowled += s.overs + (s.balls / 6);
            p.stats.runsConceded += s.runs;
          }
        });
      });
    });

    return players.map(p => {
      const derived = pMap.get(p.id);
      if (derived && matches.length > 0) {
        return {
          ...p,
          stats: {
            ...p.stats,
            runs: p.stats.runs + (derived.stats.runs || 0),
            wickets: p.stats.wickets + (derived.stats.wickets || 0),
          }
        };
      }
      return p;
    });
  }, [players, matches]);

  const addMatch = (newMatch: Match) => setMatches([...matches, newMatch]);
  const updateMatch = (updatedMatch: Match) => setMatches(matches.map(m => m.id === updatedMatch.id ? updatedMatch : m));
  const deleteMatch = (id: string) => setMatches(matches.filter(m => m.id !== id));

  const addPlayer = (newPlayer: Player) => setPlayers([...players, newPlayer]);
  const updatePlayer = (updatedPlayer: Player) => setPlayers(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
  const deletePlayer = (id: string) => setPlayers(players.filter(p => p.id !== id));

  const addTeam = (newTeam: Team) => setTeams([...teams, newTeam]);
  const deleteTeam = (id: string) => setTeams(teams.filter(t => t.id !== id));

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard matches={matches} players={playersWithCumulativeStats} teams={teams} />;
      case 'matches':
        return (
          <MatchList 
            matches={matches} 
            teams={teams} 
            players={players}
            onAddMatch={addMatch} 
            onDeleteMatch={deleteMatch}
            onSelectMatch={(id) => { setActiveMatchId(id); setView('scorer'); }}
          />
        );
      case 'players':
        return <PlayerList players={players} teams={teams} onAddPlayer={addPlayer} onUpdatePlayer={updatePlayer} onDeletePlayer={deletePlayer} />;
      case 'teams':
        return <TeamManager teams={teams} players={players} onAddTeam={addTeam} onDeleteTeam={deleteTeam} />;
      case 'scorer':
        const match = matches.find(m => m.id === activeMatchId);
        if (!match) { setView('matches'); return null; }
        return <MatchScorer match={match} teams={teams} players={players} onUpdateMatch={updateMatch} onBack={() => setView('matches')} />;
      default:
        return <Dashboard matches={matches} players={playersWithCumulativeStats} teams={teams} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f1f5f9]">
      <Navigation currentView={view} setView={setView} />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto max-h-screen">
        <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
              {view} Engine
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">CricTrack Pro Integrated OS</p>
          </div>
          <div className="flex space-x-2">
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm animate-pulse">Live Status: Sync</span>
          </div>
        </header>
        {renderView()}
      </main>
    </div>
  );
};

export default App;
