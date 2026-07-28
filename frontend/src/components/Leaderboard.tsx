import React from 'react';

interface LeaderboardEntry {
  address: string;
  completed: number;
  totalStaked: number;
  totalReturned: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries }) => {
  const sorted = [...entries].sort((a, b) => b.completed - a.completed);

  if (sorted.length === 0) {
    return (
      <div className="card text-center py-8">
        <svg className="w-10 h-10 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-500 text-sm">No vault completers yet</p>
      </div>
    );
  }

  const getRankIcon = (i: number) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  };

  const getRankStyle = (i: number) => {
    if (i === 0) return 'border-amber-500/30 bg-amber-500/5';
    if (i === 1) return 'border-gray-400/30 bg-gray-400/5';
    if (i === 2) return 'border-orange-600/30 bg-orange-600/5';
    return 'border-gray-800';
  };

  return (
    <div className="card">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-stellar-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Leaderboard
      </h3>
      <div className="space-y-2">
        {sorted.map((entry, i) => (
          <div
            key={entry.address}
            className={`flex items-center gap-3 p-3 rounded-xl border ${getRankStyle(i)} transition-all hover:bg-gray-800/40`}
          >
            <div className="w-8 text-center text-sm font-bold">
              {getRankIcon(i)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {entry.address.slice(0, 4)}...{entry.address.slice(-4)}
              </p>
              <p className="text-xs text-gray-500">
                {entry.completed} vault{entry.completed !== 1 ? 's' : ''} completed
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-emerald-400 font-medium">{entry.totalReturned} XLM</p>
              <p className="text-xs text-gray-500">returned</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
