
import React, { useState } from 'react';
import { Match, Player, Team } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  matches: Match[];
  players: Player[];
  teams: Team[];
}

const Dashboard: React.FC<DashboardProps> = ({ matches, players, teams }) => {
  const [tab, setTab] = useState<'overview' | 'batting' | 'bowling'>('overview');

  const stats = [
    { label: 'Total Matches', value: matches.length, icon: '🏟️', color: 'bg-indigo-600' },
    { label: 'Registered Teams', value: teams.length, icon: '🛡️', color: 'bg-emerald-600' },
    { label: 'Elite Players', value: players.length, icon: '👤', color: 'bg-violet-600' },
    { label: 'Active Events', value: matches.filter(m => m.status === 'Live').length, icon: '🔴', color: 'bg-rose-600' },
  ];

  const topScorers = [...players]
    .sort((a, b) => b.stats.runs - a.stats.runs)
    .slice(0, 10);

  const topBowlers = [...players]
    .sort((a, b) => b.stats.wickets - a.stats.wickets)
    .slice(0, 10);

  const COLORS = ['#6366f1', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <h3 className="text-[9px] font-black text-slate-400 mb-6 flex items-center uppercase tracking-[0.2em]">
          Power Ranking Alpha
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topScorers.slice(0, 6).map(p => ({ name: p.name.split(' ')[0], runs: p.stats.runs }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={9} fontWeight="900" axisLine={false} tickLine={false} />
              <YAxis fontSize={9} fontWeight="900" axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', fontSize: '10px' }}
              />
              <Bar dataKey="runs" radius={[8, 8, 0, 0]}>
                {topScorers.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Match Engine</h3>
          <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-full">Stream Ready</span>
        </div>
        <div className="space-y-3">
          {matches.slice(-5).reverse().map((match, i) => (
            <div key={match.id} className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105 ${
                match.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : match.status === 'Live' ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <span className="text-sm font-black">{match.status === 'Completed' ? '✓' : match.status === 'Live' ? '●' : '🕒'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-widest leading-none">
                  {match.type === 'Individual Player' ? 'FUN MODE' : (
                    <>
                      {teams.find(t => t.id === match.teamAId)?.shortName || 'T1'} 
                      <span className="text-slate-300 mx-1">V</span> 
                      {teams.find(t => t.id === match.teamBId)?.shortName || 'T2'}
                    </>
                  )}
                </p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70">{match.venue}</p>
              </div>
              <div className="text-[8px] font-black text-slate-400 uppercase bg-white px-2 py-1 rounded-lg border border-slate-100">
                {match.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = (data: Player[], type: 'batting' | 'bowling') => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
       <div className="overflow-x-auto custom-scrollbar">
         <table className="w-full text-left">
           <thead>
             <tr className="bg-slate-50/50 border-b border-slate-100">
               <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Rank</th>
               <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile</th>
               <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Team</th>
               <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {type === 'batting' ? 'Runs' : 'Wkts'}
               </th>
               <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Efficiency
               </th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
              {data.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-50/20 transition-all group">
                  <td className="px-6 py-4">
                     <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-inner ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'}`}>
                       {idx + 1}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img src={p.imageUrl || `https://picsum.photos/seed/${p.id}/40`} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <div>
                        <p className="font-black text-slate-900 text-xs uppercase tracking-widest">{p.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase">{p.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">
                      {teams.find(t => t.id === p.teamId)?.shortName || 'PRO'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 text-lg tracking-tighter">
                     {type === 'batting' ? p.stats.runs : p.stats.wickets}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-400 text-[9px] tracking-widest">
                     {type === 'batting' ? `AVG: ${(p.stats.runs / Math.max(1, p.stats.matches)).toFixed(1)}` : `ECN: ${(p.stats.runsConceded / Math.max(1, p.stats.oversBowled)).toFixed(2)}`}
                  </td>
                </tr>
              ))}
           </tbody>
         </table>
       </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:-translate-y-1 transition-all group">
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-xl mb-4 text-white shadow-lg group-hover:rotate-6 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex space-x-2 bg-slate-100/50 p-1.5 rounded-full w-fit border border-slate-100 shadow-inner">
        {(['overview', 'batting', 'bowling'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all ${tab === t ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && renderOverview()}
      {tab === 'batting' && renderLeaderboard(topScorers, 'batting')}
      {tab === 'bowling' && renderLeaderboard(topBowlers, 'bowling')}
    </div>
  );
};

export default Dashboard;
