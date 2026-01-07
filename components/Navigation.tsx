
import React from 'react';

interface NavigationProps {
  currentView: string;
  setView: (view: 'dashboard' | 'matches' | 'players' | 'teams' | 'scorer') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'matches', label: 'Matches', icon: '🏏' },
    { id: 'players', label: 'Players', icon: '👤' },
    { id: 'teams', label: 'Teams', icon: '🛡️' },
  ];

  return (
    <nav className="w-full md:w-56 bg-white border-r border-gray-200 flex flex-col h-auto md:h-screen sticky top-0 z-50">
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-lg shadow-lg">
            🏏
          </div>
          <span className="text-lg font-black text-gray-900 uppercase tracking-tighter">CricTrack</span>
        </div>
        
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 text-xs font-black uppercase tracking-widest ${
                currentView === item.id 
                  ? 'bg-emerald-50 text-emerald-700 shadow-inner' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-2xl p-3 flex items-center space-x-2 border border-slate-100">
          <img src="https://picsum.photos/32/32" className="rounded-full w-8 h-8 border-2 border-white shadow-sm" alt="Profile" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-gray-900 truncate uppercase">Admin User</p>
            <p className="text-[8px] font-bold text-gray-400 truncate uppercase">Tier: Pro</p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
