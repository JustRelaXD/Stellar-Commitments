import React from 'react';
import type { GlobalStats } from '../types';

interface GlobalStatsProps {
  stats: GlobalStats;
  userCompleted: number;
}

export const GlobalStatsBar: React.FC<GlobalStatsProps> = ({ stats, userCompleted }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="card text-center py-4">
        <p className="text-2xl font-bold text-white">{stats.total_vaults}</p>
        <p className="text-xs text-gray-500 mt-1">Total Vaults</p>
      </div>
      <div className="card text-center py-4">
        <p className="text-2xl font-bold text-emerald-400">{stats.total_completed}</p>
        <p className="text-xs text-gray-500 mt-1">Completed</p>
      </div>
      <div className="card text-center py-4">
        <p className="text-2xl font-bold text-stellar-400">{stats.total_staked} XLM</p>
        <p className="text-xs text-gray-500 mt-1">Total Staked</p>
      </div>
      <div className="card text-center py-4">
        <p className="text-2xl font-bold text-amber-400">{stats.total_donated} XLM</p>
        <p className="text-xs text-gray-500 mt-1">Donated to Charity</p>
      </div>
    </div>
  );
};
